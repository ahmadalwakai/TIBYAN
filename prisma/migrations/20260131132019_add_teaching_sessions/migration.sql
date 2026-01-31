-- CreateTable
CREATE TABLE "teachers"."teaching_sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."MeetingType" NOT NULL DEFAULT 'VIDEO',
    "status" "public"."MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "teacherId" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "teacherAvatar" TEXT,
    "courseId" TEXT,
    "courseName" TEXT,
    "isRecorded" BOOLEAN NOT NULL DEFAULT false,
    "recordingUrl" TEXT,
    "maxStudents" INTEGER NOT NULL DEFAULT 30,
    "privacy" "public"."MeetingPrivacy" NOT NULL DEFAULT 'PRIVATE',
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "allowChat" BOOLEAN NOT NULL DEFAULT true,
    "allowScreenShare" BOOLEAN NOT NULL DEFAULT true,
    "allowHandRaise" BOOLEAN NOT NULL DEFAULT true,
    "allowStudentMic" BOOLEAN NOT NULL DEFAULT false,
    "allowStudentCamera" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnCreate" BOOLEAN NOT NULL DEFAULT true,
    "notifyBeforeStart" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teaching_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers"."session_participants" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userAvatar" TEXT,
    "userRole" "public"."Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "isMuted" BOOLEAN NOT NULL DEFAULT true,
    "isCameraOff" BOOLEAN NOT NULL DEFAULT true,
    "isHandRaised" BOOLEAN NOT NULL DEFAULT false,
    "canSpeak" BOOLEAN NOT NULL DEFAULT false,
    "canShare" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers"."session_invitations" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userRole" "public"."Role" NOT NULL,
    "status" "public"."InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "respondedAt" TIMESTAMP(3),
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSentAt" TIMESTAMP(3),
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers"."session_chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorAvatar" TEXT,
    "authorRole" "public"."Role" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teaching_sessions_teacherId_idx" ON "teachers"."teaching_sessions"("teacherId");

-- CreateIndex
CREATE INDEX "teaching_sessions_status_idx" ON "teachers"."teaching_sessions"("status");

-- CreateIndex
CREATE INDEX "teaching_sessions_scheduledAt_idx" ON "teachers"."teaching_sessions"("scheduledAt");

-- CreateIndex
CREATE INDEX "teaching_sessions_courseId_idx" ON "teachers"."teaching_sessions"("courseId");

-- CreateIndex
CREATE INDEX "session_participants_userId_idx" ON "teachers"."session_participants"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_participants_sessionId_userId_key" ON "teachers"."session_participants"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "session_invitations_userId_idx" ON "teachers"."session_invitations"("userId");

-- CreateIndex
CREATE INDEX "session_invitations_status_idx" ON "teachers"."session_invitations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "session_invitations_sessionId_userId_key" ON "teachers"."session_invitations"("sessionId", "userId");

-- CreateIndex
CREATE INDEX "session_chat_messages_sessionId_idx" ON "teachers"."session_chat_messages"("sessionId");

-- AddForeignKey
ALTER TABLE "teachers"."session_participants" ADD CONSTRAINT "session_participants_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "teachers"."teaching_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers"."session_invitations" ADD CONSTRAINT "session_invitations_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "teachers"."teaching_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers"."session_chat_messages" ADD CONSTRAINT "session_chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "teachers"."teaching_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
