"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Building2, Scissors, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiBaseUrl } from "@/lib/env";
import { useTenantSettings, useUpdateTenantSettings, useUploadLogo } from "@/features/tenant-settings/use-tenant-settings";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

export default function ConfiguracionPage() {
  const { data: tenant, isLoading } = useTenantSettings();
  const updateSettings = useUpdateTenantSettings();
  const uploadLogo = useUploadLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ name: "", phone: "", address: "", businessHours: "" });

  useEffect(() => {
    if (tenant) {
      setForm({
        name: tenant.name,
        phone: tenant.phone ?? "",
        address: tenant.address ?? "",
        businessHours: tenant.businessHours ?? "",
      });
    }
  }, [tenant]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await updateSettings.mutateAsync({
      name: form.name,
      phone: form.phone || undefined,
      address: form.address || undefined,
      businessHours: form.businessHours || undefined,
    });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      uploadLogo.reset();
      alert("Formato no soportado. Usa PNG, JPG o WEBP.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      alert("La imagen no puede superar los 2MB.");
      return;
    }
    uploadLogo.mutate(file);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Identidad y datos generales del negocio.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-4 w-4 text-primary" />
            Identidad del negocio
          </CardTitle>
          <CardDescription>El logo se muestra en el panel administrativo.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
            {tenant?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`${apiBaseUrl}${tenant.logoUrl}`}
                alt="Logo del negocio"
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLogo.isPending}
            >
              <Upload className="h-4 w-4" />
              {uploadLogo.isPending ? "Subiendo..." : "Subir logo"}
            </Button>
            <p className="text-xs text-muted-foreground">PNG, JPG o WEBP. Maximo 2MB.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Datos generales</CardTitle>
          <CardDescription>Nombre y contacto de la barberia.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="name">Nombre del negocio</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="phone">Telefono</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="address">Direccion</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label htmlFor="businessHours">Horario de atencion</Label>
                  <Input
                    id="businessHours"
                    placeholder="Lunes a sabado, 9:00 - 19:00"
                    value={form.businessHours}
                    onChange={(e) => setForm((f) => ({ ...f, businessHours: e.target.value }))}
                  />
                </div>
              </div>

              <Button type="submit" disabled={updateSettings.isPending} className="self-start">
                Guardar cambios
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
