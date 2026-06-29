-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "attachments" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "readBy" TEXT[] DEFAULT ARRAY[]::TEXT[];
