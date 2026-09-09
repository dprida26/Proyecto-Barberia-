export const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

/**
 * Resuelve una logoUrl guardada por la API a una URL cargable por <img>.
 * Puede ser una URL absoluta (Cloudflare R2 en produccion) o una ruta relativa
 * (/uploads/... del filesystem local de la API en desarrollo).
 */
export function resolveLogoUrl(logoUrl: string | null | undefined): string | null {
  if (!logoUrl) return null;
  return /^https?:\/\//.test(logoUrl) ? logoUrl : `${apiBaseUrl}${logoUrl}`;
}
