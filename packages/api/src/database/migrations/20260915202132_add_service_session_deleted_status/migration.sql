-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'SERVICE_DELETED';

-- AlterEnum
ALTER TYPE "ServiceSessionStatus" ADD VALUE 'DELETED';

-- AlterTable
ALTER TABLE "service_sessions" ADD COLUMN     "deleteReason" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMPTZ(3),
ADD COLUMN     "deletedByUserId" TEXT;
