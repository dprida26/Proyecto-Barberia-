import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { TenantSettings, UpdateTenantSettingsInput } from "@barberops/shared";
import { apiClient, ApiError } from "@/lib/api-client";

const QUERY_KEY = ["tenant", "settings"];

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function useTenantSettings() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiClient.get<{ data: TenantSettings }>("/api/v1/tenant/settings"),
    select: (res) => res.data,
  });
}

export function useUpdateTenantSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTenantSettingsInput) =>
      apiClient.patch<{ data: TenantSettings }>("/api/v1/tenant/settings", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Datos del negocio actualizados");
    },
    onError: (error) => toast.error(errorMessage(error, "No se pudo actualizar el negocio")),
  });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiClient.postForm<{ data: TenantSettings }>("/api/v1/tenant/logo", formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Logo actualizado");
    },
    onError: (error) => toast.error(errorMessage(error, "No se pudo subir el logo")),
  });
}
