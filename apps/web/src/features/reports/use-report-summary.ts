import { useQuery } from "@tanstack/react-query";
import type { ReportSummary } from "@barberops/shared";
import { apiClient } from "@/lib/api-client";
import { apiBaseUrl } from "@/lib/env";
import { useSessionStore } from "@/stores/session.store";

interface Filters {
  from: Date;
  to: Date;
  barberId?: string;
  serviceId?: string;
}

function buildQuery(filters: Filters) {
  const params = new URLSearchParams({
    from: filters.from.toISOString(),
    to: filters.to.toISOString(),
  });
  if (filters.barberId) params.set("barberId", filters.barberId);
  if (filters.serviceId) params.set("serviceId", filters.serviceId);
  return params.toString();
}

export function useReportSummary(filters: Filters) {
  return useQuery({
    queryKey: ["reports", "summary", filters.from.toISOString(), filters.to.toISOString(), filters.barberId, filters.serviceId],
    queryFn: () =>
      apiClient.get<{ data: ReportSummary }>(`/api/v1/reports/summary?${buildQuery(filters)}`),
    select: (res) => res.data,
  });
}

export function useExportCsvUrl(filters: Filters) {
  const accessToken = useSessionStore((s) => s.accessToken);
  return {
    download: async () => {
      const response = await fetch(`${apiBaseUrl}/api/v1/reports/export.csv?${buildQuery(filters)}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        credentials: "include",
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "reporte-servicios.csv";
      link.click();
      URL.revokeObjectURL(url);
    },
  };
}
