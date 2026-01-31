-- DropForeignKey
ALTER TABLE "admins"."audit_logs" DROP CONSTRAINT "audit_logs_actorUserId_fkey";

-- AlterTable
ALTER TABLE "admins"."audit_logs" ALTER COLUMN "actorUserId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "admins"."audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "students"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
