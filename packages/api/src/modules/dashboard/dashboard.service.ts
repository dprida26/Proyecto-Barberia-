import { prisma } from "../../database/client";

export async function getLiveSnapshot(tenantId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const barbers = await prisma.barber.findMany({
    where: { tenantId },
    include: {
      serviceSessions: {
        where: { status: "IN_SERVICE" },
        include: { service: { select: { name: true } } },
        take: 1,
      },
    },
    orderBy: { displayName: "asc" },
  });

  const [servicesToday, servicesInProgress, revenueAgg] = await Promise.all([
    prisma.serviceSession.count({
      where: { tenantId, status: "COMPLETED", startedAt: { gte: startOfDay } },
    }),
    prisma.serviceSession.count({ where: { tenantId, status: "IN_SERVICE" } }),
    prisma.serviceSession.aggregate({
      where: { tenantId, status: "COMPLETED", startedAt: { gte: startOfDay } },
      _sum: { priceAtStart: true },
    }),
  ]);

  const barbersActive = barbers.filter((b) => b.currentStatus === "IN_SERVICE").length;
  const barbersAvailable = barbers.filter((b) => b.currentStatus === "AVAILABLE" && b.isAvailable).length;

  return {
    barbers: barbers.map((b) => ({
      id: b.id,
      tenantId: b.tenantId,
      displayName: b.displayName,
      isAvailable: b.isAvailable,
      currentStatus: b.currentStatus,
      activeSession: b.serviceSessions[0]
        ? {
            id: b.serviceSessions[0].id,
            serviceId: b.serviceSessions[0].serviceId,
            serviceName: b.serviceSessions[0].service.name,
            startedAt: b.serviceSessions[0].startedAt,
            clientNameFree: b.serviceSessions[0].clientNameFree,
          }
        : null,
    })),
    kpis: {
      servicesToday,
      servicesInProgress,
      barbersActive,
      barbersAvailable,
      revenueToday: (revenueAgg._sum.priceAtStart ?? 0).toString(),
    },
  };
}
