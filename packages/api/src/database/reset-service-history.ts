import { prisma } from "./client";

/**
 * Borra todo el historial de servicios (sesiones + items) y los audit logs
 * relacionados, dejando intacta la configuracion: tenant, usuarios, barberos,
 * catalogo de servicios (con sus precios/comisiones especiales).
 *
 * Uso: npx tsx src/database/reset-service-history.ts
 * Requiere confirmar explicitamente con --yes, para evitar borrados accidentales.
 */

const SERVICE_RELATED_AUDIT_ACTIONS = [
  "SERVICE_STARTED",
  "SERVICE_FINISHED",
  "SERVICE_CANCELLED",
] as const;

async function main() {
  const confirmed = process.argv.includes("--yes");

  const [sessionCount, auditCount] = await Promise.all([
    prisma.serviceSession.count(),
    prisma.auditLog.count({ where: { action: { in: [...SERVICE_RELATED_AUDIT_ACTIONS] } } }),
  ]);

  console.log(`Se van a borrar ${sessionCount} ServiceSession (con sus items en cascada).`);
  console.log(`Se van a borrar ${auditCount} AuditLog de acciones: ${SERVICE_RELATED_AUDIT_ACTIONS.join(", ")}.`);
  console.log("No se toca: Tenant, User, Barber, ServiceCatalog, BarberServiceCommission.");

  if (!confirmed) {
    console.log("\nEsto NO se ejecuto todavia (dry-run). Para confirmar, correr con --yes:");
    console.log("  npx tsx src/database/reset-service-history.ts --yes");
    return;
  }

  const deletedAudit = await prisma.auditLog.deleteMany({
    where: { action: { in: [...SERVICE_RELATED_AUDIT_ACTIONS] } },
  });
  const deletedSessions = await prisma.serviceSession.deleteMany({});

  console.log(`\nListo. Borrados: ${deletedSessions.count} sesiones, ${deletedAudit.count} audit logs.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
