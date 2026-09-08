"use client";

import { FormEvent, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useBarbersAdmin, useCreateBarber, useUpdateBarber } from "@/features/barbers/use-barbers-admin";

export default function BarberosPage() {
  const { data: barbers, isLoading } = useBarbersAdmin();
  const createBarber = useCreateBarber();
  const updateBarber = useUpdateBarber();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    await createBarber.mutateAsync({ displayName, email, password });
    setDisplayName("");
    setEmail("");
    setPassword("");
  }

  async function toggleAvailable(id: string, isAvailable: boolean) {
    await updateBarber.mutateAsync({ id, input: { isAvailable: !isAvailable } });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Nuevo barbero</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            placeholder="Nombre"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Contrasena"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" disabled={createBarber.isPending} className="sm:col-span-3">
            Crear barbero
          </Button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Barberos</h2>
        {isLoading && <p className="text-sm text-slate-500">Cargando...</p>}
        <div className="flex flex-col divide-y divide-slate-100">
          {barbers?.map((barber) => (
            <div key={barber.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-slate-900">{barber.displayName}</p>
                <p className="text-sm text-slate-500">{barber.user.email}</p>
              </div>
              <Button
                variant={barber.isAvailable ? "secondary" : "primary"}
                className="min-h-0 px-3 py-2 text-sm"
                onClick={() => toggleAvailable(barber.id, barber.isAvailable)}
              >
                {barber.isAvailable ? "Desactivar" : "Activar"}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
