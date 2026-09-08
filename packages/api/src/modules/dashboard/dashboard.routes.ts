import type { FastifyInstance } from "fastify";
import { authGuard, roleGuard } from "../../common/guards";
import { getLiveSnapshot } from "./dashboard.service";

export async function dashboardRoutes(app: FastifyInstance) {
  app.get("/dashboard/live", { preHandler: [authGuard, roleGuard(["ADMIN"])] }, async (request) => {
    const snapshot = await getLiveSnapshot(request.user.tenantId);
    return { data: snapshot };
  });
}
