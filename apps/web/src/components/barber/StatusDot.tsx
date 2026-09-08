import type { BarberStatus } from "@barberops/shared";

const statusConfig: Record<BarberStatus, { color: string; label: string }> = {
  AVAILABLE: { color: "bg-blue-500", label: "Disponible" },
  WAITING: { color: "bg-amber-400", label: "En espera" },
  IN_SERVICE: { color: "bg-emerald-500", label: "En servicio" },
};

export function StatusDot({ status }: { status: BarberStatus }) {
  const config = statusConfig[status];
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
      <span className={`h-2.5 w-2.5 rounded-full ${config.color}`} />
      {config.label}
    </span>
  );
}
