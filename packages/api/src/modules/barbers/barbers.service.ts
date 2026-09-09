import { prisma } from "../../database/client";
import { hashPassword } from "../auth/auth.service";
import { recordAudit } from "../audit/audit.service";
import { ConflictError, NotFoundError } from "../../common/errors";
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
        commissionPercent: input.commissionPercent,
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

  if (input.email) {
    const emailTaken = await prisma.user.findFirst({
      where: { tenantId, email: input.email, NOT: { id: existing.userId } },
    });
    if (emailTaken) throw new ConflictError("Ya existe un usuario con ese email");
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (input.email) {
      await tx.user.update({ where: { id: existing.userId }, data: { email: input.email } });
    }
    return tx.barber.update({
      where: { id: barberId },
      data: {
        displayName: input.displayName ?? undefined,
        isAvailable: input.isAvailable ?? undefined,
        commissionPercent: input.commissionPercent ?? undefined,
      },
      include: { user: { select: { email: true, isActive: true } } },
    });
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
