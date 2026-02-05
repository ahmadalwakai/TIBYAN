/*
  Warnings:

  - A unique constraint covering the columns `[googleId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "ai";

-- CreateEnum
CREATE TYPE "ai"."AgentMessageRole" AS ENUM ('SYSTEM', 'USER', 'ASSISTANT', 'TOOL');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "googleId" TEXT;

-- CreateTable
CREATE TABLE "ai"."agent_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userRole" "Role",
    "locale" TEXT NOT NULL DEFAULT 'ar',
    "context" JSONB,
    "preferences" JSONB,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai"."agent_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "ai"."AgentMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "toolName" TEXT,
    "toolInput" JSONB,
    "toolOutput" JSONB,
    "tokenCount" INTEGER,
    "durationMs" INTEGER,
    "cached" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai"."agent_prompt_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "locale" TEXT NOT NULL DEFAULT 'ar',
    "template" TEXT NOT NULL,
    "variables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "agent_prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai"."zyphon_api_keys" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "scopes" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "zyphon_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai"."zyphon_settings" (
    "id" TEXT NOT NULL,
    "defaultLanguageMode" TEXT NOT NULL DEFAULT 'auto',
    "strictNoThirdLanguage" BOOLEAN NOT NULL DEFAULT true,
    "defaultMaxTokens" INTEGER NOT NULL DEFAULT 2048,
    "externalEndpointEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "zyphon_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agent_sessions_userId_idx" ON "ai"."agent_sessions"("userId");

-- CreateIndex
CREATE INDEX "agent_sessions_expiresAt_idx" ON "ai"."agent_sessions"("expiresAt");

-- CreateIndex
CREATE INDEX "agent_messages_sessionId_idx" ON "ai"."agent_messages"("sessionId");

-- CreateIndex
CREATE INDEX "agent_prompt_templates_templateId_isActive_idx" ON "ai"."agent_prompt_templates"("templateId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "agent_prompt_templates_templateId_version_locale_key" ON "ai"."agent_prompt_templates"("templateId", "version", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "zyphon_api_keys_keyHash_key" ON "ai"."zyphon_api_keys"("keyHash");

-- CreateIndex
CREATE UNIQUE INDEX "zyphon_api_keys_prefix_key" ON "ai"."zyphon_api_keys"("prefix");

-- CreateIndex
CREATE INDEX "zyphon_api_keys_prefix_idx" ON "ai"."zyphon_api_keys"("prefix");

-- CreateIndex
CREATE INDEX "zyphon_api_keys_isActive_idx" ON "ai"."zyphon_api_keys"("isActive");

-- CreateIndex
CREATE INDEX "zyphon_api_keys_createdById_idx" ON "ai"."zyphon_api_keys"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- AddForeignKey
ALTER TABLE "ai"."agent_messages" ADD CONSTRAINT "agent_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ai"."agent_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
