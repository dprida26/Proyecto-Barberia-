import type { FastifyInstance } from "fastify";
import { authGuard, roleGuard } from "../../common/guards";
import { listAuditLogs } from "./audit.service";

export async function auditRoutes(app: FastifyInstance) {
  app.get("/audit-logs", { preHandler: [authGuard, roleGuard(["ADMIN"])] }, async (request) => {
    const logs = await listAuditLogs(request.user.tenantId);
    return { data: logs };
  });
}
