"use client";

import { Banknote, CalendarCheck, CircleDot, ListChecks } from "lucide-react";
import { useDashboardLive } from "@/features/dashboard/use-dashboard-live";
import { BarberLiveCard } from "@/components/dashboard/BarberLiveCard";
import { KpiCard } from "@/components/dashboard/KpiCard";

export default function DashboardPage() {
  const { data, isLoading } = useDashboardLive();

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Cargando dashboard...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Actividad de la barberia en tiempo real.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <KpiCard label="Servicios hoy" value={data.kpis.servicesToday} icon={ListChecks} />
        <KpiCard label="En curso" value={data.kpis.servicesInProgress} icon={CircleDot} accent="success" />
        <KpiCard label="Activos" value={data.kpis.barbersActive} icon={CalendarCheck} accent="success" />
        <KpiCard label="Disponibles" value={data.kpis.barbersAvailable} icon={CalendarCheck} />
        <KpiCard
          label="Facturacion hoy"
          value={`Gs. ${Number(data.kpis.revenueToday).toLocaleString("es-PY")}`}
          icon={Banknote}
          accent="warning"
        />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Barberos</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {data.barbers.map((barber) => (
            <BarberLiveCard key={barber.id} barber={barber} />
          ))}
        </div>
      </div>
    </div>
  );
}
