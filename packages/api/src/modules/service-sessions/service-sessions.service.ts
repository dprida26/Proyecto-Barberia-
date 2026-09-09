import { prisma } from "../../database/client";
import { ConflictError, NotFoundError } from "../../common/errors";
import { recordAudit } from "../audit/audit.service";
import { emitToTenant } from "../../websockets/io";
import { SOCKET_EVENTS, computeEarnings } from "@barberops/shared";
import type { CancelServiceSessionInput, StartServiceSessionInput } from "@barberops/shared";

export async function startServiceSession(
  tenantId: string,
  barberUserId: string,
  input: StartServiceSessionInput,
) {
  const barber = await prisma.barber.findFirst({ where: { tenantId, userId: barberUserId } });
  if (!barber) throw new NotFoundError("Barbero no encontrado");

  const services = await prisma.serviceCatalog.findMany({
    where: { id: { in: input.serviceIds }, tenantId, isActive: true },
  });
  if (services.length !== input.serviceIds.length) {
    throw new NotFoundError("Uno o mas servicios no fueron encontrados o estan inactivos");
  }

  const totalPrice = services.reduce((sum, s) => sum + Number(s.currentPrice), 0);

  const session = await prisma.$transaction(async (tx) => {
    const activeSession = await tx.serviceSession.findFirst({
      where: { barberId: barber.id, status: "IN_SERVICE" },
    });
    if (activeSession) {
      throw new ConflictError("El barbero ya tiene un servicio en curso");
    }

    const created = await tx.serviceSession.create({
      data: {
        tenantId,
        barberId: barber.id,
        clientNameFree: input.clientNameFree,
        paymentMethod: input.paymentMethod,
        totalPrice,
        status: "IN_SERVICE",
        items: {
          create: services.map((s) => ({ serviceId: s.id, priceAtStart: s.currentPrice })),
        },
      },
    });

    await tx.barber.update({
      where: { id: barber.id },
      data: { currentStatus: "IN_SERVICE" },
    });

    return created;
  });

  await recordAudit({
    tenantId,
    userId: barberUserId,
    action: "SERVICE_STARTED",
    entityType: "ServiceSession",
    entityId: session.id,
  });

  emitToTenant(tenantId, SOCKET_EVENTS.SERVICE_STARTED, {
    sessionId: session.id,
    barberId: barber.id,
    services: services.map((s) => ({ serviceId: s.id, serviceName: s.name })),
    startedAt: session.startedAt,
    clientNameFree: session.clientNameFree,
  });

  return session;
}

export async function finishServiceSession(tenantId: string, sessionId: string, barberUserId: string) {
  const barber = await prisma.barber.findFirst({ where: { tenantId, userId: barberUserId } });
  if (!barber) throw new NotFoundError("Barbero no encontrado");

  const session = await prisma.serviceSession.findFirst({
    where: { id: sessionId, tenantId, barberId: barber.id, status: "IN_SERVICE" },
  });
  if (!session) throw new NotFoundError("Sesion de servicio activa no encontrada");

  const endedAt = new Date();
  const durationSeconds = Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000);

  const commissionPercent = barber.commissionPercent;

  const updated = await prisma.$transaction(async (tx) => {
    const finished = await tx.serviceSession.update({
      where: { id: sessionId },
      data: {
        status: "COMPLETED",
        endedAt,
        durationSeconds,
        commissionPercentAtCompletion: commissionPercent,
      },
    });
    await tx.barber.update({ where: { id: barber.id }, data: { currentStatus: "AVAILABLE" } });
    return finished;
  });

  await recordAudit({
    tenantId,
    userId: barberUserId,
    action: "SERVICE_FINISHED",
    entityType: "ServiceSession",
    entityId: sessionId,
    metadata: { durationSeconds },
  });

  const { barberEarning, businessEarning } = computeEarnings(
    Number(session.totalPrice),
    Number(commissionPercent),
  );

  emitToTenant(tenantId, SOCKET_EVENTS.SERVICE_FINISHED, {
    sessionId,
    barberId: barber.id,
    durationSeconds,
    barberEarning: barberEarning.toFixed(2),
    businessEarning: businessEarning.toFixed(2),
  });

  return updated;
}

export async function cancelServiceSession(
  tenantId: string,
  sessionId: string,
  actingUserId: string,
  isAdmin: boolean,
  input: CancelServiceSessionInput,
) {
  const session = await prisma.serviceSession.findFirst({
    where: { id: sessionId, tenantId, status: "IN_SERVICE" },
    include: { barber: true },
  });
  if (!session) throw new NotFoundError("Sesion de servicio activa no encontrada");

  if (!isAdmin && session.barber.userId !== actingUserId) {
    throw new NotFoundError("Sesion de servicio activa no encontrada");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const cancelled = await tx.serviceSession.update({
      where: { id: sessionId },
      data: { status: "CANCELLED", endedAt: new Date(), cancelReason: input.cancelReason },
    });
    await tx.barber.update({ where: { id: session.barberId }, data: { currentStatus: "AVAILABLE" } });
    return cancelled;
  });

  await recordAudit({
    tenantId,
    userId: actingUserId,
    action: "SERVICE_CANCELLED",
    entityType: "ServiceSession",
    entityId: sessionId,
    metadata: { cancelReason: input.cancelReason },
  });

  emitToTenant(tenantId, SOCKET_EVENTS.SERVICE_CANCELLED, { sessionId, barberId: session.barberId });

  return updated;
}

