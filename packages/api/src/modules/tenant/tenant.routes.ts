import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type { FastifyInstance } from "fastify";
import { updateTenantSettingsSchema } from "@barberops/shared";
import { authGuard, roleGuard } from "../../common/guards";
import { ValidationError } from "../../common/errors";
import { env } from "../../config/env";
import { getTenantSettings, updateTenantLogo, updateTenantSettings } from "./tenant.service";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

export async function tenantRoutes(app: FastifyInstance) {
  app.get("/tenant/settings", { preHandler: [authGuard] }, async (request) => {
    const tenant = await getTenantSettings(request.user.tenantId);
    return { data: tenant };
  });

  app.patch(
    "/tenant/settings",
    { preHandler: [authGuard, roleGuard(["ADMIN"])] },
    async (request) => {
      const body = updateTenantSettingsSchema.parse(request.body);
      const tenant = await updateTenantSettings(request.user.tenantId, body, request.user.sub);
      return { data: tenant };
    },
  );

  app.post(
    "/tenant/logo",
    { preHandler: [authGuard, roleGuard(["ADMIN"])] },
    async (request) => {
      const file = await request.file();
      if (!file) throw new ValidationError("No se recibio ningun archivo");

      const extension = ALLOWED_MIME_TYPES[file.mimetype];
      if (!extension) {
        throw new ValidationError("Formato de imagen no soportado. Usa PNG, JPG o WEBP");
      }

      const logosDir = path.join(env.uploadsDir, "logos");
      await fs.mkdir(logosDir, { recursive: true });

      const fileName = `${crypto.randomUUID()}${extension}`;
      const filePath = path.join(logosDir, fileName);
      await fs.writeFile(filePath, await file.toBuffer());

      const tenant = await updateTenantLogo(request.user.tenantId, fileName, request.user.sub);
      return { data: tenant };
    },
  );
}
