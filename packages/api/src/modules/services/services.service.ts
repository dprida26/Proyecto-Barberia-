import { prisma } from "../../database/client";
import { recordAudit } from "../audit/audit.service";
import { NotFoundError } from "../../common/errors";
import type {
  CreateServiceCatalogInput,
  UpdateServiceCatalogInput,
  CommissionOverrideInput,
} from "@barberops/shared";

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
      wednesdayPrice: input.wednesdayPrice,
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
      wednesdayPrice: input.wednesdayPrice,
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

export async function listCommissionOverrides(tenantId: string, serviceId: string) {
  const service = await prisma.serviceCatalog.findFirst({ where: { id: serviceId, tenantId } });
  if (!service) throw new NotFoundError("Servicio no encontrado");

  const overrides = await prisma.barberServiceCommission.findMany({
    where: { tenantId, serviceId },
    include: { barber: { select: { displayName: true } } },
  });

  return overrides.map((o) => ({
    id: o.id,
    barberId: o.barberId,
    barberName: o.barber.displayName,
    serviceId: o.serviceId,
    commissionPercent: o.commissionPercent.toString(),
  }));
}

export async function setCommissionOverrides(
  tenantId: string,
  serviceId: string,
  overrides: CommissionOverrideInput[],
  actingUserId: string,
) {
  const service = await prisma.serviceCatalog.findFirst({ where: { id: serviceId, tenantId } });
  if (!service) throw new NotFoundError("Servicio no encontrado");

  const barberIds = overrides.map((o) => o.barberId);
  const validBarbers = await prisma.barber.findMany({ where: { id: { in: barberIds }, tenantId } });
  if (validBarbers.length !== new Set(barberIds).size) {
    throw new NotFoundError("Uno o mas barberos no fueron encontrados");
  }

  await prisma.$transaction(async (tx) => {
    await tx.barberServiceCommission.deleteMany({ where: { tenantId, serviceId } });
    if (overrides.length > 0) {
      await tx.barberServiceCommission.createMany({
        data: overrides.map((o) => ({
          tenantId,
          serviceId,
          barberId: o.barberId,
          commissionPercent: o.commissionPercent,
        })),
      });
    }
  });

  await recordAudit({
    tenantId,
    userId: actingUserId,
    action: overrides.length > 0 ? "SERVICE_COMMISSION_OVERRIDE_SET" : "SERVICE_COMMISSION_OVERRIDE_REMOVED",
    entityType: "ServiceCatalog",
    entityId: serviceId,
    metadata: { overrides },
  });

  return listCommissionOverrides(tenantId, serviceId);
}
