import { prisma } from "../src/database/client";
import {
  cancelServiceSession,
  finishServiceSession,
  startServiceSession,
} from "../src/modules/service-sessions/service-sessions.service";

describe("service-sessions", () => {
  let tenantId: string;
  let barberUserId: string;
  let serviceId: string;

  beforeAll(async () => {
    const tenant = await prisma.tenant.create({
      data: { name: "Test Barberia", slug: `test-${Date.now()}` },
    });
    tenantId = tenant.id;

    const user = await prisma.user.create({
      data: { tenantId, email: `barbero-${Date.now()}@test.com`, passwordHash: "x", role: "BARBER" },
    });
    barberUserId = user.id;

    await prisma.barber.create({
      data: { tenantId, userId: user.id, displayName: "Test Barbero" },
    });

    const service = await prisma.serviceCatalog.create({
      data: { tenantId, name: "Corte test", durationEstimateMin: 30, currentPrice: 20000 },
    });
    serviceId = service.id;
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { tenantId } });
    await prisma.serviceSession.deleteMany({ where: { tenantId } });
    await prisma.serviceCatalog.deleteMany({ where: { tenantId } });
    await prisma.barber.deleteMany({ where: { tenantId } });
    await prisma.user.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it("snapshots the current price at start and does not change on later price updates", async () => {
    const session = await startServiceSession(tenantId, barberUserId, { serviceId });
    expect(Number(session.priceAtStart)).toBe(20000);

    await prisma.serviceCatalog.update({ where: { id: serviceId }, data: { currentPrice: 99999 } });

    const finished = await finishServiceSession(tenantId, session.id, barberUserId);
    expect(Number(finished.priceAtStart)).toBe(20000);
    expect(finished.status).toBe("COMPLETED");
    expect(finished.durationSeconds).toBeGreaterThanOrEqual(0);
  });

  it("does not allow starting a second active session for the same barber", async () => {
    const first = await startServiceSession(tenantId, barberUserId, { serviceId });

    await expect(startServiceSession(tenantId, barberUserId, { serviceId })).rejects.toThrow(
      "ya tiene un servicio en curso",
    );

    await cancelServiceSession(tenantId, first.id, barberUserId, false, {});
  });

  it("frees the barber to start a new session after cancelling", async () => {
    const first = await startServiceSession(tenantId, barberUserId, { serviceId });
    await cancelServiceSession(tenantId, first.id, barberUserId, false, { cancelReason: "cliente se fue" });

    const second = await startServiceSession(tenantId, barberUserId, { serviceId });
    expect(second.status).toBe("IN_SERVICE");

    await cancelServiceSession(tenantId, second.id, barberUserId, false, {});
  });
});
