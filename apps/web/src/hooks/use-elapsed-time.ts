import { useEffect, useState } from "react";

export function useElapsedTime(startedAt: string | null) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const start = new Date(startedAt).getTime();

    function tick() {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const minutes = Math.floor(elapsedSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (elapsedSeconds % 60).toString().padStart(2, "0");

  return { elapsedSeconds, formatted: `${minutes}:${seconds}` };
}
