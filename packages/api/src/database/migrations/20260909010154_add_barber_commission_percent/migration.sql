/*
  Warnings:

  - You are about to drop the column `commissionPercent` on the `service_catalog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "barbers" ADD COLUMN     "commissionPercent" DECIMAL(5,2) NOT NULL DEFAULT 50.00;

-- AlterTable
ALTER TABLE "service_catalog" DROP COLUMN "commissionPercent";

-- AlterTable
ALTER TABLE "service_sessions" ADD COLUMN     "commissionPercentAtCompletion" DECIMAL(5,2);
