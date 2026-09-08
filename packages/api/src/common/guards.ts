import type { FastifyReply, FastifyRequest } from "fastify";
import type { UserRole } from "@barberops/shared";

export async function authGuard(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Token invalido o ausente" } });
  }
}

export function roleGuard(allowedRoles: UserRole[]) {
  return async function (request: FastifyRequest, reply: FastifyReply) {
    const user = request.user;
    if (!user || !allowedRoles.includes(user.role)) {
      reply.code(403).send({ error: { code: "FORBIDDEN", message: "No tienes permisos para esta accion" } });
    }
  };
}
