export function isWednesdayInTimezone(date: Date, timeZone = "America/Asuncion"): boolean {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  return weekday === "Wed";
}

export function resolveEffectivePrice(
  service: { currentPrice: number; wednesdayPrice: number | null },
  now = new Date(),
): number {
  if (service.wednesdayPrice !== null && isWednesdayInTimezone(now)) {
    return service.wednesdayPrice;
  }
  return service.currentPrice;
}
