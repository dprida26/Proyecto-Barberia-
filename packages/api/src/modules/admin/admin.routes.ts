import type { FastifyInstance } from "fastify";
import { env } from "../../config/env";
import { authGuard, roleGuard } from "../../common/guards";
import { ForbiddenError, ValidationError } from "../../common/errors";
import { resetServiceHistory } from "./admin.service";

const CONFIRMATION_PHRASE = "BORRAR HISTORIAL";

export async function adminRoutes(app: FastifyInstance) {
  app.post(
    "/admin/reset-service-history",
    { preHandler: [authGuard, roleGuard(["ADMIN"])] },
    async (request) => {
      if (!env.enableAdminReset) {
        throw new ForbiddenError(
          "Esta accion esta deshabilitada. Para habilitarla temporalmente, setear ENABLE_ADMIN_RESET=true en el entorno de la API.",
        );
      }

      const body = request.body as { confirm?: string } | undefined;
      if (body?.confirm !== CONFIRMATION_PHRASE) {
        throw new ValidationError(
          `Confirmacion invalida. Enviar { "confirm": "${CONFIRMATION_PHRASE}" } en el body para confirmar el borrado.`,
        );
      }

      const result = await resetServiceHistory(request.user.tenantId, request.user.sub);
      return { data: result };
    },
  );
}
