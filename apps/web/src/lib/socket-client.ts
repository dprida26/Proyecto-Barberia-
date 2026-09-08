import { io, type Socket } from "socket.io-client";
import { apiBaseUrl } from "./env";

let socket: Socket | null = null;

export function getDashboardSocket(token: string): Socket {
  if (socket && socket.connected) return socket;

  socket = io(`${apiBaseUrl}/dashboard`, {
    auth: { token },
    transports: ["websocket"],
  });

  return socket;
}

export function disconnectDashboardSocket() {
  socket?.disconnect();
  socket = null;
}
