-- Move soft-delete fields from service_sessions (whole session) to
-- service_session_items (individual item), so deleting one service out of
-- a multi-service session no longer removes the whole session.

-- 1) Add the new columns on service_session_items
ALTER TABLE "service_session_items" ADD COLUMN "deleteReason" TEXT;
ALTER TABLE "service_session_items" ADD COLUMN "deletedAt" TIMESTAMPTZ(3);
ALTER TABLE "service_session_items" ADD COLUMN "deletedByUserId" TEXT;

-- 2) Backfill: any session already marked DELETED had all of its items
-- deleted together (previous behavior), so propagate the session-level
-- delete metadata to every item belonging to it.
UPDATE "service_session_items" AS item
SET "deleteReason" = session."deleteReason",
    "deletedAt" = session."deletedAt",
    "deletedByUserId" = session."deletedByUserId"
FROM "service_sessions" AS session
WHERE item."sessionId" = session.id
  AND session."deleteReason" IS NOT NULL;

-- 3) Drop the old session-level columns
ALTER TABLE "service_sessions" DROP COLUMN "deleteReason";
ALTER TABLE "service_sessions" DROP COLUMN "deletedAt";
ALTER TABLE "service_sessions" DROP COLUMN "deletedByUserId";

-- 4) Add SERVICE_ITEM_DELETED audit action
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SERVICE_ITEM_DELETED';
