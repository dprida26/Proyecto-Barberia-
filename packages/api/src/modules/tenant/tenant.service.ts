import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "../../database/client";
import { recordAudit } from "../audit/audit.service";
import { NotFoundError } from "../../common/errors";
import { env } from "../../config/env";
import type { UpdateTenantSettingsInput } from "@barberops/shared";

export async function getTenantSettings(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new NotFoundError("Negocio no encontrado");
  return tenant;
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

export async function updateTenantLogo(tenantId: string, fileName: string, actingUserId: string) {
  const existing = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!existing) throw new NotFoundError("Negocio no encontrado");

  const logoUrl = `/uploads/logos/${fileName}`;

  const updated = await prisma.tenant.update({
    where: { id: tenantId },
    data: { logoUrl },
  });

  if (existing.logoUrl && existing.logoUrl !== logoUrl) {
    const previousPath = path.join(env.uploadsDir, existing.logoUrl.replace(/^\/uploads\//, ""));
    await fs.unlink(previousPath).catch(() => undefined);
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
