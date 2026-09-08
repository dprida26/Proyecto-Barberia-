import bcrypt from "bcryptjs";
import { prisma } from "./client";

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
    { email: "juan@barberia.com", displayName: "Juan" },
    { email: "pedro@barberia.com", displayName: "Pedro" },
    { email: "carlos@barberia.com", displayName: "Carlos" },
  ];

  const barberPasswordHash = await bcrypt.hash("barbero123", 10);

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

    await prisma.barber.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        tenantId: tenant.id,
        userId: user.id,
        displayName: seed.displayName,
      },
    });
  }

  const services = [
    { name: "Corte clasico", durationEstimateMin: 30, currentPrice: 15000, category: "Corte" },
    { name: "Corte + barba", durationEstimateMin: 45, currentPrice: 25000, category: "Combo" },
    { name: "Barba", durationEstimateMin: 20, currentPrice: 10000, category: "Barba" },
    { name: "Corte infantil", durationEstimateMin: 25, currentPrice: 12000, category: "Corte" },
    { name: "Perfilado", durationEstimateMin: 15, currentPrice: 8000, category: "Barba" },
  ];

  for (const service of services) {
    const existing = await prisma.serviceCatalog.findFirst({
      where: { tenantId: tenant.id, name: service.name },
    });
    if (!existing) {
      await prisma.serviceCatalog.create({
        data: { tenantId: tenant.id, ...service },
      });
    }
  }

  console.log("Seed completado. Tenant:", tenant.slug);
  console.log("Admin: admin@barberia.com / admin123");
  console.log("Barberos: juan/pedro/carlos@barberia.com / barbero123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
