# Tibyan (TBY) Architecture

## Overview
Tibyan is a Next.js App Router + TypeScript LMS focused on Arabic-first RTL UX. The platform combines a robust learning player, compliance rules, assessments, community, and certifications.

## Roles
- Guest
- Student
- Instructor
- Reviewer/Moderator
- Admin

## Information Architecture
### Public
- /
- /courses
- /courses/[slug]
- /instructors/[slug]
- /programs
- /blog
- /pricing
- /help
- /auth/login
- /auth/register
- /auth/forgot-password

### Student
- /app
- /app/my-courses
- /app/course/[courseId]/learn
- /app/course/[courseId]/discussion
- /app/course/[courseId]/notes
- /app/course/[courseId]/resources
- /app/certificates
- /app/profile
- /app/settings

### Instructor
- /teach
- /teach/courses
- /teach/course/[courseId]/builder
- /teach/course/[courseId]/students
- /teach/course/[courseId]/grading
- /teach/course/[courseId]/announcements
- /teach/course/[courseId]/analytics

### Admin
- /admin
- /admin/users
- /admin/courses
- /admin/payments
- /admin/reviews
- /admin/reports
- /admin/settings

## Student Journey
1. Discover and filter courses in /courses.
2. Review course landing page with outcomes, modules, instructor, and reviews.
3. Enroll (free) or checkout (paid).
4. Learn in the player with modules, transcript, resources, quiz, Q&A, and notes.
5. Earn certificate on completion and passing grade.

## Course Player
- RTL sidebar with modules and lessons
- Main player with video (HLS)
- Tabs: Transcript, Resources, Quiz/Assignment, Q&A, Notes
- Progress ring and completion gating

## Assessments
- Question bank (MCQ, True/False, Short answer, Matching)
- Randomized questions, attempts, time limits, feedback

## Community
- Discussion board per course
- Lesson-level Q&A with upvotes and accepted answers

## Certificates
- Issued on completion + passing grade
- Verification page: /certificates/[code]
- PDF download

## Design System
### Colors
Primary: #0B1F3B
Primary Hover: #0A2A52
Accent: #C8A24A
Accent Hover: #B08C3A
Background: #F7F8FA
Surface: #FFFFFF
Text Primary: #0F172A
Text Muted: #475569
Border: #E2E8F0
Success: #16A34A
Warning: #F59E0B
Error: #DC2626

### Typography
- Arabic: IBM Plex Sans Arabic
- English: Inter
- Headings weight: 700
- Body weight: 400/500
- Line height: 1.7
- Base size: 16px

## Stack
Frontend: Next.js (App Router), TypeScript, Chakra UI, Framer Motion, React Hook Form, Zod, TanStack Query, next-intl, Zustand, TipTap.

Backend: Next.js Route Handlers, Prisma + PostgreSQL, Redis, NextAuth, S3 storage, Resend/Nodemailer, Sentry.
