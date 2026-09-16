export interface NotificationSoundOption {
  id: string;
  label: string;
  file: string;
}

export const NOTIFICATION_SOUNDS: NotificationSoundOption[] = [
  { id: "new-service", label: "Clasico", file: "/sounds/new-service.wav" },
  { id: "bell", label: "Campana", file: "/sounds/bell.wav" },
  { id: "ding-dong", label: "Timbre", file: "/sounds/ding-dong.wav" },
  { id: "double-beep", label: "Doble beep", file: "/sounds/double-beep.wav" },
  { id: "pop", label: "Pop", file: "/sounds/pop.wav" },
];

export const DEFAULT_NOTIFICATION_SOUND_ID = "new-service";
const STORAGE_KEY = "barberops.admin.notificationSound";
export const NOTIFICATION_SOUND_CHANGED_EVENT = "barberops:notification-sound-changed";

export function getStoredNotificationSoundId(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_NOTIFICATION_SOUND_ID;
  } catch {
    return DEFAULT_NOTIFICATION_SOUND_ID;
  }
}

export function setStoredNotificationSoundId(id: string) {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // localStorage puede no estar disponible (modo privado); se ignora.
  }
  window.dispatchEvent(new Event(NOTIFICATION_SOUND_CHANGED_EVENT));
}

export function getNotificationSoundFile(id: string): string {
  return NOTIFICATION_SOUNDS.find((s) => s.id === id)?.file ?? NOTIFICATION_SOUNDS[0].file;
}
