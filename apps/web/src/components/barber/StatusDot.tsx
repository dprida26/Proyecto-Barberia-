import type { BarberStatus } from "@barberops/shared";
import { cn } from "@/lib/utils";

const statusConfig: Record<BarberStatus, { dot: string; text: string; label: string }> = {
  AVAILABLE: { dot: "bg-primary", text: "text-primary", label: "Disponible" },
  WAITING: { dot: "bg-warning", text: "text-warning-foreground", label: "En espera" },
  IN_SERVICE: { dot: "bg-success", text: "text-success", label: "En servicio" },
};

export function StatusDot({ status }: { status: BarberStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm font-medium", config.text)}>
      <span className={cn("h-2.5 w-2.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
