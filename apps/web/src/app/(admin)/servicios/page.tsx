"use client";

import { FormEvent, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useAllServices, useCreateService, useUpdateService } from "@/features/services/use-services-admin";

export default function ServiciosPage() {
  const { data: services, isLoading } = useAllServices();
  const createService = useCreateService();
  const updateService = useUpdateService();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await createService.mutateAsync({
      name,
      category: category || undefined,
      durationEstimateMin: Number(duration),
      currentPrice: Number(price),
      isActive: true,
    });
    setName("");
    setCategory("");
    setDuration("30");
    setPrice("");
  }

  async function toggleActive(id: string, isActive: boolean) {
    await updateService.mutateAsync({ id, input: { isActive: !isActive } });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Nuevo servicio</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input placeholder="Categoria" value={category} onChange={(e) => setCategory(e.target.value)} />
          <Input
            type="number"
            placeholder="Duracion (min)"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />
          <Input
            type="number"
            placeholder="Precio"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
          <Button type="submit" disabled={createService.isPending} className="sm:col-span-2">
            Crear servicio
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Catalogo</h2>
        {isLoading && <p className="text-sm text-slate-500">Cargando...</p>}
        <div className="flex flex-col divide-y divide-slate-100">
          {services?.map((service) => (
            <div key={service.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-slate-900">{service.name}</p>
                <p className="text-sm text-slate-500">
                  Gs. {Number(service.currentPrice).toLocaleString("es-PY")} · {service.durationEstimateMin} min
                </p>
              </div>
              <Button
                variant={service.isActive ? "secondary" : "primary"}
                className="min-h-0 px-3 py-2 text-sm"
                onClick={() => toggleActive(service.id, service.isActive)}
              >
                {service.isActive ? "Desactivar" : "Activar"}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
