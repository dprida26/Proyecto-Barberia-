import { prisma } from "../../database/client";
import { recordAudit } from "../audit/audit.service";
import { NotFoundError } from "../../common/errors";
import { deleteLogo } from "./storage";
import type { UpdateTenantSettingsInput } from "@barberops/shared";

export async function getTenantSettings(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new NotFoundError("Negocio no encontrado");
  return tenant;
}

export async function getPublicTenantBranding() {
  const tenant = await prisma.tenant.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { name: true, logoUrl: true },
  });
  return tenant ?? { name: "BarberOps", logoUrl: null };
}

export async function updateTenantSettings(
  tenantId: string,
  input: UpdateTenantSettingsInput,
  actingUserId: string,
) {
  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name: input.name,
      phone: input.phone,
      address: input.address,
      businessHours: input.businessHours,
    },
  });

  await recordAudit({
    tenantId,
    userId: actingUserId,
    action: "TENANT_SETTINGS_UPDATED",
    entityType: "Tenant",
    entityId: tenantId,
    metadata: input,
  });

  return updated;
}

export async function updateTenantLogo(tenantId: string, logoUrl: string, actingUserId: string) {
  const existing = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!existing) throw new NotFoundError("Negocio no encontrado");

  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: { logoUrl },
  });

  if (existing.logoUrl && existing.logoUrl !== logoUrl) {
    await deleteLogo(existing.logoUrl);
  }

  await recordAudit({
    tenantId,
    userId: actingUserId,
    action: "TENANT_LOGO_UPDATED",
    entityType: "Tenant",
    entityId: tenantId,
  });

  return updated;
}
