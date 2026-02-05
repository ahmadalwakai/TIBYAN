# تبيان | Tibyan LMS

<div align="center">

![Tibyan Logo](https://via.placeholder.com/150x150?text=تبيان)

**منصة تعليمية متكاملة للعلوم الشرعية والعربية**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ahmadalwakai/TIBYAN)

[العربية](#العربية) | [English](#english)

</div>

---

## العربية

### نظرة عامة

تبيان (TBY) هي منصة تعليمية عربية متقدمة مبنية باستخدام Next.js App Router و TypeScript و Chakra UI.

### المميزات

- 🌐 دعم 7 لغات (العربية، الإنجليزية، الألمانية، التركية، الفرنسية، الإسبانية، السويدية)
- 🎨 واجهة مستخدم حديثة مع دعم RTL
- 👨‍💼 لوحة تحكم إدارية متكاملة
- 📚 نظام إدارة الدورات
- 💳 نظام مدفوعات متكامل
- 👨‍🏫 نظام طلبات المعلمين
- 🔐 نظام مصادقة آمن

### التثبيت المحلي

```bash
# استنساخ المشروع
git clone https://github.com/ahmadalwakai/TIBYAN.git
cd TIBYAN

# تثبيت الحزم
npm install

# إعداد قاعدة البيانات
cp .env.example .env
# قم بتعديل .env بمعلومات قاعدة البيانات الخاصة بك

# تشغيل الترحيلات
npx prisma db push

# تشغيل السيرفر
npm run dev
```

افتح http://localhost:3000 لعرض التطبيق.

---

## English

### Overview

Tibyan (TBY) is an Arabic-first LMS built with Next.js App Router, TypeScript, and Chakra UI.

### Portal Definitions

- **Student Portal (/student)**: Enrolled learner experience (courses, progress, certificates, enrollment payments, reviews). Access requires role=STUDENT and verified email.
- **Member Portal (/member)**: Community/club membership experience (member-only resources, perks, community features, member settings). Access requires role=MEMBER. Email verification for members is optional by policy to reduce onboarding friction.

### Features

- 🌐 7 language support (Arabic, English, German, Turkish, French, Spanish, Swedish)
- 🎨 Modern UI with RTL support
- 👨‍💼 Full admin dashboard
- 📚 Course management system
- 💳 Integrated payment system
- 👨‍🏫 Teacher application workflow
- 🔐 Secure authentication

### Local Installation

```bash
# Clone the repository
git clone https://github.com/ahmadalwakai/TIBYAN.git
cd TIBYAN

# Install dependencies
npm install

# Setup database
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
npx prisma db push

# Start development server
npm run dev
```

Open http://localhost:3000 to view the app.

---

## 🚀 Deploy to Vercel

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ahmadalwakai/TIBYAN&env=DATABASE_URL,JWT_SECRET&envDescription=Required%20environment%20variables&envLink=https://github.com/ahmadalwakai/TIBYAN%23environment-variables)

### Manual Deploy

1. Push your code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Add environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `DIRECT_DATABASE_URL` - Direct database URL (for migrations)
   - `JWT_SECRET` - Custom JWT auth secret (min 32 chars)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string with pooling |
| `DIRECT_DATABASE_URL` | ✅ | Direct PostgreSQL URL (no pooling) |
| `JWT_SECRET` | ✅ | Secret for custom JWT auth (min 32 chars) |
| `NEXT_PUBLIC_APP_URL` | ❌ | Public app URL |
| `RESEND_API_KEY` | ❌ | Email service for auth emails |

### AI Agent Providers

Tibyan ships with a tiered LLM provider stack for the in-app AI agent:

- `LLM_PROVIDER` supports `local`, `zyphon`, `mock`, or `auto` (default). Auto mode tries the local llama.cpp server first, then Zyphon Cloud, and finally falls back to the mock provider.
- Local mode uses the bundled llama.cpp tooling (`LLAMA_SERVER_URL`, `LLM_TIMEOUT_MS`, etc.).
- Zyphon Cloud mode requires `ZYPHON_API_KEY`, with optional tuning via `ZYPHON_API_BASE_URL`, `ZYPHON_MODEL_ID`, `ZYPHON_ORG_ID`, and `ZYPHON_TIMEOUT_MS`.
- Mock mode stays entirely offline with deterministic Arabic-first replies.

> **Tip:** Committers should keep local development on `LLM_PROVIDER=auto` so the AI agent automatically degrades to mock responses when neither the local server nor Zyphon are available.

### Recommended Database Providers

- [Vercel Postgres](https://vercel.com/storage/postgres) - Seamless integration
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Supabase](https://supabase.com) - Open source alternative
- [PlanetScale](https://planetscale.com) - MySQL compatible

---

## 📁 Project Structure

```
tibyan/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── admin/        # Admin dashboard
│   │   ├── api/          # API routes
│   │   ├── auth/         # Authentication pages
│   │   └── ...
│   ├── components/       # React components
│   ├── lib/              # Utilities & helpers
│   ├── i18n/             # Internationalization
│   └── theme/            # Chakra UI theme
├── prisma/               # Database schema
├── messages/             # Translation files
└── docs/                 # Documentation
```

## 📚 Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Admin System](docs/ADMIN_SYSTEM.md)
- [Content Migration](docs/CONTENT_MIGRATION.md)

## 🛠 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **UI:** Chakra UI v3
- **Database:** PostgreSQL + Prisma
- **Auth:** Custom JWT cookies (jose library)
- **i18n:** next-intl
- **Styling:** Emotion

## 🔐 Authentication

> **Important:** This app uses **custom JWT cookie-based authentication**. NextAuth is NOT used.

- JWT tokens signed with `jose` library, stored in `auth-token` httpOnly cookie
- User metadata in `user-data` cookie (client-readable)
- CSRF protection via `csrf-token` cookie
- See `src/lib/jwt.ts`, `src/lib/auth.ts`, `src/lib/api-auth.ts` for implementation

## 📄 License

MIT © 2026 Tibyan
