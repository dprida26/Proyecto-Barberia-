import bcrypt from "bcryptjs";
import { prisma } from "./client";

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "barberia-demo" },
    update: {},
    create: { name: "Barberia Demo", slug: "barberia-demo" },
  });

  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "admin@barberia.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@barberia.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const barberSeeds = [
    { email: "juan@barberia.com", displayName: "Juan", commissionPercent: 50 },
    { email: "pedro@barberia.com", displayName: "Pedro", commissionPercent: 60 },
  ];

  const barberPasswordHash = await bcrypt.hash("barbero123", 10);
  const barbers: { id: string; commissionPercent: number }[] = [];

  for (const seed of barberSeeds) {
    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tenant.id, email: seed.email } },
      update: {},
      create: {
        tenantId: tenant.id,
        email: seed.email,
        passwordHash: barberPasswordHash,
        role: "BARBER",
      },
    });

    const barber = await prisma.barber.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        tenantId: tenant.id,
        userId: user.id,
        displayName: seed.displayName,
        commissionPercent: seed.commissionPercent,
      },
    });

    barbers.push({ id: barber.id, commissionPercent: Number(barber.commissionPercent) });
  }

  const serviceSeeds = [
    { name: "Corte clasico", durationEstimateMin: 30, currentPrice: 15000, category: "Corte" },
    { name: "Corte + barba", durationEstimateMin: 45, currentPrice: 25000, category: "Combo" },
    { name: "Barba", durationEstimateMin: 20, currentPrice: 10000, category: "Barba" },
    { name: "Corte infantil", durationEstimateMin: 25, currentPrice: 12000, category: "Corte" },
    { name: "Perfilado", durationEstimateMin: 15, currentPrice: 8000, category: "Barba" },
  ];

  const services: { id: string; durationEstimateMin: number; currentPrice: number }[] = [];

  for (const seed of serviceSeeds) {
    const existing = await prisma.serviceCatalog.findFirst({
      where: { tenantId: tenant.id, name: seed.name },
    });
    const service =
      existing ??
      (await prisma.serviceCatalog.create({
        data: { tenantId: tenant.id, ...seed },
      }));
    services.push({
      id: service.id,
      durationEstimateMin: seed.durationEstimateMin,
      currentPrice: seed.currentPrice,
    });
  }

  const existingSessionsCount = await prisma.serviceSession.count({ where: { tenantId: tenant.id } });

  if (existingSessionsCount === 0) {
    const clientNames = ["Diego", "Marcos", "Lucas", "Fabian", "Ruben", "Nestor", "Andres", "Ariel", null, null];
    const workHours = [8, 9, 10, 11, 13, 14, 15, 16, 17, 18];
    const sessionsData: Array<{
      tenantId: string;
      barberId: string;
      serviceId: string;
      clientNameFree: string | null;
      priceAtStart: number;
      commissionPercentAtCompletion: number;
      status: "COMPLETED";
      startedAt: Date;
      endedAt: Date;
      durationSeconds: number;
    }> = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
      const day = new Date(today);
      day.setDate(day.getDate() - daysAgo);

      const sessionsThisDay = randomInt(2, 5);

      for (let i = 0; i < sessionsThisDay; i++) {
        const barber = pick(barbers);
        const service = pick(services);
        const hour = pick(workHours);
        const minute = randomInt(0, 59);

        const startedAt = new Date(day);
        startedAt.setHours(hour, minute, 0, 0);

        // Evitar sesiones "de hoy" en horarios futuros respecto al momento del seed.
        if (daysAgo === 0 && startedAt > new Date()) continue;

        const durationSeconds = service.durationEstimateMin * 60 + randomInt(-120, 300);
        const endedAt = new Date(startedAt.getTime() + durationSeconds * 1000);

        sessionsData.push({
          tenantId: tenant.id,
          barberId: barber.id,
          serviceId: service.id,
          clientNameFree: pick(clientNames),
          priceAtStart: service.currentPrice,
          commissionPercentAtCompletion: barber.commissionPercent,
          status: "COMPLETED",
          startedAt,
          endedAt,
          durationSeconds,
        });
      }
    }

    await prisma.serviceSession.createMany({ data: sessionsData });
    console.log(`Historial de demo generado: ${sessionsData.length} servicios completados.`);
  }

  console.log("Seed completado. Tenant:", tenant.slug);
  console.log("Admin: admin@barberia.com / admin123");
  console.log("Barberos: juan/pedro@barberia.com / barbero123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
