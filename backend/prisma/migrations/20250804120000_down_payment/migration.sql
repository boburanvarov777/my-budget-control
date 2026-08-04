-- AlterTable
ALTER TABLE "Credit" ADD COLUMN "downPayment" DECIMAL(18,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Installment" ADD COLUMN "downPayment" DECIMAL(18,2) NOT NULL DEFAULT 0;
