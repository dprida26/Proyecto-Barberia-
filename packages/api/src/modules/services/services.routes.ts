import type { FastifyInstance } from "fastify";
import {
  createServiceCatalogSchema,
  updateServiceCatalogSchema,
  setCommissionOverridesSchema,
} from "@barberops/shared";
import { authGuard, roleGuard } from "../../common/guards";
import {
  createService,
  listCommissionOverrides,
  listServices,
  setCommissionOverrides,
  updateService,
} from "./services.service";

export async function servicesRoutes(app: FastifyInstance) {
  app.get("/services", { preHandler: [authGuard] }, async (request) => {
    const includeInactive = request.user.role === "ADMIN" && (request.query as any)?.includeInactive === "true";
    const services = await listServices(request.user.tenantId, includeInactive);
    return { data: services };
  });

  app.post("/services", { preHandler: [authGuard, roleGuard(["ADMIN"])] }, async (request, reply) => {
    const body = createServiceCatalogSchema.parse(request.body);
    const service = await createService(request.user.tenantId, body, request.user.sub);
    reply.code(201).send({ data: service });
  });

  app.patch("/services/:id", { preHandler: [authGuard, roleGuard(["ADMIN"])] }, async (request) => {
    const { id } = request.params as { id: string };
    const body = updateServiceCatalogSchema.parse(request.body);
    const service = await updateService(request.user.tenantId, id, body, request.user.sub);
    return { data: service };
  });

  app.get(
    "/services/:id/commission-overrides",
    { preHandler: [authGuard, roleGuard(["ADMIN"])] },
    async (request) => {
      const { id } = request.params as { id: string };
      const overrides = await listCommissionOverrides(request.user.tenantId, id);
      return { data: overrides };
    },
  );

  app.put(
    "/services/:id/commission-overrides",
    { preHandler: [authGuard, roleGuard(["ADMIN"])] },
    async (request) => {
      const { id } = request.params as { id: string };
      const body = setCommissionOverridesSchema.parse(request.body);
      const overrides = await setCommissionOverrides(
        request.user.tenantId,
        id,
        body.overrides,
        request.user.sub,
      );
      return { data: overrides };
    },
  );
}
