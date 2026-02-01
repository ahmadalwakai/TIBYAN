-- Add membership status fields to public.users
CREATE TYPE "public"."MembershipStatus" AS ENUM ('ACTIVE', 'TRIAL', 'EXPIRED', 'CANCELED');

ALTER TABLE "public"."users"
ADD COLUMN "membershipStatus" "public"."MembershipStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "membershipPlan" TEXT,
ADD COLUMN "membershipExpiresAt" TIMESTAMP(3),
ADD COLUMN "membershipPerks" JSONB;
