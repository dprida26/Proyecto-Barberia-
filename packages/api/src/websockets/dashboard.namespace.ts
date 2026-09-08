import type { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { JwtPayload } from "../common/types";

export function registerDashboardNamespace(io: SocketIOServer) {
  const namespace = io.of("/dashboard");

  namespace.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Unauthorized"));
    try {
      const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;
      socket.data.tenantId = payload.tenantId;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  namespace.on("connection", (socket: Socket) => {
    const tenantId = socket.data.tenantId as string;
    socket.join(tenantId);
  });
}
