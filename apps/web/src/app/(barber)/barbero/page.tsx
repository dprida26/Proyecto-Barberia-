"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, LogOut, Scissors, Sparkles } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusDot } from "@/components/barber/StatusDot";
import { cn } from "@/lib/utils";
import { useElapsedTime } from "@/hooks/use-elapsed-time";
import {
  useActiveServices,
  useCancelService,
  useFinishService,
  useMySummary,
  useMyTodaySessions,
  useStartService,
} from "@/features/barber-session/use-barber-session";
import { EarningsSummarySection } from "@/features/barber-session/EarningsSummarySection";
import { useSessionStore } from "@/stores/session.store";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTenantSettings } from "@/features/tenant-settings/use-tenant-settings";
import { apiBaseUrl } from "@/lib/env";

function BarberScreen() {
  const user = useSessionStore((s) => s.user);
  const clearSession = useSessionStore((s) => s.clearSession);
  const { data: tenant } = useTenantSettings();

  const { data: services, isLoading: loadingServices } = useActiveServices();
  const { data: todaySessions } = useMyTodaySessions();
  const { data: weekSummary } = useMySummary("week");
  const { data: monthSummary } = useMySummary("month");
  const startService = useStartService();
  const finishService = useFinishService();
  const cancelService = useCancelService();

  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [clientName, setClientName] = useState("");
  const [observations, setObservations] = useState("");
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const activeSession = useMemo(
    () => todaySessions?.find((s) => s.status === "IN_SERVICE") ?? null,
    [todaySessions],
  );

  const completedToday = useMemo(
    () => todaySessions?.filter((s) => s.status === "COMPLETED") ?? [],
    [todaySessions],
  );

  const todayEarningsBySession = useMemo(
    () =>
      completedToday.map((session) => ({
        sessionId: session.id,
        label: session.serviceName,
        time: new Date(session.startedAt).toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" }),
        barberEarning: Number(session.barberEarning ?? 0),
        businessEarning: Number(session.businessEarning ?? 0),
      })),
    [completedToday],
  );

  const todayTotals = useMemo(
    () =>
      completedToday.reduce(
        (acc, session) => ({
          barberEarning: acc.barberEarning + Number(session.barberEarning ?? 0),
          businessEarning: acc.businessEarning + Number(session.businessEarning ?? 0),
        }),
        { barberEarning: 0, businessEarning: 0 },
      ),
    [completedToday],
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

  async function confirmCancel() {
    if (!activeSession) return;
    await cancelService.mutateAsync({ sessionId: activeSession.id });
    setCancelConfirmOpen(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col gap-4 bg-muted/30 px-4 py-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {tenant?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${apiBaseUrl}${tenant.logoUrl}`}
              alt={tenant.name}
              className="h-10 w-10 shrink-0 rounded-lg object-cover"
            />
          ) : null}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Hola, {user?.displayName}</h1>
            <StatusDot status={activeSession ? "IN_SERVICE" : "AVAILABLE"} />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={clearSession} aria-label="Cerrar sesion">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
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
              <Button variant="destructive" onClick={() => setCancelConfirmOpen(true)} className="flex-1">
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

      <h2 className="mt-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Mi ganancia</h2>

      <EarningsSummarySection
        title="Hoy"
        totalBarberEarning={todayTotals.barberEarning.toFixed(2)}
        totalBusinessEarning={todayTotals.businessEarning.toFixed(2)}
        items={todayEarningsBySession.map((item) => ({
          key: item.sessionId,
          label: item.label,
          time: item.time,
          barberEarning: item.barberEarning.toFixed(2),
          businessEarning: item.businessEarning.toFixed(2),
        }))}
        emptyLabel="Aun no completaste servicios hoy."
        defaultOpen
      />

      <EarningsSummarySection
        title="Esta semana"
        totalBarberEarning={weekSummary?.totalBarberEarning ?? "0.00"}
        totalBusinessEarning={weekSummary?.totalBusinessEarning ?? "0.00"}
        items={
          weekSummary?.byService.map((item) => ({
            key: item.serviceId,
            label: item.serviceName,
            count: item.count,
            barberEarning: item.barberEarning,
            businessEarning: item.businessEarning,
          })) ?? []
        }
        emptyLabel="Aun no completaste servicios esta semana."
      />

      <EarningsSummarySection
        title="Este mes"
        totalBarberEarning={monthSummary?.totalBarberEarning ?? "0.00"}
        totalBusinessEarning={monthSummary?.totalBusinessEarning ?? "0.00"}
        items={
          monthSummary?.byService.map((item) => ({
            key: item.serviceId,
            label: item.serviceName,
            count: item.count,
            barberEarning: item.barberEarning,
            businessEarning: item.businessEarning,
          })) ?? []
        }
        emptyLabel="Aun no completaste servicios este mes."
      />

      <AlertDialog open={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar servicio</AlertDialogTitle>
            <AlertDialogDescription>
              El servicio en curso se cancelara y no se contara como completado. Esta accion no se puede
              deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancel}>Si, cancelar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
