-- CreateEnum
CREATE TYPE "public"."MemberSupportStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "public"."member_support_tickets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "public"."MemberSupportStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "member_support_tickets_userId_idx" ON "public"."member_support_tickets"("userId");

-- AddForeignKey
ALTER TABLE "public"."member_support_tickets" ADD CONSTRAINT "member_support_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
