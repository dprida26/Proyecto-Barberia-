"use client";

import { Banknote, CalendarCheck, CircleDot, LayoutDashboard, ListChecks } from "lucide-react";
import { useDashboardLive } from "@/features/dashboard/use-dashboard-live";
import { BarberLiveCard } from "@/components/dashboard/BarberLiveCard";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { useTenantSettings } from "@/features/tenant-settings/use-tenant-settings";
import { resolveLogoUrl } from "@/lib/env";

export default function DashboardPage() {
  const { data, isLoading } = useDashboardLive();
  const { data: tenant } = useTenantSettings();

  if (isLoading || !data) {
    return <p className="text-sm text-muted-foreground">Cargando dashboard...</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-3">
        {tenant?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveLogoUrl(tenant.logoUrl)!}
            alt={tenant.name}
            className="h-10 w-10 shrink-0 rounded-lg object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LayoutDashboard className="h-5 w-5" />
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Actividad de la barberia en tiempo real.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-6">
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
        <KpiCard
          label="Ganancia barberia hoy"
          value={`Gs. ${Number(data.kpis.businessEarningToday).toLocaleString("es-PY")}`}
          icon={Banknote}
          accent="success"
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
