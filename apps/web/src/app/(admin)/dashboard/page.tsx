"use client";

import { useDashboardLive } from "@/features/dashboard/use-dashboard-live";
import { BarberLiveCard } from "@/components/dashboard/BarberLiveCard";
import { KpiCard } from "@/components/dashboard/KpiCard";

export default function DashboardPage() {
  const { data, isLoading } = useDashboardLive();

  if (isLoading || !data) {
    return <p className="text-sm text-slate-500">Cargando dashboard...</p>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <KpiCard label="Servicios hoy" value={data.kpis.servicesToday} />
        <KpiCard label="En curso" value={data.kpis.servicesInProgress} />
        <KpiCard label="Activos" value={data.kpis.barbersActive} />
        <KpiCard label="Disponibles" value={data.kpis.barbersAvailable} />
        <KpiCard label="Facturacion hoy" value={`Gs. ${Number(data.kpis.revenueToday).toLocaleString("es-PY")}`} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Barberos</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {data.barbers.map((barber) => (
            <BarberLiveCard key={barber.id} barber={barber} />
          ))}
        </div>
      </div>
    </div>
  );
}
