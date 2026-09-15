import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DeleteServiceSessionItemInput } from "@barberops/shared";
import { apiClient } from "@/lib/api-client";

export interface ServiceSessionItemRow {
  id: string;
  serviceId: string;
  priceAtStart: string;
  deletedAt: string | null;
  service: { name: string };
}

export interface ServiceSessionRow {
  id: string;
  status: "IN_SERVICE" | "COMPLETED" | "CANCELLED" | "DELETED";
  startedAt: string;
  totalPrice: string;
  clientNameFree: string | null;
  paymentMethod: "CASH" | "TRANSFER";
  barber: { displayName: string };
  items: ServiceSessionItemRow[];
}

interface Filters {
  from: Date;
  to: Date;
  barberId?: string;
}

function buildQuery(filters: Filters) {
  const params = new URLSearchParams({
    from: filters.from.toISOString(),
    to: filters.to.toISOString(),
    status: "COMPLETED",
  });
  if (filters.barberId) params.set("barberId", filters.barberId);
  return params.toString();
}

export function useServiceSessions(filters: Filters) {
  return useQuery({
    queryKey: ["service-sessions", filters.from.toISOString(), filters.to.toISOString(), filters.barberId],
    queryFn: () =>
      apiClient.get<{ data: ServiceSessionRow[] }>(`/api/v1/service-sessions?${buildQuery(filters)}`),
    select: (res) => res.data,
  });
}

export function useDeleteServiceSessionItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      itemId,
      deleteReason,
    }: { sessionId: string; itemId: string } & DeleteServiceSessionItemInput) =>
      apiClient.post(`/api/v1/service-sessions/${sessionId}/items/${itemId}/delete`, { deleteReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
