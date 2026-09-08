import bcrypt from "bcryptjs";
import { prisma } from "../../database/client";
import { AppError } from "../../common/errors";
import { recordAudit } from "../audit/audit.service";

export async function validateCredentials(email: string, password: string) {
  const user = await prisma.user.findFirst({
    where: { email, isActive: true },
    include: { barber: true },
  });

  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email o contrasena incorrectos");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Email o contrasena incorrectos");
  }

  await recordAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: "USER_LOGIN",
    entityType: "User",
    entityId: user.id,
  });

  return user;
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}
