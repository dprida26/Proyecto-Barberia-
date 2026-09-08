"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { ReportPeriod } from "@barberops/shared";
import { REPORT_PERIODS } from "@barberops/shared";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PERIOD_LABELS, resolvePeriod } from "@/features/reports/period";
import { useExportCsvUrl, useReportSummary } from "@/features/reports/use-report-summary";

const CHART_COLOR = "#2563eb";

export default function ReportesPage() {
  const [period, setPeriod] = useState<ReportPeriod>("THIS_WEEK");

  const range = useMemo(() => resolvePeriod(period), [period]);
  const { data, isLoading } = useReportSummary(range);
  const { download } = useExportCsvUrl(range);

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {REPORT_PERIODS.filter((p) => p !== "CUSTOM").map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  period === p ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={download} className="min-h-0 px-4 py-2 text-sm">
            Exportar CSV
          </Button>
        </div>
      </Card>

      {isLoading || !data ? (
        <p className="text-sm text-slate-500">Cargando reporte...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard label="Servicios" value={data.totals.servicesCount} />
            <KpiCard label="Facturacion" value={`Gs. ${Number(data.totals.revenue).toLocaleString("es-PY")}`} />
            <KpiCard label="Ticket promedio" value={`Gs. ${Number(data.totals.avgTicket).toLocaleString("es-PY")}`} />
            <KpiCard label="Duracion promedio" value={`${Math.round(data.totals.avgDurationSeconds / 60)} min`} />
          </div>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Servicios por tipo</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byService}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="serviceName" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="servicesCount" fill={CHART_COLOR} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Produccion por barbero</h2>
            <div className="flex flex-col divide-y divide-slate-100">
              {data.byBarber.map((barber) => (
                <div key={barber.barberId} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-slate-900">{barber.barberName}</p>
                    <p className="text-sm text-slate-500">{barber.servicesCount} servicios</p>
                  </div>
                  <p className="font-semibold text-slate-900">
                    Gs. {Number(barber.revenue).toLocaleString("es-PY")}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Horarios de mayor actividad</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byHour}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip labelFormatter={(h) => `${h}:00`} />
                  <Bar dataKey="servicesCount" fill={CHART_COLOR} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
