-- Reemplaza el campo libre "observations" (sin uso real en el producto) por
-- una forma de pago obligatoria (efectivo/transferencia). Las filas
-- existentes quedan en CASH por defecto, ya que no se registraba este dato
-- antes.

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER');

-- AlterTable
ALTER TABLE "service_sessions" DROP COLUMN "observations",
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH';
