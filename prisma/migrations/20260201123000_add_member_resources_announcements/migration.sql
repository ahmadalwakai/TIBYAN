-- Member resources and announcements (public schema)

CREATE TYPE "public"."MemberResourceType" AS ENUM ('LINK', 'DOCUMENT', 'ARTICLE');

CREATE TABLE "public"."member_resources" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" "public"."MemberResourceType" NOT NULL DEFAULT 'LINK',
  "url" TEXT,
  "content" TEXT,
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "member_resources_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "member_resources_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX "member_resources_createdByUserId_idx" ON "public"."member_resources"("createdByUserId");

CREATE TABLE "public"."member_announcements" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "member_announcements_pkey" PRIMARY KEY ("id")
);

-- Normalize timestamp precision
ALTER TABLE "public"."member_announcements" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);
ALTER TABLE "public"."member_resources" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3);
