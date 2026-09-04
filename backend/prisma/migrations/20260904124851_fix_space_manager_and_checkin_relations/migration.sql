/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `SpaceManager` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "SpaceManager" DROP CONSTRAINT "SpaceManager_spaceId_fkey";

-- DropForeignKey
ALTER TABLE "SpaceManager" DROP CONSTRAINT "SpaceManager_userId_fkey";

-- DropIndex
DROP INDEX "SpaceManager_userId_spaceId_key";

-- AlterTable
ALTER TABLE "CheckIn" ADD COLUMN     "scannedById" TEXT;

-- AlterTable
ALTER TABLE "SpaceManager" ALTER COLUMN "spaceId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SpaceManager_userId_key" ON "SpaceManager"("userId");

-- AddForeignKey
ALTER TABLE "SpaceManager" ADD CONSTRAINT "SpaceManager_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpaceManager" ADD CONSTRAINT "SpaceManager_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES "Space"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
