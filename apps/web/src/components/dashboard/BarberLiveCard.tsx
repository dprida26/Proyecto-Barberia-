import type { BarberSummary } from "@barberops/shared";
import { Card } from "@/components/ui/card";
import { StatusDot } from "@/components/barber/StatusDot";
import { useElapsedTime } from "@/hooks/use-elapsed-time";

export function BarberLiveCard({ barber }: { barber: BarberSummary }) {
  const { formatted } = useElapsedTime(barber.activeSession?.startedAt ?? null);

  return (
    <Card className="flex flex-col gap-2 p-5">
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
    </Card>
  );
}
