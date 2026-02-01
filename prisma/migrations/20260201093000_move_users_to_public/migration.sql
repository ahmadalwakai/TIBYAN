-- NOTE: This migration documents a manual production change already applied.
-- Do NOT re-run in environments where the table is already in public schema.

-- 1) Drop FKs pointing to students.users
ALTER TABLE admins.audit_logs DROP CONSTRAINT IF EXISTS "audit_logs_actorUserId_fkey";
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS "blog_posts_authorId_fkey";
ALTER TABLE public.verification_tokens DROP CONSTRAINT IF EXISTS "verification_tokens_userId_fkey";
ALTER TABLE students.certificates DROP CONSTRAINT IF EXISTS "certificates_userId_fkey";
ALTER TABLE students.enrollments DROP CONSTRAINT IF EXISTS "enrollments_userId_fkey";
ALTER TABLE students.payments DROP CONSTRAINT IF EXISTS "payments_userId_fkey";
ALTER TABLE students.reviews DROP CONSTRAINT IF EXISTS "reviews_userId_fkey";
ALTER TABLE teachers.courses DROP CONSTRAINT IF EXISTS "courses_instructorId_fkey";

-- 2) Move users table to public schema
ALTER TABLE students.users SET SCHEMA public;

-- 3) Re-add FKs pointing to public.users
ALTER TABLE admins.audit_logs
  ADD CONSTRAINT "audit_logs_actorUserId_fkey"
  FOREIGN KEY ("actorUserId") REFERENCES public.users(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE public.blog_posts
  ADD CONSTRAINT "blog_posts_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES public.users(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.verification_tokens
  ADD CONSTRAINT "verification_tokens_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES public.users(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE students.certificates
  ADD CONSTRAINT "certificates_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES public.users(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE students.enrollments
  ADD CONSTRAINT "enrollments_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES public.users(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE students.payments
  ADD CONSTRAINT "payments_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES public.users(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE students.reviews
  ADD CONSTRAINT "reviews_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES public.users(id)
  ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE teachers.courses
  ADD CONSTRAINT "courses_instructorId_fkey"
  FOREIGN KEY ("instructorId") REFERENCES public.users(id)
  ON UPDATE CASCADE ON DELETE CASCADE;
