import type { FastifyInstance } from "fastify";
import { loginSchema } from "@barberops/shared";
import { validateCredentials } from "./auth.service";
import { authGuard } from "../../common/guards";
import type { JwtPayload } from "../../common/types";
import { env } from "../../config/env";

export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/login", async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const user = await validateCredentials(body.email, body.password);

    const payload: JwtPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    };

    const accessToken = app.jwt.sign(payload, { expiresIn: "15m" });
    const refreshToken = app.jwt.sign(payload, { expiresIn: "7d" });

    reply
      .setCookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: env.corsOrigin.startsWith("https://"),
        sameSite: "lax",
        path: "/api/v1/auth",
        maxAge: 60 * 60 * 24 * 7,
      })
      .send({
        accessToken,
        user: {
          id: user.id,
          tenantId: user.tenantId,
          email: user.email,
          role: user.role,
          displayName: user.barber?.displayName ?? user.email,
        },
      });
  });

  app.post("/auth/refresh", async (request, reply) => {
    const token = request.cookies.refreshToken;
    if (!token) {
      return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Sin sesion activa" } });
    }
    try {
      const decoded = app.jwt.verify<JwtPayload>(token);
      const accessToken = app.jwt.sign(
        { sub: decoded.sub, tenantId: decoded.tenantId, role: decoded.role, email: decoded.email },
        { expiresIn: "15m" },
      );
      return reply.send({ accessToken });
    } catch {
      return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Refresh token invalido" } });
    }
  });

  app.post("/auth/logout", { preHandler: [authGuard] }, async (_request, reply) => {
    reply.clearCookie("refreshToken", { path: "/api/v1/auth" }).send({ success: true });
  });
}
