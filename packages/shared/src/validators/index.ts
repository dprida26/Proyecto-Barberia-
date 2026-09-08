import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const createServiceCatalogSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  category: z.string().max(60).optional(),
  durationEstimateMin: z.number().int().min(1).max(600),
  currentPrice: z.number().nonnegative(),
  commissionPercent: z.number().min(0).max(100).optional(),
  isActive: z.boolean().default(true),
});
export type CreateServiceCatalogInput = z.infer<typeof createServiceCatalogSchema>;

export const updateServiceCatalogSchema = createServiceCatalogSchema.partial();
export type UpdateServiceCatalogInput = z.infer<typeof updateServiceCatalogSchema>;

export const createBarberSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2).max(80),
});
export type CreateBarberInput = z.infer<typeof createBarberSchema>;

export const updateBarberSchema = z.object({
  displayName: z.string().min(2).max(80).optional(),
  isAvailable: z.boolean().optional(),
});
export type UpdateBarberInput = z.infer<typeof updateBarberSchema>;

export const startServiceSessionSchema = z.object({
  serviceId: z.string().uuid(),
  clientNameFree: z.string().max(120).optional(),
  observations: z.string().max(500).optional(),
});
export type StartServiceSessionInput = z.infer<typeof startServiceSessionSchema>;

export const cancelServiceSessionSchema = z.object({
  cancelReason: z.string().max(300).optional(),
});
export type CancelServiceSessionInput = z.infer<typeof cancelServiceSessionSchema>;

export const reportFilterSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  barberId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
});
export type ReportFilterInput = z.infer<typeof reportFilterSchema>;
