-- CreateEnum
CREATE TYPE "public"."MeetingPrivacy" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "public"."InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateEnum
CREATE TYPE "public"."UserNotificationType" AS ENUM ('MEETING_INVITATION', 'MEETING_STARTING', 'MEETING_CANCELLED', 'NEW_MESSAGE', 'SYSTEM');

-- AlterTable
ALTER TABLE "teachers"."teacher_meetings" ADD COLUMN     "allowChat" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowHandRaise" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowScreenShare" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyBeforeStart" INTEGER,
ADD COLUMN     "notifyOnCreate" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "privacy" "public"."MeetingPrivacy" NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN     "requireApproval" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "teachers"."meeting_invitations" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
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

    CONSTRAINT "meeting_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."UserNotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "meeting_invitations_userId_idx" ON "teachers"."meeting_invitations"("userId");

-- CreateIndex
CREATE INDEX "meeting_invitations_status_idx" ON "teachers"."meeting_invitations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_invitations_meetingId_userId_key" ON "teachers"."meeting_invitations"("meetingId", "userId");

-- CreateIndex
CREATE INDEX "user_notifications_userId_idx" ON "public"."user_notifications"("userId");

-- CreateIndex
CREATE INDEX "user_notifications_isRead_idx" ON "public"."user_notifications"("isRead");

-- CreateIndex
CREATE INDEX "user_notifications_createdAt_idx" ON "public"."user_notifications"("createdAt");

-- CreateIndex
CREATE INDEX "teacher_meetings_privacy_idx" ON "teachers"."teacher_meetings"("privacy");

-- AddForeignKey
ALTER TABLE "teachers"."meeting_invitations" ADD CONSTRAINT "meeting_invitations_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "teachers"."teacher_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
