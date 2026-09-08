import type { Server as SocketIOServer } from "socket.io";

let ioInstance: SocketIOServer | null = null;

export function setIoInstance(io: SocketIOServer) {
  ioInstance = io;
}

export function emitToTenant(tenantId: string, event: string, payload: unknown) {
  ioInstance?.of("/dashboard").to(tenantId).emit(event, payload);
}
