-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CalendarEventType" ADD VALUE 'MAIN_BUILDING';
ALTER TYPE "CalendarEventType" ADD VALUE 'FREE_SLOT';

-- AlterTable
ALTER TABLE "CalendarEvent" ALTER COLUMN "bookedById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "reportingEnd" TIMESTAMP(3),
ADD COLUMN     "reportingStart" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DeadlineRequest" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeadlineRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DeadlineRequest" ADD CONSTRAINT "DeadlineRequest_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeadlineRequest" ADD CONSTRAINT "DeadlineRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
