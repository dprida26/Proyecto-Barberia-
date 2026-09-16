import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ServiceStartedEvent } from "@barberops/shared";
import { SOCKET_EVENTS } from "@barberops/shared";
import { getDashboardSocket } from "@/lib/socket-client";
import { useSessionStore } from "@/stores/session.store";
import {
  getNotificationSoundFile,
  getStoredNotificationSoundId,
  NOTIFICATION_SOUND_CHANGED_EVENT,
} from "@/features/dashboard/notification-sounds";

/**
 * Escucha en tiempo real el inicio de servicios y avisa al area administrativa
 * con un toast + sonido. Se monta una vez en el layout admin para sonar en
 * cualquier pantalla admin, no solo en /dashboard. El audio sigue sonando si
 * la pestana esta en segundo plano (no minimizada/cerrada) porque el elemento
 * <audio> no se pausa por eso; lo unico que puede bloquearlo es la politica de
 * autoplay del navegador hasta la primera interaccion del usuario en la
 * pestana, por eso se "desbloquea" el audio en el primer click/tecla.
 */
export function useAdminServiceNotifications() {
  const accessToken = useSessionStore((s) => s.accessToken);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(getNotificationSoundFile(getStoredNotificationSoundId()));
    audio.preload = "auto";
    audioRef.current = audio;

    function applySound() {
      if (!audioRef.current) return;
      audioRef.current.src = getNotificationSoundFile(getStoredNotificationSoundId());
    }
    window.addEventListener(NOTIFICATION_SOUND_CHANGED_EVENT, applySound);

    function unlockAudio() {
      if (unlockedRef.current || !audioRef.current) return;
      unlockedRef.current = true;
      audioRef.current
        .play()
        .then(() => {
          audioRef.current!.pause();
          audioRef.current!.currentTime = 0;
        })
        .catch(() => {
          unlockedRef.current = false;
        });
    }
    window.addEventListener("pointerdown", unlockAudio);
    window.addEventListener("keydown", unlockAudio);

    return () => {
      window.removeEventListener(NOTIFICATION_SOUND_CHANGED_EVENT, applySound);
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
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

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {
          // El navegador puede bloquear el autoplay hasta que haya interaccion del usuario; se ignora.
        });
      }
    }

    socket.on(SOCKET_EVENTS.SERVICE_STARTED, handleServiceStarted);

    return () => {
      socket.off(SOCKET_EVENTS.SERVICE_STARTED, handleServiceStarted);
    };
  }, [accessToken]);
}