export async function getMyTodaySessions(tenantId: string, barberUserId: string) {
  const barber = await prisma.barber.findFirst({ where: { tenantId, userId: barberUserId } });
  if (!barber) throw new NotFoundError("Barbero no encontrado");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const sessions = await prisma.serviceSession.findMany({
    where: { barberId: barber.id, tenantId, startedAt: { gte: startOfDay } },
    include: { items: { include: { service: { select: { name: true } } } } },
    orderBy: { startedAt: "desc" },
  });

  return sessions.map(({ items, ...session }) => {
    const earnings = session.commissionPercentAtCompletion
      ? computeEarnings(Number(session.totalPrice), Number(session.commissionPercentAtCompletion))
      : null;
    return {
      ...session,
      services: items.map((item) => ({
        serviceId: item.serviceId,
        serviceName: item.service.name,
        priceAtStart: item.priceAtStart.toFixed(2),
      })),
      barberEarning: earnings ? earnings.barberEarning.toFixed(2) : null,
      businessEarning: earnings ? earnings.businessEarning.toFixed(2) : null,
    };
  });
}

export async function getMySummary(tenantId: string, barberUserId: string, period: "week" | "month") {
  const barber = await prisma.barber.findFirst({ where: { tenantId, userId: barberUserId } });
  if (!barber) throw new NotFoundError("Barbero no encontrado");

  const from = new Date();
  from.setHours(0, 0, 0, 0);
  if (period === "week") {
    const day = from.getDay();
    const diff = day === 0 ? 6 : day - 1;
    from.setDate(from.getDate() - diff);
  } else {
    from.setDate(1);
  }

  const sessions = await prisma.serviceSession.findMany({
    where: { barberId: barber.id, tenantId, status: "COMPLETED", startedAt: { gte: from } },
    include: { items: { include: { service: { select: { name: true } } } } },
  });

  const byServiceMap = new Map<
    string,
    { serviceName: string; count: number; revenue: number; barberEarning: number; businessEarning: number }
  >();
  let totalRevenue = 0;
  let totalBarberEarning = 0;
  let totalBusinessEarning = 0;

  for (const session of sessions) {
    const totalPrice = Number(session.totalPrice);
    const commissionPercent = Number(session.commissionPercentAtCompletion ?? 0);
    const { barberEarning, businessEarning } = computeEarnings(totalPrice, commissionPercent);
    totalRevenue += totalPrice;
    totalBarberEarning += barberEarning;
    totalBusinessEarning += businessEarning;

    for (const item of session.items) {
      const itemPrice = Number(item.priceAtStart);
      const itemEarnings = computeEarnings(itemPrice, commissionPercent);

      const entry = byServiceMap.get(item.serviceId) ?? {
        serviceName: item.service.name,
        count: 0,
        revenue: 0,
        barberEarning: 0,
        businessEarning: 0,
      };
      entry.count += 1;
      entry.revenue += itemPrice;
      entry.barberEarning += itemEarnings.barberEarning;
      entry.businessEarning += itemEarnings.businessEarning;
      byServiceMap.set(item.serviceId, entry);
    }
  }

  const byService = Array.from(byServiceMap.entries())
    .map(([serviceId, v]) => ({
      serviceId,
      serviceName: v.serviceName,
      count: v.count,
      revenue: v.revenue.toFixed(2),
      barberEarning: v.barberEarning.toFixed(2),
      businessEarning: v.businessEarning.toFixed(2),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    totalCount: sessions.length,
    totalRevenue: totalRevenue.toFixed(2),
    totalBarberEarning: totalBarberEarning.toFixed(2),
    totalBusinessEarning: totalBusinessEarning.toFixed(2),
    byService,
  };
}

export async function listServiceSessions(
  tenantId: string,
  filters: { from?: Date; to?: Date; barberId?: string; serviceId?: string; status?: string },
) {
  return prisma.serviceSession.findMany({
    where: {
      tenantId,
      ...(filters.from || filters.to
        ? { startedAt: { gte: filters.from, lte: filters.to } }
        : {}),
      ...(filters.barberId ? { barberId: filters.barberId } : {}),
      ...(filters.serviceId ? { items: { some: { serviceId: filters.serviceId } } } : {}),
      ...(filters.status ? { status: filters.status as any } : {}),
    },
    include: {
      barber: { select: { displayName: true } },
      items: { include: { service: { select: { name: true } } } },
    },
    orderBy: { startedAt: "desc" },
  });
}
