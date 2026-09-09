-- Los valores existentes se escribieron como "timestamp without time zone"
-- por un proceso con TZ=America/Asuncion, asi que hay que decirle a Postgres
-- explicitamente que los interprete en esa zona al convertir a timestamptz.
-- Sin el "USING ... AT TIME ZONE", Postgres usaria el TimeZone de la sesion
-- que corre la migracion, lo que introduciria un desfase en los datos ya
-- guardados (el mismo bug que esta migracion busca corregir).

-- AlterTable
ALTER TABLE "audit_logs"
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3)
  USING "createdAt" AT TIME ZONE 'America/Asuncion';

-- AlterTable
ALTER TABLE "barbers"
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3)
  USING "createdAt" AT TIME ZONE 'America/Asuncion';

-- AlterTable
ALTER TABLE "service_catalog"
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3)
  USING "createdAt" AT TIME ZONE 'America/Asuncion',
  ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3)
  USING "updatedAt" AT TIME ZONE 'America/Asuncion';

-- AlterTable
ALTER TABLE "service_sessions"
  ALTER COLUMN "startedAt" SET DATA TYPE TIMESTAMPTZ(3)
  USING "startedAt" AT TIME ZONE 'America/Asuncion',
  ALTER COLUMN "endedAt" SET DATA TYPE TIMESTAMPTZ(3)
  USING "endedAt" AT TIME ZONE 'America/Asuncion',
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3)
  USING "createdAt" AT TIME ZONE 'America/Asuncion';

-- AlterTable
ALTER TABLE "tenants"
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3)
  USING "createdAt" AT TIME ZONE 'America/Asuncion';

-- AlterTable
ALTER TABLE "users"
  ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3)
  USING "createdAt" AT TIME ZONE 'America/Asuncion';
