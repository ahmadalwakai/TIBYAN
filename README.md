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

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ahmadalwakai/TIBYAN&env=DATABASE_URL,NEXTAUTH_SECRET&envDescription=Required%20environment%20variables&envLink=https://github.com/ahmadalwakai/TIBYAN%23environment-variables)

### Manual Deploy

1. Push your code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Add environment variables:
   - `DATABASE_URL` - PostgreSQL connection string
   - `DIRECT_DATABASE_URL` - Direct database URL (for migrations)
   - `NEXTAUTH_SECRET` - Auth secret key
   - `NEXTAUTH_URL` - Your domain URL

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string with pooling |
| `DIRECT_DATABASE_URL` | ✅ | Direct PostgreSQL URL (no pooling) |
| `NEXTAUTH_SECRET` | ✅ | Secret for NextAuth.js |
| `NEXTAUTH_URL` | ✅ | Your app URL |
| `NEXT_PUBLIC_APP_URL` | ❌ | Public app URL |

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
- **Auth:** NextAuth.js
- **i18n:** next-intl
- **Styling:** Emotion

## 📄 License

MIT © 2026 Tibyan
