import { useMutation } from "@tanstack/react-query";
import type { AuthUser } from "@barberops/shared";
import { apiClient } from "@/lib/api-client";
import { useSessionStore } from "@/stores/session.store";

interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export function useLogin() {
  const setSession = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      apiClient.post<LoginResponse>("/api/v1/auth/login", input, { skipAuth: true }),
    onSuccess: (data) => {
      setSession(data.accessToken, data.user);
    },
  });
}
