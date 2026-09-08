import type { ReportPeriod } from "@barberops/shared";

export const PERIOD_LABELS: Record<ReportPeriod, string> = {
  TODAY: "Hoy",
  YESTERDAY: "Ayer",
  THIS_WEEK: "Esta semana",
  LAST_WEEK: "Semana anterior",
  THIS_MONTH: "Este mes",
  LAST_MONTH: "Mes anterior",
  LAST_30_DAYS: "Ultimos 30 dias",
  CUSTOM: "Rango personalizado",
};

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeek(date: Date) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

export function resolvePeriod(period: ReportPeriod, custom?: { from: string; to: string }) {
  const now = new Date();

  switch (period) {
    case "TODAY":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "YESTERDAY": {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
    }
    case "THIS_WEEK":
      return { from: startOfWeek(now), to: endOfDay(now) };
    case "LAST_WEEK": {
      const start = startOfWeek(now);
      start.setDate(start.getDate() - 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { from: start, to: endOfDay(end) };
    }
    case "THIS_MONTH":
      return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfDay(now) };
    case "LAST_MONTH": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: start, to: endOfDay(end) };
    }
    case "LAST_30_DAYS": {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { from: startOfDay(start), to: endOfDay(now) };
    }
    case "CUSTOM":
      return {
        from: custom?.from ? startOfDay(new Date(custom.from)) : startOfDay(now),
        to: custom?.to ? endOfDay(new Date(custom.to)) : endOfDay(now),
      };
  }
}
