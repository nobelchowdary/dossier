-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "searchVector" tsvector;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "searchVector" tsvector;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "searchVector" tsvector;
