-- Comision especial por barbero+servicio, y precio promo de miercoles.
--
-- Orden pensado para no perder informacion historica:
--   A) crear barber_service_commissions (excepciones de comision)
--   B) agregar wednesdayPrice a service_catalog (nullable, sin backfill)
--   C) agregar commissionPercent a service_session_items, nullable por ahora
--   D) backfill: cada item hereda el % historico de su sesion
--      (commissionPercentAtCompletion), o el % actual del barbero si la
--      sesion nunca se completo (p.ej. sesiones canceladas)
--   E) commissionPercent pasa a NOT NULL

-- A: tabla de excepciones de comision barbero+servicio
CREATE TABLE "barber_service_commissions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "commissionPercent" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "barber_service_commissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "barber_service_commissions_barberId_serviceId_key" ON "barber_service_commissions"("barberId", "serviceId");
CREATE INDEX "barber_service_commissions_tenantId_idx" ON "barber_service_commissions"("tenantId");
CREATE INDEX "barber_service_commissions_serviceId_idx" ON "barber_service_commissions"("serviceId");

ALTER TABLE "barber_service_commissions" ADD CONSTRAINT "barber_service_commissions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "barber_service_commissions" ADD CONSTRAINT "barber_service_commissions_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "barbers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "barber_service_commissions" ADD CONSTRAINT "barber_service_commissions_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- B: precio promo de miercoles (nullable, NULL = sin promo)
ALTER TABLE "service_catalog" ADD COLUMN "wednesdayPrice" DECIMAL(10,2);

-- C: comisionPercent por item, nullable por ahora (filas existentes sin valor)
ALTER TABLE "service_session_items" ADD COLUMN "commissionPercent" DECIMAL(5,2);

-- D: backfill desde la comision historica de la sesion padre; si la sesion
--    nunca se completo (commissionPercentAtCompletion IS NULL), usar el %
--    actual del barbero para no dejar NULLs.
UPDATE "service_session_items" AS ssi
SET "commissionPercent" = COALESCE(ss."commissionPercentAtCompletion", b."commissionPercent")
FROM "service_sessions" ss
JOIN "barbers" b ON b."id" = ss."barberId"
WHERE ssi."sessionId" = ss."id";

-- E: commissionPercent pasa a NOT NULL ahora que todas las filas tienen valor
ALTER TABLE "service_session_items" ALTER COLUMN "commissionPercent" SET NOT NULL;
