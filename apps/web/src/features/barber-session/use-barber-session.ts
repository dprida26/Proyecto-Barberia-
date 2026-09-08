import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ServiceCatalogItem, ServiceSessionRecord } from "@barberops/shared";
import { apiClient } from "@/lib/api-client";

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
  return useQuery({
    queryKey: ["service-sessions", "mine", "today"],
    queryFn: () =>
      apiClient.get<ApiListResponse<ServiceSessionRecord>>("/api/v1/service-sessions/mine/today"),
    select: (res) => res.data,
    refetchInterval: 30_000,
  });
}

export function useStartService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { serviceId: string; clientNameFree?: string; observations?: string }) =>
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
