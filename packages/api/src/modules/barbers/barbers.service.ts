import { prisma } from "../../database/client";
import { hashPassword } from "../auth/auth.service";
import { recordAudit } from "../audit/audit.service";
import { NotFoundError } from "../../common/errors";
import type { CreateBarberInput, UpdateBarberInput } from "@barberops/shared";

export async function listBarbers(tenantId: string) {
  return prisma.barber.findMany({
    where: { tenantId },
    include: { user: { select: { email: true, isActive: true } } },
    orderBy: { displayName: "asc" },
  });
}

export async function createBarber(tenantId: string, input: CreateBarberInput, actingUserId: string) {
  const passwordHash = await hashPassword(input.password);

  const barber = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        tenantId,
        email: input.email,
        passwordHash,
        role: "BARBER",
      },
    });
    return tx.barber.create({
      data: {
        tenantId,
        userId: user.id,
        displayName: input.displayName,
      },
      include: { user: { select: { email: true } } },
    });
  });

  await recordAudit({
    tenantId,
    userId: actingUserId,
    action: "BARBER_CREATED",
    entityType: "Barber",
    entityId: barber.id,
  });

  return barber;
}

export async function updateBarber(tenantId: string, barberId: string, input: UpdateBarberInput, actingUserId: string) {
  const existing = await prisma.barber.findFirst({ where: { id: barberId, tenantId } });
  if (!existing) throw new NotFoundError("Barbero no encontrado");

  const updated = await prisma.barber.update({
    where: { id: barberId },
    data: {
      displayName: input.displayName ?? undefined,
      isAvailable: input.isAvailable ?? undefined,
    },
  });

  await recordAudit({
    tenantId,
    userId: actingUserId,
    action: "BARBER_UPDATED",
    entityType: "Barber",
    entityId: barberId,
    metadata: input,
  });

  return updated;
}
