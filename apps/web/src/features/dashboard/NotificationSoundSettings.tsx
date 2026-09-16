"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DEFAULT_NOTIFICATION_SOUND_ID,
  getNotificationSoundFile,
  getStoredNotificationSoundId,
  NOTIFICATION_SOUNDS,
  setStoredNotificationSoundId,
} from "./notification-sounds";

export function NotificationSoundSettings() {
  const [soundId, setSoundId] = useState(DEFAULT_NOTIFICATION_SOUND_ID);
  const previewRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setSoundId(getStoredNotificationSoundId());
  }, []);

  function handleChange(value: string) {
    setSoundId(value);
    setStoredNotificationSoundId(value);
  }

  function handlePreview() {
    if (!previewRef.current) {
      previewRef.current = new Audio();
    }
    previewRef.current.src = getNotificationSoundFile(soundId);
    previewRef.current.currentTime = 0;
    previewRef.current.play().catch(() => {
      // Requiere interaccion del usuario para reproducir; este click ya lo es.
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-primary" />
          Sonido de notificaciones
        </CardTitle>
        <CardDescription>
          Sonido que se reproduce en este dispositivo cuando un barbero inicia un servicio. Sigue sonando aunque
          esta pestaña esté en segundo plano, mientras el navegador siga abierto.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={soundId} onValueChange={handleChange}>
          <SelectTrigger className="sm:max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {NOTIFICATION_SOUNDS.map((sound) => (
              <SelectItem key={sound.id} value={sound.id}>
                {sound.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" onClick={handlePreview}>
          Probar sonido
        </Button>
      </CardContent>
    </Card>
  );
}
