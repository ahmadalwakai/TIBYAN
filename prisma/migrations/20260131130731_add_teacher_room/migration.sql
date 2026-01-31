-- CreateEnum
CREATE TYPE "public"."NotificationChannel" AS ENUM ('EMAIL', 'IN_APP', 'SMS', 'PUSH');

-- CreateEnum
CREATE TYPE "public"."NotificationStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."NotificationTarget" AS ENUM ('ALL_USERS', 'STUDENTS', 'TEACHERS', 'SPECIFIC_USERS');

-- CreateEnum
CREATE TYPE "public"."AuthorType" AS ENUM ('ADMIN', 'INSTRUCTOR');

-- CreateEnum
CREATE TYPE "public"."PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."PostVisibility" AS ENUM ('PUBLIC', 'TEACHERS_ONLY', 'PRIVATE');

-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'PDF');

-- CreateEnum
CREATE TYPE "public"."CommentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SPAM');

-- CreateEnum
CREATE TYPE "public"."MessageType" AS ENUM ('TEXT', 'VOICE', 'FILE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "public"."MeetingType" AS ENUM ('VIDEO', 'VOICE');

-- CreateEnum
CREATE TYPE "public"."MeetingStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "admins"."system_settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins"."notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "channel" "public"."NotificationChannel" NOT NULL DEFAULT 'EMAIL',
    "status" "public"."NotificationStatus" NOT NULL DEFAULT 'DRAFT',
    "targetType" "public"."NotificationTarget" NOT NULL DEFAULT 'ALL_USERS',
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."posts" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "styling" JSONB,
    "authorId" TEXT NOT NULL,
    "authorType" "public"."AuthorType" NOT NULL DEFAULT 'ADMIN',
    "status" "public"."PostStatus" NOT NULL DEFAULT 'DRAFT',
    "visibility" "public"."PostVisibility" NOT NULL DEFAULT 'PUBLIC',
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "allowComments" BOOLEAN NOT NULL DEFAULT true,
    "allowLikes" BOOLEAN NOT NULL DEFAULT true,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "commentsCount" INTEGER NOT NULL DEFAULT 0,
    "viewsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."post_media" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "type" "public"."MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "caption" TEXT,
    "altText" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "styling" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."post_comments" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorAvatar" TEXT,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "status" "public"."CommentStatus" NOT NULL DEFAULT 'APPROVED',
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."post_likes" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."comment_likes" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins"."admin_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "description" TEXT,
    "permissions" JSONB NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students"."certificates" (
    "id" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "studentNameEn" TEXT,
    "courseName" TEXT NOT NULL,
    "courseNameEn" TEXT,
    "completionDate" TIMESTAMP(3) NOT NULL,
    "grade" TEXT,
    "score" DOUBLE PRECISION,
    "instructorName" TEXT,
    "courseDuration" TEXT,
    "templateType" TEXT NOT NULL DEFAULT 'classic',
    "userId" TEXT,
    "courseId" TEXT,
    "issuedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers"."teacher_room_messages" (
    "id" TEXT NOT NULL,
    "content" TEXT,
    "type" "public"."MessageType" NOT NULL DEFAULT 'TEXT',
    "voiceUrl" TEXT,
    "voiceDuration" INTEGER,
    "attachmentUrl" TEXT,
    "attachmentName" TEXT,
    "attachmentType" TEXT,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorAvatar" TEXT,
    "authorRole" "public"."Role" NOT NULL,
    "replyToId" TEXT,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_room_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers"."message_reactions" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers"."teacher_meetings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."MeetingType" NOT NULL DEFAULT 'VIDEO',
    "status" "public"."MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "hostId" TEXT NOT NULL,
    "hostName" TEXT NOT NULL,
    "hostAvatar" TEXT,
    "isRecorded" BOOLEAN NOT NULL DEFAULT false,
    "recordingUrl" TEXT,
    "maxParticipants" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teacher_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers"."meeting_participants" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userAvatar" TEXT,
    "userRole" "public"."Role" NOT NULL,
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "isCameraOff" BOOLEAN NOT NULL DEFAULT false,
    "isHandRaised" BOOLEAN NOT NULL DEFAULT false,
    "canSpeak" BOOLEAN NOT NULL DEFAULT true,
    "canShare" BOOLEAN NOT NULL DEFAULT false,
    "isCoHost" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "meeting_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers"."meeting_chat_messages" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorAvatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "admins"."system_settings"("key");

-- CreateIndex
CREATE INDEX "system_settings_category_idx" ON "admins"."system_settings"("category");

-- CreateIndex
CREATE INDEX "notifications_status_idx" ON "admins"."notifications"("status");

-- CreateIndex
CREATE INDEX "notifications_channel_idx" ON "admins"."notifications"("channel");

-- CreateIndex
CREATE INDEX "posts_authorId_idx" ON "public"."posts"("authorId");

-- CreateIndex
CREATE INDEX "posts_status_idx" ON "public"."posts"("status");

-- CreateIndex
CREATE INDEX "posts_createdAt_idx" ON "public"."posts"("createdAt");

-- CreateIndex
CREATE INDEX "posts_isPinned_publishedAt_idx" ON "public"."posts"("isPinned", "publishedAt");

-- CreateIndex
CREATE INDEX "post_media_postId_idx" ON "public"."post_media"("postId");

-- CreateIndex
CREATE INDEX "post_comments_postId_idx" ON "public"."post_comments"("postId");

-- CreateIndex
CREATE INDEX "post_comments_authorId_idx" ON "public"."post_comments"("authorId");

-- CreateIndex
CREATE INDEX "post_comments_parentId_idx" ON "public"."post_comments"("parentId");

-- CreateIndex
CREATE INDEX "post_likes_postId_idx" ON "public"."post_likes"("postId");

-- CreateIndex
CREATE INDEX "post_likes_userId_idx" ON "public"."post_likes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "post_likes_postId_userId_key" ON "public"."post_likes"("postId", "userId");

-- CreateIndex
CREATE INDEX "comment_likes_commentId_idx" ON "public"."comment_likes"("commentId");

-- CreateIndex
CREATE INDEX "comment_likes_userId_idx" ON "public"."comment_likes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "comment_likes_commentId_userId_key" ON "public"."comment_likes"("commentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_roles_name_key" ON "admins"."admin_roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_certificateNumber_key" ON "students"."certificates"("certificateNumber");

-- CreateIndex
CREATE INDEX "certificates_studentName_idx" ON "students"."certificates"("studentName");

-- CreateIndex
CREATE INDEX "certificates_courseName_idx" ON "students"."certificates"("courseName");

-- CreateIndex
CREATE INDEX "certificates_certificateNumber_idx" ON "students"."certificates"("certificateNumber");

-- CreateIndex
CREATE INDEX "teacher_room_messages_authorId_idx" ON "teachers"."teacher_room_messages"("authorId");

-- CreateIndex
CREATE INDEX "teacher_room_messages_createdAt_idx" ON "teachers"."teacher_room_messages"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "message_reactions_messageId_userId_emoji_key" ON "teachers"."message_reactions"("messageId", "userId", "emoji");

-- CreateIndex
CREATE INDEX "teacher_meetings_hostId_idx" ON "teachers"."teacher_meetings"("hostId");

-- CreateIndex
CREATE INDEX "teacher_meetings_status_idx" ON "teachers"."teacher_meetings"("status");

-- CreateIndex
CREATE INDEX "teacher_meetings_scheduledAt_idx" ON "teachers"."teacher_meetings"("scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_participants_meetingId_userId_key" ON "teachers"."meeting_participants"("meetingId", "userId");

-- CreateIndex
CREATE INDEX "meeting_chat_messages_meetingId_idx" ON "teachers"."meeting_chat_messages"("meetingId");

-- AddForeignKey
ALTER TABLE "public"."post_media" ADD CONSTRAINT "post_media_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."post_comments" ADD CONSTRAINT "post_comments_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."post_comments" ADD CONSTRAINT "post_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."post_likes" ADD CONSTRAINT "post_likes_postId_fkey" FOREIGN KEY ("postId") REFERENCES "public"."posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."comment_likes" ADD CONSTRAINT "comment_likes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "public"."post_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students"."certificates" ADD CONSTRAINT "certificates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "students"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students"."certificates" ADD CONSTRAINT "certificates_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "teachers"."courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers"."teacher_room_messages" ADD CONSTRAINT "teacher_room_messages_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "teachers"."teacher_room_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers"."message_reactions" ADD CONSTRAINT "message_reactions_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "teachers"."teacher_room_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers"."meeting_participants" ADD CONSTRAINT "meeting_participants_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "teachers"."teacher_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teachers"."meeting_chat_messages" ADD CONSTRAINT "meeting_chat_messages_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "teachers"."teacher_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
