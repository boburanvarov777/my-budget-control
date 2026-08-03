-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('FOOD', 'TRANSPORT', 'UTILITIES', 'CHILD', 'CAFE', 'PHONE', 'GAMING', 'GIFT', 'SHOPPING', 'PHARMACY', 'OTHER');

-- CreateEnum
CREATE TYPE "IncomeCategory" AS ENUM ('SALARY', 'BONUS', 'FREELANCE', 'SALE', 'OTHER');

-- CreateEnum
CREATE TYPE "CreditStatus" AS ENUM ('ACTIVE', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "MicroLoanProvider" AS ENUM ('UZUM', 'ALIF', 'YANGI', 'PAYME', 'OTHER');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('CAR', 'HOUSE', 'TRAVEL', 'LAPTOP', 'PHONE', 'EMERGENCY', 'CUSTOM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "phone" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "monthlyIncome" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Income" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "category" "IncomeCategory" NOT NULL DEFAULT 'SALARY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "category" "ExpenseCategory" NOT NULL DEFAULT 'OTHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "interestRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "months" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "monthlyPayment" DECIMAL(18,2) NOT NULL,
    "remainingDebt" DECIMAL(18,2) NOT NULL,
    "nextPaymentDate" TIMESTAMP(3),
    "status" "CreditStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MicroLoan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "MicroLoanProvider" NOT NULL DEFAULT 'OTHER',
    "amount" DECIMAL(18,2) NOT NULL,
    "takenDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MicroLoan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Installment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "monthlyPayment" DECIMAL(18,2) NOT NULL,
    "totalMonths" INTEGER NOT NULL,
    "paidMonths" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "nextPaymentDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Installment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "GoalType" NOT NULL DEFAULT 'CUSTOM',
    "targetAmount" DECIMAL(18,2) NOT NULL,
    "savedAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "monthlyAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "targetDate" TIMESTAMP(3),
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Saving" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Jamg''arma',
    "amount" DECIMAL(18,2) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Saving_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "monthlyIncome" DECIMAL(18,2) NOT NULL,
    "mandatoryExpenses" JSONB NOT NULL,
    "recommendedSavings" JSONB,
    "freeMoney" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE INDEX "Income_userId_date_idx" ON "Income"("userId", "date");

-- CreateIndex
CREATE INDEX "Expense_userId_date_idx" ON "Expense"("userId", "date");

-- CreateIndex
CREATE INDEX "Expense_userId_category_idx" ON "Expense"("userId", "category");

-- CreateIndex
CREATE INDEX "Credit_userId_idx" ON "Credit"("userId");

-- CreateIndex
CREATE INDEX "MicroLoan_userId_dueDate_idx" ON "MicroLoan"("userId", "dueDate");

-- CreateIndex
CREATE INDEX "Installment_userId_idx" ON "Installment"("userId");

-- CreateIndex
CREATE INDEX "Goal_userId_idx" ON "Goal"("userId");

-- CreateIndex
CREATE INDEX "Saving_userId_idx" ON "Saving"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetPlan_userId_month_year_key" ON "BudgetPlan"("userId", "month", "year");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MicroLoan" ADD CONSTRAINT "MicroLoan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Installment" ADD CONSTRAINT "Installment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Saving" ADD CONSTRAINT "Saving_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetPlan" ADD CONSTRAINT "BudgetPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
