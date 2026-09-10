let offsetMs = 0;

/**
 * Registra el desfase entre el reloj del servidor y el del navegador a partir
 * del header Date de una respuesta HTTP. En el plan free de Render el host
 * puede tener el reloj desincronizado (NTP), lo que desfasaba timers como el
 * de "Servicio en curso" aunque los timestamps en la base sean correctos.
 */
export function trackServerDate(dateHeader: string | null) {
  if (!dateHeader) return;
  const serverTime = new Date(dateHeader).getTime();
  if (Number.isNaN(serverTime)) return;
  offsetMs = serverTime - Date.now();
}

/** Ahora, ajustado al reloj del servidor. */
export function serverNow(): number {
  return Date.now() + offsetMs;
}
