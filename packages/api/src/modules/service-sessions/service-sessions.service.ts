import { prisma } from "../../database/client";
import { ConflictError, NotFoundError } from "../../common/errors";
import { recordAudit } from "../audit/audit.service";
import { emitToTenant } from "../../websockets/io";
import { SOCKET_EVENTS } from "@barberops/shared";
import type { CancelServiceSessionInput, StartServiceSessionInput } from "@barberops/shared";

export async function startServiceSession(
  tenantId: string,
  barberUserId: string,
  input: StartServiceSessionInput,
) {
  const barber = await prisma.barber.findFirst({ where: { tenantId, userId: barberUserId } });
  if (!barber) throw new NotFoundError("Barbero no encontrado");

  const service = await prisma.serviceCatalog.findFirst({
    where: { id: input.serviceId, tenantId, isActive: true },
  });
  if (!service) throw new NotFoundError("Servicio no encontrado o inactivo");

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
        serviceId: service.id,
        clientNameFree: input.clientNameFree,
        observations: input.observations,
        priceAtStart: service.currentPrice,
        status: "IN_SERVICE",
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
    serviceId: service.id,
    serviceName: service.name,
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

  const updated = await prisma.$transaction(async (tx) => {
    const finished = await tx.serviceSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED", endedAt, durationSeconds },
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

  emitToTenant(tenantId, SOCKET_EVENTS.SERVICE_FINISHED, {
    sessionId,
    barberId: barber.id,
    durationSeconds,
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
    include: { service: { select: { name: true } } },
    orderBy: { startedAt: "desc" },
  });

  return sessions.map(({ service, ...session }) => ({ ...session, serviceName: service.name }));
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
    include: { service: { select: { name: true } } },
  });

  const byServiceMap = new Map<string, { serviceName: string; count: number }>();
  for (const session of sessions) {
    const entry = byServiceMap.get(session.serviceId) ?? { serviceName: session.service.name, count: 0 };
    entry.count += 1;
    byServiceMap.set(session.serviceId, entry);
  }

  const byService = Array.from(byServiceMap.entries())
    .map(([serviceId, v]) => ({ serviceId, serviceName: v.serviceName, count: v.count }))
    .sort((a, b) => b.count - a.count);

  return { totalCount: sessions.length, byService };
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
      ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
      ...(filters.status ? { status: filters.status as any } : {}),
    },
    include: {
      barber: { select: { displayName: true } },
      service: { select: { name: true } },
    },
    orderBy: { startedAt: "desc" },
  });
}
