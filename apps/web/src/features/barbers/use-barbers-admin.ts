import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { CreateBarberInput, UpdateBarberInput } from "@barberops/shared";
import { apiClient, ApiError } from "@/lib/api-client";

export interface BarberAdminItem {
  id: string;
  displayName: string;
  isAvailable: boolean;
  currentStatus: string;
  user: { email: string; isActive: boolean };
}

const QUERY_KEY = ["barbers", "admin"];

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function useBarbersAdmin() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiClient.get<{ data: BarberAdminItem[] }>("/api/v1/barbers"),
    select: (res) => res.data,
  });
}

export function useCreateBarber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBarberInput) =>
      apiClient.post<{ data: BarberAdminItem }>("/api/v1/barbers", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Barbero creado");
    },
    onError: (error) => toast.error(errorMessage(error, "No se pudo crear el barbero")),
  });
}

export function useUpdateBarber() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBarberInput }) =>
      apiClient.patch<{ data: BarberAdminItem }>(`/api/v1/barbers/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Barbero actualizado");
    },
    onError: (error) => toast.error(errorMessage(error, "No se pudo actualizar el barbero")),
  });
}
