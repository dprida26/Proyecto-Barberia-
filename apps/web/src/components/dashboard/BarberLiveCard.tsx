import type { BarberSummary } from "@barberops/shared";
import { Card } from "@/components/ui/card";
import { StatusDot } from "@/components/barber/StatusDot";
import { useElapsedTime } from "@/hooks/use-elapsed-time";

function formatGs(value: string | number) {
  return `Gs. ${Number(value).toLocaleString("es-PY")}`;
}

export function BarberLiveCard({ barber }: { barber: BarberSummary }) {
  const { formatted } = useElapsedTime(barber.activeSession?.startedAt ?? null);

  return (
    <Card className="flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-foreground">{barber.displayName}</p>
        <StatusDot status={barber.currentStatus} />
      </div>
      {barber.activeSession ? (
        <div className="flex items-center justify-between text-sm">
          <span className="truncate text-muted-foreground">
            {barber.activeSession.services.map((s) => s.serviceName).join(" + ")}
          </span>
          <span className="font-mono text-base font-semibold tabular-nums text-foreground">{formatted}</span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sin servicio activo</p>
      )}

      <div className="flex flex-col gap-1.5 border-t pt-3">
        <p className="text-xs text-muted-foreground">
          Produccion de hoy · {barber.todayProduction.servicesCount} servicios
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-success/10 px-3 py-2">
            <p className="text-xs text-muted-foreground">Para el barbero</p>
            <p className="text-sm font-semibold text-success">{formatGs(barber.todayProduction.barberEarning)}</p>
          </div>
          <div className="rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-xs text-muted-foreground">Para la barberia</p>
            <p className="text-sm font-semibold text-foreground">{formatGs(barber.todayProduction.businessEarning)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
