-- CreateEnum
CREATE TYPE "InstallmentCurrency" AS ENUM ('UZS', 'USD');

-- AlterTable
ALTER TABLE "Installment" ADD COLUMN "currency" "InstallmentCurrency" NOT NULL DEFAULT 'UZS';
