/*
  Warnings:

  - The values [CANCELLED] on the enum `DeletionStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeletionStatus_new" AS ENUM ('PENDING', 'COMPLETED');
ALTER TABLE "User" ALTER COLUMN "deletionStatus" TYPE "DeletionStatus_new" USING ("deletionStatus"::text::"DeletionStatus_new");
ALTER TYPE "DeletionStatus" RENAME TO "DeletionStatus_old";
ALTER TYPE "DeletionStatus_new" RENAME TO "DeletionStatus";
DROP TYPE "public"."DeletionStatus_old";
COMMIT;

-- AlterTable
ALTER TABLE "OtpVerification" ADD COLUMN     "email" TEXT,
ALTER COLUMN "phone" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "googleId" TEXT,
ALTER COLUMN "name" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "OtpVerification_email_purpose_idx" ON "OtpVerification"("email", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
