"use client";

import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { BarChart3, ChevronDown, Clock, Download, Receipt, Ticket } from "lucide-react";
import type { DateRange } from "react-day-picker";
import type { ReportPeriod } from "@barberops/shared";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { PERIOD_LABELS, resolvePeriod } from "@/features/reports/period";
import { useExportCsvUrl, useReportSummary } from "@/features/reports/use-report-summary";
import { DateRangePicker } from "@/features/reports/DateRangePicker";
import { useTenantSettings } from "@/features/tenant-settings/use-tenant-settings";
import { apiBaseUrl } from "@/lib/env";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function formatGs(value: string | number) {
  return `Gs. ${Number(value).toLocaleString("es-PY")}`;
}

const CHART_COLOR = "hsl(221 83% 53%)";

export default function ReportesPage() {
  const [period, setPeriod] = useState<ReportPeriod>("THIS_WEEK");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const { data: tenant } = useTenantSettings();

  const range = useMemo(() => {
    if (period === "CUSTOM" && customRange?.from) {
      return resolvePeriod("CUSTOM", {
        from: customRange.from.toISOString(),
        to: (customRange.to ?? customRange.from).toISOString(),
      });
    }
    return resolvePeriod(period);
  }, [period, customRange]);

  const { data, isLoading } = useReportSummary(range);
  const { download } = useExportCsvUrl(range);

  function handleCustomRangeChange(newRange: DateRange | undefined) {
    setCustomRange(newRange);
    if (newRange?.from) {
      setPeriod("CUSTOM");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {tenant?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`${apiBaseUrl}${tenant.logoUrl}`}
              alt={tenant.name}
              className="h-10 w-10 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="h-5 w-5" />
            </span>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
            <p className="text-sm text-muted-foreground">Estadisticas por periodo, barbero y servicio.</p>
          </div>
        </div>
        <Button variant="outline" onClick={download} className="self-start sm:self-auto">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 p-4">
          {(["TODAY", "YESTERDAY", "THIS_WEEK"] as const).map((p) => (
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
          <div className="w-full sm:ml-auto sm:w-auto">
            <DateRangePicker
              range={customRange}
              onRangeChange={handleCustomRangeChange}
              active={period === "CUSTOM"}
            />
          </div>
        </CardContent>
      </Card>

      {isLoading || !data ? (
        <p className="text-sm text-muted-foreground">Cargando reporte...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
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
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger className="w-full [&[data-state=open]_.chevron]:rotate-180">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle>Servicios por tipo</CardTitle>
                  <ChevronDown className="chevron h-4 w-4 text-muted-foreground transition-transform" />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
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
              </CollapsibleContent>
            </Collapsible>
          </Card>

          <div>
            <h2 className="mb-3 text-lg font-semibold tracking-tight">Produccion por barbero</h2>
            <div className="flex flex-col gap-3">
              {data.byBarber.length === 0 ? (
                <Card>
                  <CardContent className="p-5 text-sm text-muted-foreground">
                    No hay servicios completados en este periodo.
                  </CardContent>
                </Card>
              ) : (
                data.byBarber.map((barber) => (
                  <Card key={barber.barberId}>
                    <Collapsible defaultOpen={false}>
                      <CollapsibleTrigger className="w-full [&[data-state=open]_.chevron]:rotate-180">
                        <CardHeader className="flex-row items-center justify-between space-y-0">
                          <div className="text-left">
                            <CardTitle className="text-base">{barber.barberName}</CardTitle>
                            <p className="text-sm text-muted-foreground">{barber.servicesCount} servicios</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{formatGs(barber.revenue)}</span>
                            <ChevronDown className="chevron h-4 w-4 shrink-0 text-muted-foreground transition-transform" />
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="grid grid-cols-2 gap-2 pt-0">
                          <div className="rounded-lg bg-success/10 px-3 py-2">
                            <p className="text-xs text-muted-foreground">Para el barbero</p>
                            <p className="font-semibold text-success">{formatGs(barber.barberEarning)}</p>
                          </div>
                          <div className="rounded-lg bg-muted/50 px-3 py-2">
                            <p className="text-xs text-muted-foreground">Para la barberia</p>
                            <p className="font-semibold text-foreground">{formatGs(barber.businessEarning)}</p>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))
              )}
            </div>
          </div>

          <Card>
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger className="w-full [&[data-state=open]_.chevron]:rotate-180">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle>Horarios de mayor actividad</CardTitle>
                  <ChevronDown className="chevron h-4 w-4 text-muted-foreground transition-transform" />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
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
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </>
      )}
    </div>
  );
}
