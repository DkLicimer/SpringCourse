-- Миграция синхронизации: приводит базу, созданную прежними миграциями,
-- в соответствие с текущим prisma/schema.prisma.
-- (Прежние миграции не содержали часть таблиц и колонок — они создавались через db push.)
-- Безопасна для пустой и для заполненной базы: существующие данные не удаляются.

-- ============ Новый enum ============
CREATE TYPE "ProtocolStatus" AS ENUM ('DRAFT', 'SIGNED', 'ARCHIVED');

-- ============ Новые колонки существующих таблиц (без внешних ключей) ============
-- User
ALTER TABLE "User"
    ADD COLUMN "department" TEXT,
    ADD COLUMN "isAssignable" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "mainDuties" TEXT DEFAULT '',
    ADD COLUMN "extraDuties" TEXT DEFAULT '',
    ADD COLUMN "orderDuties" TEXT DEFAULT '';

-- ExtensionRequest
ALTER TABLE "ExtensionRequest" ADD COLUMN "requestedDeadline" TIMESTAMP(3);

-- ContentPlan
ALTER TABLE "ContentPlan" ADD COLUMN "mediaMaterial" TEXT;

-- TaskAssignment
ALTER TABLE "TaskAssignment"
    ADD COLUMN "stepInstruction" TEXT,
    ADD COLUMN "reportText" TEXT;

-- SocialPassport (расширенная структура «Состав коллектива»)
ALTER TABLE "SocialPassport"
    ADD COLUMN "userId" TEXT,
    ADD COLUMN "fullName" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "position" TEXT,
    ADD COLUMN "mobilePhone" TEXT,
    ADD COLUMN "workPhone" TEXT,
    ADD COLUMN "birthDate" TIMESTAMP(3),
    ADD COLUMN "maritalStatus" TEXT,
    ADD COLUMN "livingAddress" TEXT,
    ADD COLUMN "hasOwnHousing" TEXT,
    ADD COLUMN "childrenInfo" TEXT,
    ADD COLUMN "hobbies" TEXT,
    ADD COLUMN "achievements" TEXT,
    ADD COLUMN "preferredGifts" TEXT,
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "SocialPassport" ALTER COLUMN "department" SET DEFAULT '';
ALTER TABLE "SocialPassport" ALTER COLUMN "accountUrl" DROP NOT NULL;
ALTER TABLE "SocialPassport" ALTER COLUMN "accountUrl" SET DEFAULT '';
ALTER TABLE "SocialPassport" ALTER COLUMN "followers" DROP NOT NULL;

-- ============ Новые таблицы ============
CREATE TABLE "DailyReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateStr" TEXT NOT NULL,
    "reportDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generalComment" TEXT,
    "tasksData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GlobalFocus" (
    "id" TEXT NOT NULL DEFAULT 'current_focus',
    "focusWeek" TEXT DEFAULT '',
    "staffAttention" TEXT DEFAULT '',
    "importantNow" TEXT DEFAULT '',
    "title" TEXT DEFAULT 'Важное сейчас',
    "content" TEXT DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "GlobalFocus_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MeetingProtocol" (
    "id" TEXT NOT NULL,
    "protocolNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "location" TEXT DEFAULT 'Онлайн-аудиокомната',
    "calendarEventId" TEXT,
    "chairmanId" TEXT NOT NULL,
    "secretaryId" TEXT,
    "agenda" TEXT,
    "discussionText" TEXT,
    "decisionsText" TEXT,
    "status" "ProtocolStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MeetingProtocol_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GeneralMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GeneralMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InfoSpace" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InfoSpace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "_EventParticipants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EventParticipants_AB_pkey" PRIMARY KEY ("A","B")
);

CREATE TABLE "_ProtocolAttendees" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProtocolAttendees_AB_pkey" PRIMARY KEY ("A","B")
);

-- ============ Колонки Task (после создания MeetingProtocol) ============
ALTER TABLE "Task"
    ADD COLUMN "taskNumber" SERIAL NOT NULL,
    ADD COLUMN "recurringDayOfWeek" INTEGER,
    ADD COLUMN "isPerspective" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "reminderDate" TIMESTAMP(3),
    ADD COLUMN "protocolId" TEXT,
    ADD COLUMN "parentTaskId" TEXT;

-- ============ Индексы ============
CREATE UNIQUE INDEX "DailyReport_userId_dateStr_key" ON "DailyReport"("userId", "dateStr");
CREATE UNIQUE INDEX "MeetingProtocol_protocolNumber_key" ON "MeetingProtocol"("protocolNumber");
CREATE UNIQUE INDEX "MeetingProtocol_calendarEventId_key" ON "MeetingProtocol"("calendarEventId");
CREATE INDEX "_EventParticipants_B_index" ON "_EventParticipants"("B");
CREATE INDEX "_ProtocolAttendees_B_index" ON "_ProtocolAttendees"("B");
CREATE UNIQUE INDEX "Task_taskNumber_key" ON "Task"("taskNumber");
CREATE UNIQUE INDEX "SocialPassport_userId_key" ON "SocialPassport"("userId");

-- ============ Внешние ключи ============
ALTER TABLE "DailyReport" ADD CONSTRAINT "DailyReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GlobalFocus" ADD CONSTRAINT "GlobalFocus_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MeetingProtocol" ADD CONSTRAINT "MeetingProtocol_calendarEventId_fkey" FOREIGN KEY ("calendarEventId") REFERENCES "CalendarEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MeetingProtocol" ADD CONSTRAINT "MeetingProtocol_chairmanId_fkey" FOREIGN KEY ("chairmanId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MeetingProtocol" ADD CONSTRAINT "MeetingProtocol_secretaryId_fkey" FOREIGN KEY ("secretaryId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GeneralMessage" ADD CONSTRAINT "GeneralMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_protocolId_fkey" FOREIGN KEY ("protocolId") REFERENCES "MeetingProtocol"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SocialPassport" ADD CONSTRAINT "SocialPassport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_EventParticipants" ADD CONSTRAINT "_EventParticipants_A_fkey" FOREIGN KEY ("A") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_EventParticipants" ADD CONSTRAINT "_EventParticipants_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ProtocolAttendees" ADD CONSTRAINT "_ProtocolAttendees_A_fkey" FOREIGN KEY ("A") REFERENCES "MeetingProtocol"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_ProtocolAttendees" ADD CONSTRAINT "_ProtocolAttendees_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
