import type { BarberSummary } from "@barberops/shared";
import { Card } from "@/components/ui/Card";
import { StatusDot } from "@/components/barber/StatusDot";
import { useElapsedTime } from "@/hooks/use-elapsed-time";

export function BarberLiveCard({ barber }: { barber: BarberSummary }) {
  const { formatted } = useElapsedTime(barber.activeSession?.startedAt ?? null);

  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-slate-900">{barber.displayName}</p>
        <StatusDot status={barber.currentStatus} />
      </div>
      {barber.activeSession ? (
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="text-slate-600">{barber.activeSession.serviceName}</span>
          <span className="font-mono font-semibold text-slate-900">{formatted}</span>
        </div>
      ) : (
        <p className="mt-1 text-sm text-slate-400">Sin servicio activo</p>
      )}
    </Card>
  );
}
