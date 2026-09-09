export function computeEarnings(price: number, commissionPercent: number) {
  const barberEarning = Math.round(price * (commissionPercent / 100) * 100) / 100;
  const businessEarning = Math.round((price - barberEarning) * 100) / 100;
  return { barberEarning, businessEarning };
}
