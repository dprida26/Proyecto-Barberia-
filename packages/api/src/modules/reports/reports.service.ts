import { prisma } from "../../database/client";

interface ReportFilters {
  from: Date;
  to: Date;
  barberId?: string;
  serviceId?: string;
}

function baseWhere(tenantId: string, filters: ReportFilters) {
  return {
    tenantId,
    status: "COMPLETED" as const,
    startedAt: { gte: filters.from, lte: filters.to },
    ...(filters.barberId ? { barberId: filters.barberId } : {}),
    ...(filters.serviceId ? { serviceId: filters.serviceId } : {}),
  };
}

export async function getReportSummary(tenantId: string, filters: ReportFilters) {
  const where = baseWhere(tenantId, filters);

  const [totals, sessions] = await Promise.all([
    prisma.serviceSession.aggregate({
      where,
      _count: { _all: true },
      _sum: { priceAtStart: true },
      _avg: { durationSeconds: true },
    }),
    prisma.serviceSession.findMany({
      where,
      select: {
        barberId: true,
        serviceId: true,
        priceAtStart: true,
        durationSeconds: true,
        startedAt: true,
        barber: { select: { displayName: true } },
        service: { select: { name: true } },
      },
    }),
  ]);

  const byBarberMap = new Map<
    string,
    { barberName: string; servicesCount: number; revenue: number; totalDuration: number }
  >();
  const byServiceMap = new Map<string, { serviceName: string; servicesCount: number; revenue: number }>();
  const byHourMap = new Map<number, number>();

  for (const session of sessions) {
    const price = Number(session.priceAtStart);
    const duration = session.durationSeconds ?? 0;

    const barberEntry = byBarberMap.get(session.barberId) ?? {
      barberName: session.barber.displayName,
      servicesCount: 0,
      revenue: 0,
      totalDuration: 0,
    };
    barberEntry.servicesCount += 1;
    barberEntry.revenue += price;
    barberEntry.totalDuration += duration;
    byBarberMap.set(session.barberId, barberEntry);

    const serviceEntry = byServiceMap.get(session.serviceId) ?? {
      serviceName: session.service.name,
      servicesCount: 0,
      revenue: 0,
    };
    serviceEntry.servicesCount += 1;
    serviceEntry.revenue += price;
    byServiceMap.set(session.serviceId, serviceEntry);

    const hour = session.startedAt.getHours();
    byHourMap.set(hour, (byHourMap.get(hour) ?? 0) + 1);
  }

  const byBarber = Array.from(byBarberMap.entries()).map(([barberId, v]) => ({
    barberId,
    barberName: v.barberName,
    servicesCount: v.servicesCount,
    revenue: v.revenue.toFixed(2),
    avgDurationSeconds: v.servicesCount ? Math.round(v.totalDuration / v.servicesCount) : 0,
  }));

  const byService = Array.from(byServiceMap.entries()).map(([serviceId, v]) => ({
    serviceId,
    serviceName: v.serviceName,
    servicesCount: v.servicesCount,
    revenue: v.revenue.toFixed(2),
  }));

  const byHour = Array.from(byHourMap.entries())
    .map(([hour, servicesCount]) => ({ hour, servicesCount }))
    .sort((a, b) => a.hour - b.hour);

  const topService = [...byService].sort((a, b) => b.servicesCount - a.servicesCount)[0] ?? null;
  const topBarberByServices = [...byBarber].sort((a, b) => b.servicesCount - a.servicesCount)[0] ?? null;
  const topBarberByRevenue = [...byBarber].sort((a, b) => Number(b.revenue) - Number(a.revenue))[0] ?? null;

  const servicesCount = totals._count._all;
  const revenue = Number(totals._sum.priceAtStart ?? 0);

  return {
    range: { from: filters.from.toISOString(), to: filters.to.toISOString() },
    totals: {
      servicesCount,
      revenue: revenue.toFixed(2),
      avgTicket: servicesCount ? (revenue / servicesCount).toFixed(2) : "0.00",
      avgDurationSeconds: Math.round(totals._avg.durationSeconds ?? 0),
    },
    byBarber,
    byService,
    byHour,
    topService,
    topBarberByServices,
    topBarberByRevenue,
  };
}

export async function getReportRows(tenantId: string, filters: ReportFilters) {
  return prisma.serviceSession.findMany({
    where: baseWhere(tenantId, filters),
    include: {
      barber: { select: { displayName: true } },
      service: { select: { name: true } },
    },
    orderBy: { startedAt: "asc" },
  });
}
