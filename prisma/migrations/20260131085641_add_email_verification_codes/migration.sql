-- CreateEnum
CREATE TYPE "public"."VerificationCodePurpose" AS ENUM ('ADMIN_LOGIN', 'EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateTable
CREATE TABLE "public"."email_verification_codes" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" "public"."VerificationCodePurpose" NOT NULL DEFAULT 'ADMIN_LOGIN',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_codes_code_key" ON "public"."email_verification_codes"("code");

-- CreateIndex
CREATE INDEX "email_verification_codes_email_idx" ON "public"."email_verification_codes"("email");

-- CreateIndex
CREATE INDEX "email_verification_codes_code_idx" ON "public"."email_verification_codes"("code");
