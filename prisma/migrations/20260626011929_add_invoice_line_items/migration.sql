-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "lineItems" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "notes" TEXT;
