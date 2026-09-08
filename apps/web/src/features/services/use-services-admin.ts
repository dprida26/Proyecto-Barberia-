import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateServiceCatalogInput, ServiceCatalogItem, UpdateServiceCatalogInput } from "@barberops/shared";
import { apiClient } from "@/lib/api-client";

const QUERY_KEY = ["services", "admin"];

export function useAllServices() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiClient.get<{ data: ServiceCatalogItem[] }>("/api/v1/services?includeInactive=true"),
    select: (res) => res.data,
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateServiceCatalogInput) =>
      apiClient.post<{ data: ServiceCatalogItem }>("/api/v1/services", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateServiceCatalogInput }) =>
      apiClient.patch<{ data: ServiceCatalogItem }>(`/api/v1/services/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
