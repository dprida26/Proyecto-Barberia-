import fs from "node:fs/promises";
import path from "node:path";
import { Server as SocketIOServer } from "socket.io";
import { buildApp } from "./app";
import { env } from "./config/env";
import { registerDashboardNamespace } from "./websockets/dashboard.namespace";
import { setIoInstance } from "./websockets/io";

async function main() {
  await fs.mkdir(path.join(env.uploadsDir, "logos"), { recursive: true });

  const app = buildApp();

  await app.ready();

  const io = new SocketIOServer(app.server, {
    cors: { origin: env.corsOrigin, credentials: true },
  });
  registerDashboardNamespace(io);
  setIoInstance(io);

  await app.listen({ port: env.port, host: "0.0.0.0" });
  app.log.info(`BarberOps API escuchando en el puerto ${env.port}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
