"use client";

import { FormEvent, useEffect, useState } from "react";
import type { ServiceCatalogItem } from "@barberops/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCreateService, useUpdateService } from "./use-services-admin";
import { useCommissionOverrides, useSetCommissionOverrides } from "./use-service-commission-overrides";
import { useBarbersAdmin } from "@/features/barbers/use-barbers-admin";

interface ServiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: ServiceCatalogItem | null;
}

const emptyForm = {
  name: "",
  category: "",
  durationEstimateMin: "30",
  currentPrice: "",
  wednesdayPrice: "",
};

export function ServiceFormDialog({ open, onOpenChange, service }: ServiceFormDialogProps) {
  const isEdit = Boolean(service);
  const createService = useCreateService();
  const updateService = useUpdateService();
  const setCommissionOverrides = useSetCommissionOverrides();
  const [form, setForm] = useState(emptyForm);
  const [specialCommissionEnabled, setSpecialCommissionEnabled] = useState(false);
  const [overridesByBarber, setOverridesByBarber] = useState<Record<string, string>>({});

  const { data: activeBarbers } = useBarbersAdmin();
  const barbers = (activeBarbers ?? []).filter((b) => b.user.isActive);

  const { data: existingOverrides } = useCommissionOverrides(service?.id, open && isEdit);

  useEffect(() => {
    if (open) {
      setForm(
        service
          ? {
              name: service.name,
              category: service.category ?? "",
              durationEstimateMin: String(service.durationEstimateMin),
              currentPrice: String(service.currentPrice),
              wednesdayPrice: service.wednesdayPrice ? String(service.wednesdayPrice) : "",
            }
          : emptyForm,
      );
      if (!isEdit) {
        setSpecialCommissionEnabled(false);
        setOverridesByBarber({});
      }
    }
  }, [open, service, isEdit]);

  useEffect(() => {
    if (open && isEdit && existingOverrides) {
      setSpecialCommissionEnabled(existingOverrides.length > 0);
      setOverridesByBarber(
        Object.fromEntries(existingOverrides.map((o) => [o.barberId, o.commissionPercent])),
      );
    }
  }, [open, isEdit, existingOverrides]);

  const isPending = createService.isPending || updateService.isPending || setCommissionOverrides.isPending;

  function setOverride(barberId: string, value: string) {
    setOverridesByBarber((prev) => ({ ...prev, [barberId]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const payload = {
      name: form.name,
      category: form.category || undefined,
      durationEstimateMin: Number(form.durationEstimateMin),
      currentPrice: Number(form.currentPrice),
      wednesdayPrice: form.wednesdayPrice ? Number(form.wednesdayPrice) : null,
    };

    let serviceId = service?.id;
    if (isEdit && service) {
      await updateService.mutateAsync({ id: service.id, input: payload });
    } else {
      const created = await createService.mutateAsync({ ...payload, isActive: true });
      serviceId = created.data.id;
    }

    if (serviceId) {
      const overrides = specialCommissionEnabled
        ? Object.entries(overridesByBarber)
            .filter(([, value]) => value.trim() !== "")
            .map(([barberId, value]) => ({ barberId, commissionPercent: Number(value) }))
        : [];
      await setCommissionOverrides.mutateAsync({ serviceId, overrides });
    }

    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Los cambios de precio no afectan servicios ya registrados."
                : "Completa los datos del nuevo servicio del catalogo."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="duration">Duracion (min)</Label>
              <Input
                id="duration"
                type="number"
                min={1}
                value={form.durationEstimateMin}
                onChange={(e) => setForm((f) => ({ ...f, durationEstimateMin: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price">Precio (Gs.)</Label>
              <Input
                id="price"
                type="number"
                min={0}
                value={form.currentPrice}
                onChange={(e) => setForm((f) => ({ ...f, currentPrice: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="wednesdayPrice">Precio miercoles (Gs., opcional)</Label>
              <Input
                id="wednesdayPrice"
                type="number"
                min={0}
                value={form.wednesdayPrice}
                onChange={(e) => setForm((f) => ({ ...f, wednesdayPrice: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div className="flex flex-col gap-0.5">
              <Label htmlFor="specialCommission">Comision especial por barbero</Label>
              <span className="text-xs text-muted-foreground">
                Define un % distinto al general de cada barbero para este servicio.
              </span>
            </div>
            <Switch
              id="specialCommission"
              checked={specialCommissionEnabled}
              onCheckedChange={setSpecialCommissionEnabled}
            />
          </div>

          {specialCommissionEnabled && (
            <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
              {barbers.length === 0 && (
                <span className="text-sm text-muted-foreground">No hay barberos activos.</span>
              )}
              {barbers.map((barber) => (
                <div key={barber.id} className="flex items-center justify-between gap-2">
                  <span className="text-sm">{barber.displayName}</span>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="w-24"
                    placeholder={`${barber.commissionPercent}% (general)`}
                    value={overridesByBarber[barber.id] ?? ""}
                    onChange={(e) => setOverride(barber.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isEdit ? "Guardar cambios" : "Crear servicio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
