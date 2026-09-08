import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateServiceCatalogInput, ServiceCatalogItem, UpdateServiceCatalogInput } from "@barberops/shared";
import { apiClient, ApiError } from "@/lib/api-client";

const QUERY_KEY = ["services", "admin"];

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Servicio creado");
    },
    onError: (error) => toast.error(errorMessage(error, "No se pudo crear el servicio")),
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateServiceCatalogInput }) =>
      apiClient.patch<{ data: ServiceCatalogItem }>(`/api/v1/services/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Servicio actualizado");
    },
    onError: (error) => toast.error(errorMessage(error, "No se pudo actualizar el servicio")),
  });
}
