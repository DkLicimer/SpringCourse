/*
  Warnings:

  - The values [MEETING,BLOCKED,MAIN_BUILDING,FREE_SLOT] on the enum `CalendarEventType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `reportingEnd` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `reportingStart` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `DeadlineRequest` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `bookedById` on table `CalendarEvent` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CalendarEventType_new" AS ENUM ('FREE', 'GC', 'BUSY');
ALTER TABLE "public"."CalendarEvent" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "CalendarEvent" ALTER COLUMN "type" TYPE "CalendarEventType_new" USING ("type"::text::"CalendarEventType_new");
ALTER TYPE "CalendarEventType" RENAME TO "CalendarEventType_old";
ALTER TYPE "CalendarEventType_new" RENAME TO "CalendarEventType";
DROP TYPE "public"."CalendarEventType_old";
ALTER TABLE "CalendarEvent" ALTER COLUMN "type" SET DEFAULT 'FREE';
COMMIT;

-- DropForeignKey
ALTER TABLE "DeadlineRequest" DROP CONSTRAINT "DeadlineRequest_taskId_fkey";

-- DropForeignKey
ALTER TABLE "DeadlineRequest" DROP CONSTRAINT "DeadlineRequest_userId_fkey";

-- AlterTable
ALTER TABLE "CalendarEvent" ALTER COLUMN "type" SET DEFAULT 'FREE',
ALTER COLUMN "bookedById" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "reportingEnd",
DROP COLUMN "reportingStart",
ADD COLUMN     "periodEndDate" TIMESTAMP(3),
ADD COLUMN     "periodStartDate" TIMESTAMP(3),
ADD COLUMN     "reportingPeriodType" TEXT NOT NULL DEFAULT 'MONTH';

-- DropTable
DROP TABLE "DeadlineRequest";

-- DropEnum
DROP TYPE "RequestStatus";

-- CreateTable
CREATE TABLE "ExtensionRequest" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtensionRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExtensionRequest" ADD CONSTRAINT "ExtensionRequest_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtensionRequest" ADD CONSTRAINT "ExtensionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
