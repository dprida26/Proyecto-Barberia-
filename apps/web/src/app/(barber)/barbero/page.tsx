"use client";

import { useMemo, useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { StatusDot } from "@/components/barber/StatusDot";
import { useElapsedTime } from "@/hooks/use-elapsed-time";
import {
  useActiveServices,
  useCancelService,
  useFinishService,
  useMyTodaySessions,
  useStartService,
} from "@/features/barber-session/use-barber-session";
import { useSessionStore } from "@/stores/session.store";

function BarberScreen() {
  const user = useSessionStore((s) => s.user);
  const clearSession = useSessionStore((s) => s.clearSession);

  const { data: services, isLoading: loadingServices } = useActiveServices();
  const { data: todaySessions } = useMyTodaySessions();
  const startService = useStartService();
  const finishService = useFinishService();
  const cancelService = useCancelService();

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [observations, setObservations] = useState("");

  const activeSession = useMemo(
    () => todaySessions?.find((s) => s.status === "IN_SERVICE") ?? null,
    [todaySessions],
  );

  const completedToday = useMemo(
    () => todaySessions?.filter((s) => s.status === "COMPLETED") ?? [],
    [todaySessions],
  );

  const { formatted: elapsed } = useElapsedTime(activeSession?.startedAt ?? null);

  async function handleStart() {
    if (!selectedServiceId) return;
    await startService.mutateAsync({
      serviceId: selectedServiceId,
      clientNameFree: clientName || undefined,
      observations: observations || undefined,
    });
    setSelectedServiceId(null);
    setClientName("");
    setObservations("");
  }

  async function handleFinish() {
    if (!activeSession) return;
    await finishService.mutateAsync(activeSession.id);
  }

  async function handleCancel() {
    if (!activeSession) return;
    await cancelService.mutateAsync({ sessionId: activeSession.id });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hola, {user?.displayName}</h1>
          <StatusDot status={activeSession ? "IN_SERVICE" : "AVAILABLE"} />
        </div>
        <Button variant="ghost" onClick={clearSession} className="min-h-0 px-3 py-2 text-sm">
          Salir
        </Button>
      </header>

      {activeSession ? (
        <Card className="flex flex-col items-center gap-3 bg-emerald-50 py-8">
          <p className="text-sm font-medium text-emerald-700">Servicio en curso</p>
          <p className="text-lg font-semibold text-slate-900">
            {services?.find((s) => s.id === activeSession.serviceId)?.name ?? "Servicio"}
          </p>
          <p className="font-mono text-5xl font-bold tabular-nums text-emerald-700">{elapsed}</p>
          <div className="flex w-full gap-3">
            <Button variant="danger" onClick={handleCancel} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleFinish} disabled={finishService.isPending} className="flex-1">
              Finalizar servicio
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col gap-4">
          <h2 className="text-base font-semibold text-slate-900">Seleccionar servicio</h2>

          {loadingServices && <p className="text-sm text-slate-500">Cargando servicios...</p>}

          <div className="grid grid-cols-2 gap-3">
            {services?.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedServiceId(service.id)}
                className={`min-h-[64px] rounded-xl border-2 px-3 py-3 text-left text-sm font-semibold transition-colors ${
                  selectedServiceId === service.id
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                }`}
              >
                {service.name}
              </button>
            ))}
          </div>

          {selectedServiceId && (
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
              <Input
                placeholder="Cliente (opcional)"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
              <Input
                placeholder="Observaciones (opcional)"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
              />
              <Button onClick={handleStart} disabled={startService.isPending}>
                Iniciar servicio
              </Button>
            </div>
          )}
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Hoy</h2>
        {completedToday.length === 0 ? (
          <p className="text-sm text-slate-500">Aun no completaste servicios hoy.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {completedToday.map((session) => (
              <li key={session.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{session.serviceName}</span>
                <span className="text-slate-400">
                  {session.durationSeconds ? Math.round(session.durationSeconds / 60) : 0} min
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm font-medium text-slate-900">
          Total servicios: {completedToday.length}
        </p>
      </Card>
    </main>
  );
}

export default function BarberPage() {
  return (
    <AuthGuard role="BARBER">
      <BarberScreen />
    </AuthGuard>
  );
}
