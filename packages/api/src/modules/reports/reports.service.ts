import { prisma } from "../../database/client";
import { computeEarnings } from "@barberops/shared";

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
    ...(filters.serviceId ? { items: { some: { serviceId: filters.serviceId } } } : {}),
  };
}

export async function getReportSummary(tenantId: string, filters: ReportFilters) {
  const where = baseWhere(tenantId, filters);

  const [totals, sessions] = await Promise.all([
    prisma.serviceSession.aggregate({
      where,
      _count: { _all: true },
      _sum: { totalPrice: true },
      _avg: { durationSeconds: true },
    }),
    prisma.serviceSession.findMany({
      where,
      select: {
        id: true,
        barberId: true,
        totalPrice: true,
        commissionPercentAtCompletion: true,
        durationSeconds: true,
        startedAt: true,
        paymentMethod: true,
        clientNameFree: true,
        barber: { select: { displayName: true } },
        items: { include: { service: { select: { name: true } } } },
      },
    }),
  ]);

  const byBarberMap = new Map<
    string,
    {
      barberName: string;
      servicesCount: number;
      revenue: number;
      totalDuration: number;
      barberEarning: number;
      businessEarning: number;
      services: Map<string, { serviceName: string; servicesCount: number; revenue: number }>;
      cashTotal: number;
      transferTotal: number;
      transfers: Array<{ sessionId: string; clientName: string; amount: number; startedAt: Date }>;
    }
  >();
  const byServiceMap = new Map<string, { serviceName: string; servicesCount: number; revenue: number }>();
  const byHourMap = new Map<number, number>();

  let totalBarberEarning = 0;
  let totalBusinessEarning = 0;

  for (const session of sessions) {
    const price = Number(session.totalPrice);
    const duration = session.durationSeconds ?? 0;
    const commissionPercent = Number(session.commissionPercentAtCompletion ?? 0);
    const { barberEarning, businessEarning } = computeEarnings(price, commissionPercent);
    totalBarberEarning += barberEarning;
    totalBusinessEarning += businessEarning;

    const barberEntry = byBarberMap.get(session.barberId) ?? {
      barberName: session.barber.displayName,
      servicesCount: 0,
      revenue: 0,
      totalDuration: 0,
      barberEarning: 0,
      businessEarning: 0,
      services: new Map<string, { serviceName: string; servicesCount: number; revenue: number }>(),
      cashTotal: 0,
      transferTotal: 0,
      transfers: [],
    };
    barberEntry.servicesCount += 1;
    barberEntry.revenue += price;
    barberEntry.totalDuration += duration;
    barberEntry.barberEarning += barberEarning;
    barberEntry.businessEarning += businessEarning;
    if (session.paymentMethod === "TRANSFER") {
      barberEntry.transferTotal += price;
      barberEntry.transfers.push({
        sessionId: session.id,
        clientName: session.clientNameFree ?? "",
        amount: price,
        startedAt: session.startedAt,
      });
    } else {
      barberEntry.cashTotal += price;
    }
    byBarberMap.set(session.barberId, barberEntry);

    for (const item of session.items) {
      const itemPrice = Number(item.priceAtStart);
      const serviceEntry = byServiceMap.get(item.serviceId) ?? {
        serviceName: item.service.name,
        servicesCount: 0,
        revenue: 0,
      };
      serviceEntry.servicesCount += 1;
      serviceEntry.revenue += itemPrice;
      byServiceMap.set(item.serviceId, serviceEntry);

      const barberServiceEntry = barberEntry.services.get(item.serviceId) ?? {
        serviceName: item.service.name,
        servicesCount: 0,
        revenue: 0,
      };
      barberServiceEntry.servicesCount += 1;
      barberServiceEntry.revenue += itemPrice;
      barberEntry.services.set(item.serviceId, barberServiceEntry);
    }

    const hour = session.startedAt.getHours();
    byHourMap.set(hour, (byHourMap.get(hour) ?? 0) + 1);
  }

  const byBarber = Array.from(byBarberMap.entries()).map(([barberId, v]) => ({
    barberId,
    barberName: v.barberName,
    servicesCount: v.servicesCount,
    revenue: v.revenue.toFixed(2),
    avgDurationSeconds: v.servicesCount ? Math.round(v.totalDuration / v.servicesCount) : 0,
    barberEarning: v.barberEarning.toFixed(2),
    businessEarning: v.businessEarning.toFixed(2),
    services: Array.from(v.services.entries())
      .map(([serviceId, s]) => ({
        serviceId,
        serviceName: s.serviceName,
        servicesCount: s.servicesCount,
        revenue: s.revenue.toFixed(2),
      }))
      .sort((a, b) => b.servicesCount - a.servicesCount),
    cashTotal: v.cashTotal.toFixed(2),
    transferTotal: v.transferTotal.toFixed(2),
    transfers: v.transfers
      .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())
      .map((t) => ({
        sessionId: t.sessionId,
        clientName: t.clientName,
        amount: t.amount.toFixed(2),
        startedAt: t.startedAt.toISOString(),
      })),
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
  const revenue = Number(totals._sum.totalPrice ?? 0);

  return {
    range: { from: filters.from.toISOString(), to: filters.to.toISOString() },
    totals: {
      servicesCount,
      revenue: revenue.toFixed(2),
      avgTicket: servicesCount ? (revenue / servicesCount).toFixed(2) : "0.00",
      avgDurationSeconds: Math.round(totals._avg.durationSeconds ?? 0),
      barberEarning: totalBarberEarning.toFixed(2),
      businessEarning: totalBusinessEarning.toFixed(2),
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
      items: { include: { service: { select: { name: true } } } },
    },
    orderBy: { startedAt: "asc" },
  });
}
