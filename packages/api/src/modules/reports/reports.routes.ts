import type { FastifyInstance } from "fastify";
import { authGuard, roleGuard } from "../../common/guards";
import { getReportRows, getReportSummary } from "./reports.service";

function parseFilters(query: Record<string, string | undefined>) {
  const to = query.to ? new Date(query.to) : new Date();
  const from = query.from ? new Date(query.from) : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from, to, barberId: query.barberId, serviceId: query.serviceId };
}

function toCsvValue(value: string | number | null) {
  if (value === null) return "";
  const str = String(value);
  return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
}

export async function reportsRoutes(app: FastifyInstance) {
  app.get("/reports/summary", { preHandler: [authGuard, roleGuard(["ADMIN"])] }, async (request) => {
    const filters = parseFilters(request.query as Record<string, string | undefined>);
    const summary = await getReportSummary(request.user.tenantId, filters);
    return { data: summary };
  });

  app.get("/reports/export.csv", { preHandler: [authGuard, roleGuard(["ADMIN"])] }, async (request, reply) => {
    const filters = parseFilters(request.query as Record<string, string | undefined>);
    const rows = await getReportRows(request.user.tenantId, filters);

    const header = [
      "id",
      "fecha",
      "barbero",
      "servicio",
      "cliente",
      "hora_inicio",
      "hora_fin",
      "duracion_segundos",
      "precio",
    ];
    const lines = [header.join(",")];

    for (const row of rows) {
      lines.push(
        [
          row.id,
          row.startedAt.toISOString().slice(0, 10),
          row.barber.displayName,
          row.service.name,
          row.clientNameFree ?? "",
          row.startedAt.toISOString(),
          row.endedAt ? row.endedAt.toISOString() : "",
          row.durationSeconds ?? "",
          row.priceAtStart.toString(),
        ]
          .map(toCsvValue)
          .join(","),
      );
    }

    reply
      .header("Content-Type", "text/csv; charset=utf-8")
      .header("Content-Disposition", `attachment; filename="reporte-servicios.csv"`)
      .send(lines.join("\n"));
  });
}
