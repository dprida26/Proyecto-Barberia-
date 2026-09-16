import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ServiceStartedEvent } from "@barberops/shared";
import { SOCKET_EVENTS } from "@barberops/shared";
import { getDashboardSocket } from "@/lib/socket-client";
import { useSessionStore } from "@/stores/session.store";

/**
 * Escucha en tiempo real el inicio de servicios y avisa al area administrativa
 * con un toast + sonido. Se monta una vez en el layout admin para sonar en
 * cualquier pantalla admin, no solo en /dashboard.
 */
export function useAdminServiceNotifications() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio("/sounds/new-service.wav");
    audioRef.current.preload = "auto";
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    const socket = getDashboardSocket(accessToken);

    function handleServiceStarted(event: ServiceStartedEvent) {
      const serviceNames = event.services.map((s) => s.serviceName).join(", ");
      toast.info(`${event.barberName} inició un servicio`, {
        description: serviceNames,
        duration: 6000,
      });

      audioRef.current?.play().catch(() => {
        // El navegador puede bloquear el autoplay hasta que haya interaccion del usuario; se ignora.
      });
    }

    socket.on(SOCKET_EVENTS.SERVICE_STARTED, handleServiceStarted);

    return () => {
      socket.off(SOCKET_EVENTS.SERVICE_STARTED, handleServiceStarted);
    };
  }, [accessToken]);
}
