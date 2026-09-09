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
import { useCreateService, useUpdateService } from "./use-services-admin";

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
};

export function ServiceFormDialog({ open, onOpenChange, service }: ServiceFormDialogProps) {
  const isEdit = Boolean(service);
  const createService = useCreateService();
  const updateService = useUpdateService();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(
        service
          ? {
              name: service.name,
              category: service.category ?? "",
              durationEstimateMin: String(service.durationEstimateMin),
              currentPrice: String(service.currentPrice),
            }
          : emptyForm,
      );
    }
  }, [open, service]);

  const isPending = createService.isPending || updateService.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const payload = {
      name: form.name,
      category: form.category || undefined,
      durationEstimateMin: Number(form.durationEstimateMin),
      currentPrice: Number(form.currentPrice),
    };

    if (isEdit && service) {
      await updateService.mutateAsync({ id: service.id, input: payload });
    } else {
      await createService.mutateAsync({ ...payload, isActive: true });
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
          </div>

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
