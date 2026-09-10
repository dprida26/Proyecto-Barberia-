import { prisma } from "../src/database/client";
import {
  cancelServiceSession,
  finishServiceSession,
  startServiceSession,
} from "../src/modules/service-sessions/service-sessions.service";

describe("service-sessions", () => {
  let tenantId: string;
  let barberUserId: string;
  let barberId: string;
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

    const barber = await prisma.barber.create({
      data: { tenantId, userId: user.id, displayName: "Test Barbero", commissionPercent: 50 },
    });
    barberId = barber.id;

    const service = await prisma.serviceCatalog.create({
      data: { tenantId, name: "Corte test", durationEstimateMin: 30, currentPrice: 20000 },
    });
    serviceId = service.id;
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { tenantId } });
    await prisma.barberServiceCommission.deleteMany({ where: { tenantId } });
    await prisma.serviceSession.deleteMany({ where: { tenantId } });
    await prisma.serviceCatalog.deleteMany({ where: { tenantId } });
    await prisma.barber.deleteMany({ where: { tenantId } });
    await prisma.user.deleteMany({ where: { tenantId } });
    await prisma.tenant.delete({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it("snapshots the current price at start and does not change on later price updates", async () => {
    const session = await startServiceSession(tenantId, barberUserId, {
      serviceIds: [serviceId],
      paymentMethod: "CASH",
    });
    expect(Number(session.totalPrice)).toBe(20000);

    await prisma.serviceCatalog.update({ where: { id: serviceId }, data: { currentPrice: 99999 } });

    const finished = await finishServiceSession(tenantId, session.id, barberUserId);
    expect(Number(finished.totalPrice)).toBe(20000);
    expect(finished.status).toBe("COMPLETED");
    expect(finished.durationSeconds).toBeGreaterThanOrEqual(0);

    await prisma.serviceCatalog.update({ where: { id: serviceId }, data: { currentPrice: 20000 } });
  });

  it("does not allow starting a second active session for the same barber", async () => {
    const first = await startServiceSession(tenantId, barberUserId, {
      serviceIds: [serviceId],
      paymentMethod: "CASH",
    });

    await expect(
      startServiceSession(tenantId, barberUserId, { serviceIds: [serviceId], paymentMethod: "CASH" }),
    ).rejects.toThrow("ya tiene un servicio en curso");

    await cancelServiceSession(tenantId, first.id, barberUserId, false, {});
  });

  it("frees the barber to start a new session after cancelling", async () => {
    const first = await startServiceSession(tenantId, barberUserId, {
      serviceIds: [serviceId],
      paymentMethod: "CASH",
    });
    await cancelServiceSession(tenantId, first.id, barberUserId, false, { cancelReason: "cliente se fue" });

    const second = await startServiceSession(tenantId, barberUserId, {
      serviceIds: [serviceId],
      paymentMethod: "CASH",
    });
    expect(second.status).toBe("IN_SERVICE");

    await cancelServiceSession(tenantId, second.id, barberUserId, false, {});
  });

  it("uses the barber+service commission override instead of the barber's general commission", async () => {
    await prisma.barberServiceCommission.create({
      data: { tenantId, barberId, serviceId, commissionPercent: 40 },
    });

    const session = await startServiceSession(tenantId, barberUserId, {
      serviceIds: [serviceId],
      paymentMethod: "CASH",
    });

    const items = await prisma.serviceSessionItem.findMany({ where: { sessionId: session.id } });
    expect(Number(items[0].commissionPercent)).toBe(40);

    await cancelServiceSession(tenantId, session.id, barberUserId, false, {});
    await prisma.barberServiceCommission.deleteMany({ where: { tenantId, barberId, serviceId } });
  });

  it("applies the wednesday price when the service has one and today is wednesday", async () => {
    await prisma.serviceCatalog.update({
      where: { id: serviceId },
      data: { wednesdayPrice: 15000 },
    });

    const RealDate = Date;
    function mockDateTo(fixed: Date) {
      class MockDate extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super(fixed.getTime());
          } else {
            // @ts-expect-error - forwarding constructor args to the real Date
            super(...args);
          }
        }
        static now() {
          return fixed.getTime();
        }
      }
      // @ts-expect-error - swapping the global Date constructor for the test
      global.Date = MockDate;
    }

    const wednesday = new RealDate("2026-09-09T15:00:00-04:00"); // miercoles en America/Asuncion
    mockDateTo(wednesday);
    try {
      const session = await startServiceSession(tenantId, barberUserId, {
        serviceIds: [serviceId],
        paymentMethod: "CASH",
      });
      expect(Number(session.totalPrice)).toBe(15000);
      await cancelServiceSession(tenantId, session.id, barberUserId, false, {});
    } finally {
      global.Date = RealDate;
    }

    const thursday = new RealDate("2026-09-10T15:00:00-04:00"); // jueves en America/Asuncion
    mockDateTo(thursday);
    try {
      const session = await startServiceSession(tenantId, barberUserId, {
        serviceIds: [serviceId],
        paymentMethod: "CASH",
      });
      expect(Number(session.totalPrice)).toBe(20000);
      await cancelServiceSession(tenantId, session.id, barberUserId, false, {});
    } finally {
      global.Date = RealDate;
    }

    await prisma.serviceCatalog.update({ where: { id: serviceId }, data: { wednesdayPrice: null } });
  }, 15000);
});
