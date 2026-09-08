"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BarChart3, Clock, Download, Receipt, Ticket } from "lucide-react";
import type { ReportPeriod } from "@barberops/shared";
import { REPORT_PERIODS } from "@barberops/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PERIOD_LABELS, resolvePeriod } from "@/features/reports/period";
import { useExportCsvUrl, useReportSummary } from "@/features/reports/use-report-summary";

const CHART_COLOR = "hsl(221 83% 53%)";

export default function ReportesPage() {
  const [period, setPeriod] = useState<ReportPeriod>("THIS_WEEK");

  const range = useMemo(() => resolvePeriod(period), [period]);
  const { data, isLoading } = useReportSummary(range);
  const { download } = useExportCsvUrl(range);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
          <p className="text-sm text-muted-foreground">Estadisticas por periodo, barbero y servicio.</p>
        </div>
        <Button variant="outline" onClick={download}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap gap-2 p-4">
          {REPORT_PERIODS.filter((p) => p !== "CUSTOM").map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-accent",
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </CardContent>
      </Card>

      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Cargando reporte...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <KpiCard label="Servicios" value={data.totals.servicesCount} icon={BarChart3} />
            <KpiCard
              label="Facturacion"
              value={`Gs. ${Number(data.totals.revenue).toLocaleString("es-PY")}`}
              icon={Receipt}
              accent="success"
            />
            <KpiCard
              label="Ticket promedio"
              value={`Gs. ${Number(data.totals.avgTicket).toLocaleString("es-PY")}`}
              icon={Ticket}
              accent="warning"
            />
            <KpiCard
              label="Duracion promedio"
              value={`${Math.round(data.totals.avgDurationSeconds / 60)} min`}
              icon={Clock}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Servicios por tipo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byService}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis dataKey="serviceName" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="servicesCount" fill={CHART_COLOR} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Produccion por barbero</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col divide-y divide-border p-0 pb-2">
              {data.byBarber.map((barber) => (
                <div key={barber.barberId} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="font-medium text-foreground">{barber.barberName}</p>
                    <p className="text-sm text-muted-foreground">{barber.servicesCount} servicios</p>
                  </div>
                  <p className="font-semibold text-foreground">
                    Gs. {Number(barber.revenue).toLocaleString("es-PY")}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horarios de mayor actividad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byHour}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                    <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip labelFormatter={(h) => `${h}:00`} />
                    <Bar dataKey="servicesCount" fill={CHART_COLOR} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
