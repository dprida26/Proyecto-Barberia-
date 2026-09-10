import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { BarberServiceCommissionOverride } from "@barberops/shared";
import { apiClient, ApiError } from "@/lib/api-client";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

function queryKey(serviceId: string | undefined) {
  return ["services", "commission-overrides", serviceId];
}

export function useCommissionOverrides(serviceId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: queryKey(serviceId),
    queryFn: () =>
      apiClient.get<{ data: BarberServiceCommissionOverride[] }>(
        `/api/v1/services/${serviceId}/commission-overrides`,
      ),
    select: (res) => res.data,
    enabled: Boolean(serviceId) && enabled,
  });
}

export function useSetCommissionOverrides() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      serviceId,
      overrides,
    }: {
      serviceId: string;
      overrides: Array<{ barberId: string; commissionPercent: number }>;
    }) =>
      apiClient.put<{ data: BarberServiceCommissionOverride[] }>(
        `/api/v1/services/${serviceId}/commission-overrides`,
        { overrides },
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKey(variables.serviceId) });
    },
    onError: (error) => toast.error(errorMessage(error, "No se pudo guardar la comision especial")),
  });
}
