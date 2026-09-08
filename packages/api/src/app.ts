import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import jwt from "@fastify/jwt";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { env } from "./config/env";
import { errorHandler } from "./common/error-handler";
import { authRoutes } from "./modules/auth/auth.routes";
import { barbersRoutes } from "./modules/barbers/barbers.routes";
import { servicesRoutes } from "./modules/services/services.routes";
import { serviceSessionsRoutes } from "./modules/service-sessions/service-sessions.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import { reportsRoutes } from "./modules/reports/reports.routes";
import { auditRoutes } from "./modules/audit/audit.routes";
import { tenantRoutes } from "./modules/tenant/tenant.routes";

export function buildApp() {
  const app = Fastify({
    logger: env.nodeEnv === "development" ? { transport: { target: "pino-pretty" } } : true,
  });

  app.register(helmet, { crossOriginResourcePolicy: { policy: "cross-origin" } });
  app.register(cors, { origin: env.corsOrigin, credentials: true });
  app.register(cookie);
  app.register(jwt, { secret: env.jwtSecret });
  app.register(rateLimit, { max: 100, timeWindow: "1 minute" });
  app.register(multipart, { limits: { fileSize: 2 * 1024 * 1024 } });
  app.register(fastifyStatic, { root: env.uploadsDir, prefix: "/uploads/" });

  app.setErrorHandler(errorHandler);

  app.register(
    async (v1) => {
      await v1.register(authRoutes);
      await v1.register(barbersRoutes);
      await v1.register(servicesRoutes);
      await v1.register(serviceSessionsRoutes);
      await v1.register(dashboardRoutes);
      await v1.register(reportsRoutes);
      await v1.register(auditRoutes);
      await v1.register(tenantRoutes);
    },
    { prefix: "/api/v1" },
  );

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
