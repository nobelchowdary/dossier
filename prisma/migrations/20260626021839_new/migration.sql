/*
  Warnings:

  - You are about to drop the column `searchVector` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `searchVector` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `searchVector` on the `Project` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Client_searchVector_idx";

-- DropIndex
DROP INDEX "Message_searchVector_idx";

-- DropIndex
DROP INDEX "Project_searchVector_idx";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "searchVector";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "searchVector";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "searchVector";
