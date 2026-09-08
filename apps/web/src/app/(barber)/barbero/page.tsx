"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, LogOut, Scissors, Sparkles } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/barber/StatusDot";
import { cn } from "@/lib/utils";
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 bg-muted/30 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Hola, {user?.displayName}</h1>
          <StatusDot status={activeSession ? "IN_SERVICE" : "AVAILABLE"} />
        </div>
        <Button variant="ghost" size="icon" onClick={clearSession} aria-label="Cerrar sesion">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      {activeSession ? (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <Badge variant="success">Servicio en curso</Badge>
            <p className="text-lg font-semibold text-foreground">
              {services?.find((s) => s.id === activeSession.serviceId)?.name ?? "Servicio"}
            </p>
            <p className="font-mono text-5xl font-bold tabular-nums text-success">{elapsed}</p>
            <div className="flex w-full gap-3 pt-2">
              <Button variant="destructive" onClick={handleCancel} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleFinish} disabled={finishService.isPending} className="flex-1">
                <CheckCircle2 className="h-4 w-4" />
                Finalizar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scissors className="h-4 w-4 text-primary" />
              Seleccionar servicio
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {loadingServices && <p className="text-sm text-muted-foreground">Cargando servicios...</p>}

            <div className="grid grid-cols-2 gap-3">
              {services?.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedServiceId(service.id)}
                  className={cn(
                    "min-h-[68px] rounded-xl border-2 px-3 py-3 text-left text-sm font-semibold transition-colors",
                    selectedServiceId === service.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background text-foreground hover:border-primary/40",
                  )}
                >
                  {service.name}
                </button>
              ))}
            </div>

            {selectedServiceId && (
              <div className="flex flex-col gap-3 border-t border-border pt-4">
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
                <Button size="lg" onClick={handleStart} disabled={startService.isPending}>
                  <Sparkles className="h-4 w-4" />
                  Iniciar servicio
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Hoy</CardTitle>
          <Badge variant="primary">{completedToday.length} servicios</Badge>
        </CardHeader>
        <CardContent>
          {completedToday.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aun no completaste servicios hoy.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {completedToday.map((session) => (
                <li key={session.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-foreground">{session.serviceName}</span>
                  <span className="text-muted-foreground">
                    {session.durationSeconds ? Math.round(session.durationSeconds / 60) : 0} min
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
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
