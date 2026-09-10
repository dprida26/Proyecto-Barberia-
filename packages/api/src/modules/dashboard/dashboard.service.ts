import { prisma } from "../../database/client";
import { computeEarnings } from "@barberops/shared";

export async function getLiveSnapshot(tenantId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const barbers = await prisma.barber.findMany({
    where: { tenantId },
    include: {
      serviceSessions: {
        where: { status: "IN_SERVICE" },
        include: { items: { include: { service: { select: { name: true } } } } },
        take: 1,
      },
    },
    orderBy: { displayName: "asc" },
  });

  const [servicesToday, servicesInProgress, completedTodaySessions] = await Promise.all([
    prisma.serviceSession.count({
      where: { tenantId, status: "COMPLETED", startedAt: { gte: startOfDay } },
    }),
    prisma.serviceSession.count({ where: { tenantId, status: "IN_SERVICE" } }),
    prisma.serviceSession.findMany({
      where: { tenantId, status: "COMPLETED", startedAt: { gte: startOfDay } },
      select: { barberId: true, totalPrice: true, commissionPercentAtCompletion: true },
    }),
  ]);

  const barbersActive = barbers.filter((b) => b.currentStatus === "IN_SERVICE").length;
  const barbersAvailable = barbers.filter((b) => b.currentStatus === "AVAILABLE" && b.isAvailable).length;

  const productionByBarber = new Map<string, { servicesCount: number; barberEarning: number; businessEarning: number }>();
  let revenueToday = 0;
  let businessEarningToday = 0;
  for (const session of completedTodaySessions) {
    const price = Number(session.totalPrice);
    revenueToday += price;
    const { barberEarning, businessEarning } = computeEarnings(price, Number(session.commissionPercentAtCompletion ?? 0));
    businessEarningToday += businessEarning;

    const entry = productionByBarber.get(session.barberId) ?? {
      servicesCount: 0,
      barberEarning: 0,
      businessEarning: 0,
    };
    entry.servicesCount += 1;
    entry.barberEarning += barberEarning;
    entry.businessEarning += businessEarning;
    productionByBarber.set(session.barberId, entry);
  }

  return {
    barbers: barbers.map((b) => ({
      id: b.id,
      tenantId: b.tenantId,
      displayName: b.displayName,
      isAvailable: b.isAvailable,
      currentStatus: b.currentStatus,
      commissionPercent: b.commissionPercent.toString(),
      activeSession: b.serviceSessions[0]
        ? {
            id: b.serviceSessions[0].id,
            services: b.serviceSessions[0].items.map((item) => ({
              serviceId: item.serviceId,
              serviceName: item.service.name,
              priceAtStart: item.priceAtStart.toFixed(2),
            })),
            totalPrice: b.serviceSessions[0].totalPrice.toFixed(2),
            startedAt: b.serviceSessions[0].startedAt,
            clientNameFree: b.serviceSessions[0].clientNameFree,
          }
        : null,
      todayProduction: {
        servicesCount: productionByBarber.get(b.id)?.servicesCount ?? 0,
        barberEarning: (productionByBarber.get(b.id)?.barberEarning ?? 0).toFixed(2),
        businessEarning: (productionByBarber.get(b.id)?.businessEarning ?? 0).toFixed(2),
      },
    })),
    kpis: {
      servicesToday,
      servicesInProgress,
      barbersActive,
      barbersAvailable,
      revenueToday: revenueToday.toFixed(2),
      businessEarningToday: businessEarningToday.toFixed(2),
    },
  };
}
