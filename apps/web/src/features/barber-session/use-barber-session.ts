import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ServiceCatalogItem, ServiceSessionRecord } from "@barberops/shared";
import { SOCKET_EVENTS } from "@barberops/shared";
import { apiClient } from "@/lib/api-client";
import { getDashboardSocket } from "@/lib/socket-client";
import { useSessionStore } from "@/stores/session.store";

interface ApiListResponse<T> {
  data: T[];
}
interface ApiItemResponse<T> {
  data: T;
}

export function useActiveServices() {
  return useQuery({
    queryKey: ["services", "active"],
    queryFn: () => apiClient.get<ApiListResponse<ServiceCatalogItem>>("/api/v1/services"),
    select: (res) => res.data,
  });
}

export function useMyTodaySessions() {
  const queryClient = useQueryClient();
  const accessToken = useSessionStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) return;

    const socket = getDashboardSocket(accessToken);

    function refetch() {
      queryClient.invalidateQueries({ queryKey: ["service-sessions", "mine"] });
    }

    socket.on(SOCKET_EVENTS.SERVICE_FINISHED, refetch);

    return () => {
      socket.off(SOCKET_EVENTS.SERVICE_FINISHED, refetch);
    };
  }, [accessToken, queryClient]);

  return useQuery({
    queryKey: ["service-sessions", "mine", "today"],
    queryFn: () =>
      apiClient.get<ApiListResponse<ServiceSessionRecord>>("/api/v1/service-sessions/mine/today"),
    select: (res) => res.data,
    refetchInterval: 30_000,
  });
}

export interface MySummaryByService {
  serviceId: string;
  serviceName: string;
  count: number;
  revenue: string;
  barberEarning: string;
  businessEarning: string;
}

export interface MySummary {
  totalCount: number;
  totalRevenue: string;
  totalBarberEarning: string;
  totalBusinessEarning: string;
  byService: MySummaryByService[];
}

export function useMySummary(period: "week" | "month") {
  return useQuery({
    queryKey: ["service-sessions", "mine", "summary", period],
    queryFn: () =>
      apiClient.get<ApiItemResponse<MySummary>>(`/api/v1/service-sessions/mine/summary?period=${period}`),
    select: (res) => res.data,
    refetchInterval: 60_000,
  });
}

export function useStartService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { serviceIds: string[]; clientNameFree?: string; paymentMethod: "CASH" | "TRANSFER" }) =>
      apiClient.post<ApiItemResponse<ServiceSessionRecord>>("/api/v1/service-sessions/start", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-sessions"] });
    },
  });
}

export function useFinishService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiClient.post<ApiItemResponse<ServiceSessionRecord>>(`/api/v1/service-sessions/${sessionId}/finish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-sessions"] });
    },
  });
}

export function useCancelService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, cancelReason }: { sessionId: string; cancelReason?: string }) =>
      apiClient.post<ApiItemResponse<ServiceSessionRecord>>(`/api/v1/service-sessions/${sessionId}/cancel`, {
        cancelReason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-sessions"] });
    },
  });
}
