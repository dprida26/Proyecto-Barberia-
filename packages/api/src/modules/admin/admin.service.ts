import { prisma } from "../../database/client";
import { recordAudit } from "../audit/audit.service";

const SERVICE_RELATED_AUDIT_ACTIONS = ["SERVICE_STARTED", "SERVICE_FINISHED", "SERVICE_CANCELLED"] as const;

/**
 * Borra el historial de servicios (sesiones + items en cascada) y los audit
 * logs relacionados de un tenant, dejando intacta la configuracion: usuarios,
 * barberos, catalogo de servicios y comisiones especiales.
 */
export async function resetServiceHistory(tenantId: string, actingUserId: string) {
  const deletedAudit = await prisma.auditLog.deleteMany({
    where: { tenantId, action: { in: [...SERVICE_RELATED_AUDIT_ACTIONS] } },
  });
  const deletedSessions = await prisma.serviceSession.deleteMany({ where: { tenantId } });

  await recordAudit({
    tenantId,
    userId: actingUserId,
    action: "TENANT_SETTINGS_UPDATED",
    entityType: "Tenant",
    entityId: tenantId,
    metadata: {
      reason: "reset_service_history",
      deletedSessions: deletedSessions.count,
      deletedAuditLogs: deletedAudit.count,
    },
  });

  return { deletedSessions: deletedSessions.count, deletedAuditLogs: deletedAudit.count };
}
