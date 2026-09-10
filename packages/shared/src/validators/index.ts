import { z } from "zod";
import { PAYMENT_METHODS } from "../constants";

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
  wednesdayPrice: z.number().nonnegative().nullable().optional(),
  isActive: z.boolean().default(true),
});
export type CreateServiceCatalogInput = z.infer<typeof createServiceCatalogSchema>;

export const updateServiceCatalogSchema = createServiceCatalogSchema.partial();
export type UpdateServiceCatalogInput = z.infer<typeof updateServiceCatalogSchema>;

export const commissionOverrideSchema = z.object({
  barberId: z.string().uuid(),
  commissionPercent: z.number().min(0).max(100),
});
export type CommissionOverrideInput = z.infer<typeof commissionOverrideSchema>;

export const setCommissionOverridesSchema = z
  .object({
    overrides: z.array(commissionOverrideSchema).max(200),
  })
  .refine(
    (data) => new Set(data.overrides.map((o) => o.barberId)).size === data.overrides.length,
    {
      message: "No se puede repetir el mismo barbero en las excepciones de comision",
      path: ["overrides"],
    },
  );
export type SetCommissionOverridesInput = z.infer<typeof setCommissionOverridesSchema>;

export const createBarberSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2).max(80),
  commissionPercent: z.number().min(0).max(100).default(50),
});
export type CreateBarberInput = z.infer<typeof createBarberSchema>;

export const updateBarberSchema = z.object({
  displayName: z.string().min(2).max(80).optional(),
  isAvailable: z.boolean().optional(),
  email: z.string().email().optional(),
  commissionPercent: z.number().min(0).max(100).optional(),
});
export type UpdateBarberInput = z.infer<typeof updateBarberSchema>;

export const startServiceSessionSchema = z
  .object({
    serviceIds: z.array(z.string().uuid()).min(1),
    clientNameFree: z.string().max(120).optional(),
    paymentMethod: z.enum(PAYMENT_METHODS).default("CASH"),
  })
  .refine((data) => data.paymentMethod !== "TRANSFER" || Boolean(data.clientNameFree?.trim()), {
    message: "El nombre del cliente es obligatorio para pagos por transferencia",
    path: ["clientNameFree"],
  });
export type StartServiceSessionInput = z.infer<typeof startServiceSessionSchema>;

export const cancelServiceSessionSchema = z.object({
  cancelReason: z.string().max(300).optional(),
});
export type CancelServiceSessionInput = z.infer<typeof cancelServiceSessionSchema>;

export const updateTenantSettingsSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  phone: z.string().max(30).optional(),
  address: z.string().max(200).optional(),
  businessHours: z.string().max(300).optional(),
});
export type UpdateTenantSettingsInput = z.infer<typeof updateTenantSettingsSchema>;

export const reportFilterSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  barberId: z.string().uuid().optional(),
  serviceId: z.string().uuid().optional(),
});
export type ReportFilterInput = z.infer<typeof reportFilterSchema>;
