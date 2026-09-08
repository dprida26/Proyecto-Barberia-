import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { DashboardLiveSnapshot } from "@barberops/shared";
import { SOCKET_EVENTS } from "@barberops/shared";
import { apiClient } from "@/lib/api-client";
import { getDashboardSocket } from "@/lib/socket-client";
import { useSessionStore } from "@/stores/session.store";

const QUERY_KEY = ["dashboard", "live"];

export function useDashboardLive() {
  const queryClient = useQueryClient();
  const accessToken = useSessionStore((s) => s.accessToken);

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => apiClient.get<{ data: DashboardLiveSnapshot }>("/api/v1/dashboard/live"),
    select: (res) => res.data,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (!accessToken) return;

    const socket = getDashboardSocket(accessToken);

    function refetch() {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }

    socket.on(SOCKET_EVENTS.SERVICE_STARTED, refetch);
    socket.on(SOCKET_EVENTS.SERVICE_FINISHED, refetch);
    socket.on(SOCKET_EVENTS.SERVICE_CANCELLED, refetch);

    return () => {
      socket.off(SOCKET_EVENTS.SERVICE_STARTED, refetch);
      socket.off(SOCKET_EVENTS.SERVICE_FINISHED, refetch);
      socket.off(SOCKET_EVENTS.SERVICE_CANCELLED, refetch);
    };
  }, [accessToken, queryClient]);

  return query;
}
