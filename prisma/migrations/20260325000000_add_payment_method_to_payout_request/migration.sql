-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('venmo', 'paypal', 'cashapp', 'check');

-- AlterTable
ALTER TABLE "PayoutRequest" ADD COLUMN "paymentHandle" TEXT,
ADD COLUMN "paymentMethod" "PaymentMethod";
