import type { FastifyInstance } from "fastify";
import { createBarberSchema, updateBarberSchema } from "@barberops/shared";
import { authGuard, roleGuard } from "../../common/guards";
import { createBarber, deleteBarber, listBarbers, updateBarber } from "./barbers.service";

export async function barbersRoutes(app: FastifyInstance) {
  app.get("/barbers", { preHandler: [authGuard, roleGuard(["ADMIN"])] }, async (request) => {
    const barbers = await listBarbers(request.user.tenantId);
    return { data: barbers };
  });

  app.post("/barbers", { preHandler: [authGuard, roleGuard(["ADMIN"])] }, async (request, reply) => {
    const body = createBarberSchema.parse(request.body);
    const barber = await createBarber(request.user.tenantId, body, request.user.sub);
    reply.code(201).send({ data: barber });
  });

  app.patch("/barbers/:id", { preHandler: [authGuard, roleGuard(["ADMIN"])] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = updateBarberSchema.parse(request.body);
    const barber = await updateBarber(request.user.tenantId, id, body, request.user.sub);
    return { data: barber };
  });

  app.delete("/barbers/:id", { preHandler: [authGuard, roleGuard(["ADMIN"])] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteBarber(request.user.tenantId, id, request.user.sub);
    reply.code(204).send();
  });
}
