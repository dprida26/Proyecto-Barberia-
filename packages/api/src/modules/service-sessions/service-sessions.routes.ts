import type { FastifyInstance } from "fastify";
import { cancelServiceSessionSchema, startServiceSessionSchema } from "@barberops/shared";
import { authGuard, roleGuard } from "../../common/guards";
import {
  cancelServiceSession,
  finishServiceSession,
  getMyTodaySessions,
  listServiceSessions,
  startServiceSession,
} from "./service-sessions.service";

export async function serviceSessionsRoutes(app: FastifyInstance) {
  app.post(
    "/service-sessions/start",
    { preHandler: [authGuard, roleGuard(["BARBER"])] },
    async (request, reply) => {
      const body = startServiceSessionSchema.parse(request.body);
      const session = await startServiceSession(request.user.tenantId, request.user.sub, body);
      reply.code(201).send({ data: session });
    },
  );

  app.post(
    "/service-sessions/:id/finish",
    { preHandler: [authGuard, roleGuard(["BARBER"])] },
    async (request) => {
      const { id } = request.params as { id: string };
      const session = await finishServiceSession(request.user.tenantId, id, request.user.sub);
      return { data: session };
    },
  );

  app.post(
    "/service-sessions/:id/cancel",
    { preHandler: [authGuard, roleGuard(["BARBER", "ADMIN"])] },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = cancelServiceSessionSchema.parse(request.body ?? {});
      const session = await cancelServiceSession(
        request.user.tenantId,
        id,
        request.user.sub,
        request.user.role === "ADMIN",
        body,
      );
      return { data: session };
    },
  );

  app.get(
    "/service-sessions/mine/today",
    { preHandler: [authGuard, roleGuard(["BARBER"])] },
    async (request) => {
      const sessions = await getMyTodaySessions(request.user.tenantId, request.user.sub);
      return { data: sessions };
    },
  );

  app.get("/service-sessions", { preHandler: [authGuard, roleGuard(["ADMIN"])] }, async (request) => {
    const query = request.query as Record<string, string | undefined>;
    const sessions = await listServiceSessions(request.user.tenantId, {
      from: query.from ? new Date(query.from) : undefined,
      to: query.to ? new Date(query.to) : undefined,
      barberId: query.barberId,
      serviceId: query.serviceId,
      status: query.status,
    });
    return { data: sessions };
  });
}
