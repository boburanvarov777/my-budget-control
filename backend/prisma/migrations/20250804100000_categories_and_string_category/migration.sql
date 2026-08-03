-- CategoryType enum + custom categories table
CREATE TYPE "CategoryType" AS ENUM ('INCOME', 'EXPENSE');

CREATE TABLE "TransactionCategory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CategoryType" NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionCategory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TransactionCategory_userId_type_code_key" ON "TransactionCategory"("userId", "type", "code");
CREATE INDEX "TransactionCategory_userId_type_idx" ON "TransactionCategory"("userId", "type");

ALTER TABLE "TransactionCategory" ADD CONSTRAINT "TransactionCategory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Allow custom category codes on transactions
ALTER TABLE "Income" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "Income" ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT;
ALTER TABLE "Income" ALTER COLUMN "category" SET DEFAULT 'SALARY';

ALTER TABLE "Expense" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "Expense" ALTER COLUMN "category" TYPE TEXT USING "category"::TEXT;
ALTER TABLE "Expense" ALTER COLUMN "category" SET DEFAULT 'OTHER';

DROP TYPE "IncomeCategory";
DROP TYPE "ExpenseCategory";
