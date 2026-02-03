# 🚀 Vercel Deployment Guide

## Required Environment Variables

Set these in **Vercel Dashboard → Project → Settings → Environment Variables**

### 1. Database (REQUIRED)

```bash
DATABASE_URL=postgresql://user:password@host:5432/tibyan?sslmode=require&pgbouncer=true
DIRECT_DATABASE_URL=postgresql://user:password@host:5432/tibyan?sslmode=require
```

**Recommended providers:**
- [Neon](https://neon.tech) - Serverless Postgres (Free tier available)
- [Supabase](https://supabase.com) - Postgres with extras
- Vercel Postgres (Built-in integration)

### 2. Authentication (REQUIRED)

```bash
NEXTAUTH_SECRET=your-32-character-random-secret
NEXTAUTH_URL=https://your-app.vercel.app
```

**Generate secret:**
```bash
openssl rand -base64 32
```

### 3. Application (REQUIRED)

```bash
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_NAME=تبيان
```

### 4. Email Service (REQUIRED)

```bash
RESEND_API_KEY=re_live_xxxxxxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
```

**Get API key:** [resend.com](https://resend.com)

### 5. AI Agent (REQUIRED)

```bash
LLM_PROVIDER=mock
```

**Options:**
- `mock` - Testing mode (no real AI, best for initial deployment)
- `zyphon` - When you have a hosted AI service configured

---

## Optional But Recommended

### Redis Caching (Performance)

```bash
REDIS_URL=redis://default:xxx@xxx.upstash.io:6379
```

**Provider:** [Upstash Redis](https://upstash.com) - Free tier available

### Error Monitoring

```bash
SENTRY_DSN=https://xxx@sentry.io/xxx
```

**Provider:** [Sentry](https://sentry.io) - Free tier available

### Analytics

```bash
NEXT_PUBLIC_GOOGLE_ANALYTICS=G-XXXXXXXXXX
```

---

## Deployment Steps

### 1. Connect to Vercel

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 2. Or via GitHub Integration

1. Push code to GitHub
2. Connect repository in [Vercel Dashboard](https://vercel.com/dashboard)
3. Vercel auto-deploys on every push to `master`

### 3. Set Environment Variables

In Vercel Dashboard:
1. Go to **Project Settings**
2. Navigate to **Environment Variables**
3. Add all required variables from `.env.production.example`
4. Set scope to **Production, Preview, Development**

### 4. Trigger Redeploy

After setting environment variables:
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment
3. Check build logs for any errors

---

## Post-Deployment Checklist

- [ ] Database connection works (`/api/health` returns 200)
- [ ] User registration works
- [ ] Email verification emails are sent
- [ ] Login/logout works
- [ ] Admin panel accessible
- [ ] Course enrollment works
- [ ] File uploads work (if configured)
- [ ] SSL certificate is active (https://)

---

## Troubleshooting

### Build Fails - Prisma Error

**Error:** `Cannot find module '@prisma/client'`

**Fix:** Environment variables are set correctly in `vercel.json`:
```json
{
  "build": {
    "env": {
      "PRISMA_CLIENT_ENGINE_TYPE": "binary",
      "PRISMA_CLI_BINARY_TARGETS": "rhel-openssl-3.0.x"
    }
  }
}
```

### Database Connection Error

**Error:** `Can't reach database server`

**Fix:**
- Ensure `DATABASE_URL` has `?sslmode=require`
- For serverless databases, add `&pgbouncer=true`
- Check IP whitelist in database provider (allow all IPs: `0.0.0.0/0`)

### Email Not Sending

**Error:** `Failed to send email`

**Fix:**
- Verify `RESEND_API_KEY` is correct
- Check API key permissions in Resend dashboard
- Ensure `FROM_EMAIL` domain is verified in Resend

### AI Agent Not Working

**Error:** `LLM unavailable`

**Fix:**
- Set `LLM_PROVIDER=mock` for production (local llama-server won't work on Vercel)
- For real AI, configure external service later

---

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Rotate secrets regularly** - Update `NEXTAUTH_SECRET` every 90 days
3. **Use different secrets** - Dev/staging/production should have unique values
4. **Enable Vercel Authentication** - Protect preview deployments
5. **Monitor error logs** - Check Vercel logs daily

---

## Performance Optimization

### Enable Redis Caching

Speeds up repeated queries:
```bash
REDIS_URL=redis://default:xxx@xxx.upstash.io:6379
```

### Use CDN for Media

Configure Cloudinary or Vercel Blob:
```bash
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

### Enable Prisma Accelerate (Optional)

For edge-ready database access:
```bash
DATABASE_URL=prisma://accelerate.prisma-data.net/?api_key=xxx
```

---

## Support

**Documentation:** `README.md`, `docs/` folder
**Issues:** GitHub Issues
**Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
