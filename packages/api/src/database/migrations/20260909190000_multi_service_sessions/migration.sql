-- Migracion a sesiones con multiples servicios.
--
-- Orden pensado para preservar los datos existentes (55 filas en
-- service_sessions al momento de escribir esta migracion) en vez del
-- DROP COLUMN directo que generaria Prisma por defecto:
--   A) crear service_session_items
--   B) agregar totalPrice como nullable
--   C) backfill: un item por cada sesion existente, copiando su
--      serviceId/priceAtStart
--   D) backfill de totalPrice desde el priceAtStart original
--   E) totalPrice pasa a NOT NULL
--   F) dropear la FK vieja y las columnas serviceId/priceAtStart

-- A: crear la tabla de items
CREATE TABLE "service_session_items" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "priceAtStart" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_session_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "service_session_items_sessionId_idx" ON "service_session_items"("sessionId");

ALTER TABLE "service_session_items" ADD CONSTRAINT "service_session_items_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "service_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "service_session_items" ADD CONSTRAINT "service_session_items_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- B: totalPrice nullable por ahora (las filas existentes todavia no tienen valor)
ALTER TABLE "service_sessions" ADD COLUMN "totalPrice" DECIMAL(10,2);

-- C: backfill de items desde las columnas viejas
INSERT INTO "service_session_items" ("id", "sessionId", "serviceId", "priceAtStart", "createdAt")
SELECT gen_random_uuid()::text, "id", "serviceId", "priceAtStart", "createdAt"
FROM "service_sessions";

-- D: backfill de totalPrice desde el priceAtStart original
UPDATE "service_sessions" SET "totalPrice" = "priceAtStart";

-- E: totalPrice pasa a NOT NULL ahora que todas las filas tienen valor
ALTER TABLE "service_sessions" ALTER COLUMN "totalPrice" SET NOT NULL;

-- F: dropear la FK vieja y las columnas escalares
ALTER TABLE "service_sessions" DROP CONSTRAINT "service_sessions_serviceId_fkey";
ALTER TABLE "service_sessions" DROP COLUMN "priceAtStart";
ALTER TABLE "service_sessions" DROP COLUMN "serviceId";
