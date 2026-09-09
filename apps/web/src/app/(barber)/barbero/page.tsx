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
import { resolveLogoUrl } from "@/lib/env";

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

  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [clientName, setClientName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "TRANSFER">("CASH");
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  const clientNameRequired = paymentMethod === "TRANSFER";
  const clientNameMissing = clientNameRequired && !clientName.trim();

  function toggleService(serviceId: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    );
  }

  const selectedTotalPrice = useMemo(
    () =>
      (services ?? [])
        .filter((s) => selectedServiceIds.includes(s.id))
        .reduce((sum, s) => sum + Number(s.currentPrice), 0),
    [services, selectedServiceIds],
  );

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
        label: session.services.map((s) => s.serviceName).join(" + "),
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
    if (selectedServiceIds.length === 0 || clientNameMissing) return;
    await startService.mutateAsync({
      serviceIds: selectedServiceIds,
      clientNameFree: clientName || undefined,
      paymentMethod,
    });
    setSelectedServiceIds([]);
    setClientName("");
    setPaymentMethod("CASH");
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
              src={resolveLogoUrl(tenant.logoUrl)!}
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
            <div className="flex flex-wrap justify-center gap-1.5">
              {activeSession.services.map((s) => (
                <Badge key={s.serviceId} variant="primary">
                  {s.serviceName}
                </Badge>
              ))}
            </div>
            <p className="font-mono text-5xl font-bold tabular-nums text-success">{elapsed}</p>
            <p className="text-sm text-muted-foreground">
              Total: Gs. {Number(activeSession.totalPrice).toLocaleString("es-PY")}
            </p>
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
              {services?.map((service) => {
                const selected = selectedServiceIds.includes(service.id);
                return (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={cn(
                      "relative min-h-[68px] rounded-xl border-2 px-3 py-3 text-left text-sm font-semibold transition-colors",
                      selected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-background text-foreground hover:border-primary/40",
                    )}
                  >
                    {selected && (
                      <CheckCircle2 className="absolute right-2 top-2 h-4 w-4 text-primary" />
                    )}
                    {service.name}
                  </button>
                );
              })}
            </div>

            {selectedServiceIds.length > 0 && (
              <div className="flex flex-col gap-3 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  Total ({selectedServiceIds.length}{" "}
                  {selectedServiceIds.length === 1 ? "servicio" : "servicios"}):{" "}
                  <span className="font-semibold text-foreground">
                    Gs. {selectedTotalPrice.toLocaleString("es-PY")}
                  </span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CASH")}
                    className={cn(
                      "rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-colors",
                      paymentMethod === "CASH"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-background text-foreground hover:border-primary/40",
                    )}
                  >
                    Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("TRANSFER")}
                    className={cn(
                      "rounded-lg border-2 px-3 py-2.5 text-sm font-semibold transition-colors",
                      paymentMethod === "TRANSFER"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-background text-foreground hover:border-primary/40",
                    )}
                  >
                    Transferencia
                  </button>
                </div>
                <div className="flex flex-col gap-1">
                  <Input
                    placeholder={clientNameRequired ? "Cliente (obligatorio)" : "Cliente (opcional)"}
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className={cn(clientNameMissing && "border-destructive focus-visible:ring-destructive")}
                  />
                  {clientNameMissing && (
                    <p className="text-xs text-destructive">
                      El nombre del cliente es obligatorio para pagos por transferencia.
                    </p>
                  )}
                </div>
                <Button
                  size="lg"
                  onClick={handleStart}
                  disabled={startService.isPending || clientNameMissing}
                >
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
