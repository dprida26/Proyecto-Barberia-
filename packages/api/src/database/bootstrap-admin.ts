import bcrypt from "bcryptjs";
import { prisma } from "./client";

/**
 * Crea el tenant y el usuario admin si todavia no existen, sin datos de
 * prueba (barberos, servicios, historial). Pensado para correr al arrancar
 * el contenedor api en produccion, donde no hay acceso a un shell/DB externa
 * para correr el seed manualmente. Es idempotente: si el tenant ya existe,
 * no hace nada.
 */
async function main() {
  const existing = await prisma.tenant.findFirst();
  if (existing) {
    console.log("Bootstrap: ya existe un tenant, no se crea nada.");
    return;
  }

  const tenant = await prisma.tenant.create({
    data: { name: "Titi Barberia", slug: "titi-barberia" },
  });

  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: "admin@barberia.com",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  console.log("Bootstrap completado. Tenant:", tenant.slug);
  console.log("Admin: admin@barberia.com / admin123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
