import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "./errors";

export function errorHandler(error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({ error: { code: error.code, message: error.message } });
  }

  if (error instanceof ZodError) {
    return reply.code(400).send({
      error: {
        code: "VALIDATION_ERROR",
        message: "Datos invalidos",
        details: error.flatten(),
      },
    });
  }

  request.log.error(error);
  return reply.code(500).send({ error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" } });
}
