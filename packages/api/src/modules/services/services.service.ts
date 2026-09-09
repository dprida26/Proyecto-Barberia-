import { prisma } from "../../database/client";
import { recordAudit } from "../audit/audit.service";
import { NotFoundError } from "../../common/errors";
import type { CreateServiceCatalogInput, UpdateServiceCatalogInput } from "@barberops/shared";

export async function listServices(tenantId: string, includeInactive: boolean) {
  return prisma.serviceCatalog.findMany({
    where: { tenantId, ...(includeInactive ? {} : { isActive: true }) },
    orderBy: { name: "asc" },
  });
}

export async function createService(tenantId: string, input: CreateServiceCatalogInput, actingUserId: string) {
  const service = await prisma.serviceCatalog.create({
    data: {
      tenantId,
      name: input.name,
      description: input.description,
      category: input.category,
      durationEstimateMin: input.durationEstimateMin,
      currentPrice: input.currentPrice,
      isActive: input.isActive,
    },
  });

  await recordAudit({
    tenantId,
    userId: actingUserId,
    action: "SERVICE_CATALOG_CREATED",
    entityType: "ServiceCatalog",
    entityId: service.id,
  });

  return service;
}

export async function updateService(
  tenantId: string,
  serviceId: string,
  input: UpdateServiceCatalogInput,
  actingUserId: string,
) {
  const existing = await prisma.serviceCatalog.findFirst({ where: { id: serviceId, tenantId } });
  if (!existing) throw new NotFoundError("Servicio no encontrado");

  const priceChanged = input.currentPrice !== undefined && Number(existing.currentPrice) !== input.currentPrice;

  const updated = await prisma.serviceCatalog.update({
    where: { id: serviceId },
    data: {
      name: input.name,
      description: input.description,
      category: input.category,
      durationEstimateMin: input.durationEstimateMin,
      currentPrice: input.currentPrice,
      isActive: input.isActive,
    },
  });

  await recordAudit({
    tenantId,
    userId: actingUserId,
    action: priceChanged ? "SERVICE_PRICE_CHANGED" : "SERVICE_CATALOG_UPDATED",
    entityType: "ServiceCatalog",
    entityId: serviceId,
    metadata: priceChanged
      ? { previousPrice: existing.currentPrice.toString(), newPrice: input.currentPrice }
      : input,
  });

  return updated;
}
