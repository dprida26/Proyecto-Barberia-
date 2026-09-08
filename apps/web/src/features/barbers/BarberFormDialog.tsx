"use client";

import { FormEvent, useEffect, useState } from "react";
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
import { useCreateBarber, useUpdateBarber, type BarberAdminItem } from "./use-barbers-admin";

interface BarberFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barber?: BarberAdminItem | null;
}

const emptyForm = { displayName: "", email: "", password: "", isAvailable: true };

export function BarberFormDialog({ open, onOpenChange, barber }: BarberFormDialogProps) {
  const isEdit = Boolean(barber);
  const createBarber = useCreateBarber();
  const updateBarber = useUpdateBarber();
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) {
      setForm(
        barber
          ? { displayName: barber.displayName, email: barber.user.email, password: "", isAvailable: barber.isAvailable }
          : emptyForm,
      );
    }
  }, [open, barber]);

  const isPending = createBarber.isPending || updateBarber.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (isEdit && barber) {
      await updateBarber.mutateAsync({
        id: barber.id,
        input: { displayName: form.displayName, email: form.email, isAvailable: form.isAvailable },
      });
    } else {
      await createBarber.mutateAsync({
        displayName: form.displayName,
        email: form.email,
        password: form.password,
      });
    }
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar barbero" : "Nuevo barbero"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Actualiza los datos del barbero."
                : "El barbero podra iniciar sesion con estas credenciales."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="displayName">Nombre</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            {!isEdit && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Contrasena</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
            )}
            {isEdit && (
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm font-medium">Disponible</p>
                  <p className="text-xs text-muted-foreground">Puede recibir nuevos servicios</p>
                </div>
                <Switch
                  checked={form.isAvailable}
                  onCheckedChange={(checked) => setForm((f) => ({ ...f, isAvailable: checked }))}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isEdit ? "Guardar cambios" : "Crear barbero"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
