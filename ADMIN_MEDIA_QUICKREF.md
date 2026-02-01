# ADMIN MEDIA TOOLING - QUICK REFERENCE

## What Was Audited
- Admin Blog Post creation/editing (media uploads)
- Admin Social Post creation/editing (media uploads)
- Admin delete operations (security)
- Media file handling (upload, validation, metadata)
- Client-side and server-side validation
- TypeScript strict mode compliance
- Zod schema validation
- API response contracts

## Status Summary
✅ All critical issues fixed  
✅ All high-priority issues fixed  
✅ Build passes cleanly  
✅ All tests pass (12/12)  
✅ No TypeScript errors  
✅ RTL/Arabic-first UX maintained

---

## Run These Commands

### 1. Build (TypeScript & Next.js)
```bash
npm run build
```
**Expected:** Exit code 0, "Compiled successfully"

### 2. Run Tests
```bash
npm run test:admin-media
```
**Expected:** 12 passed, 0 failed

### 3. Development Server
```bash
npm run dev
```
**Expected:** Server starts on port 3000

### 4. Check Media Health (Dev Only)
```bash
curl http://localhost:3000/api/admin/media/diagnose
```
**Expected:** JSON with diagnostics checks and summary

---

## Critical Files Changed

1. **src/app/admin/blog-posts/page.tsx**
   - Added auth guard
   - Upload media before save
   - Chakra delete dialog

2. **src/app/admin/social/page.tsx**
   - Same fixes as blog-posts

3. **src/app/api/blog/posts/route.ts**
   - DELETE now accepts ID from body (not query)

4. **src/app/api/social/posts/route.ts**
   - DELETE now accepts ID from body (not query)

5. **src/components/ui/MediaUploader.tsx**
   - MIME type allowlist validation
   - File size validation
   - Image/video metadata extraction with timeouts

6. **src/lib/media-utils.ts** (NEW)
   - `uploadMediaFile()` - single file upload
   - `uploadMediaItems()` - batch upload

---

## Key Fixes at a Glance

### P0 (Critical)
| Issue | Fix | File |
|-------|-----|------|
| Media not uploaded before save | Call uploadMediaItems() before form submit | blog-posts/page.tsx, social/page.tsx |
| DELETE exposes ID in query | Send ID in request body instead | api/blog/posts, api/social/posts |
| Missing auth guards | Add useEffect auth check on mount | blog-posts/page.tsx, social/page.tsx |
| RTL broken delete dialog | Use Chakra UI Dialog instead of confirm() | blog-posts/page.tsx, social/page.tsx |

### P1 (High)
| Issue | Fix | File |
|-------|-----|------|
| Image dimensions hang | Add 5s timeout + error handler | MediaUploader.tsx |
| Video metadata undefined | Extract width/height/duration | MediaUploader.tsx |
| No file size validation | Check file.size > 50MB before upload | MediaUploader.tsx |
| No MIME validation | Allowlist MIME types, reject invalid | MediaUploader.tsx |

---

## Validation Checklist

- ✅ Authentication guards present on all admin pages
- ✅ All file uploads go through `/api/upload` before saving to DB
- ✅ File size limit enforced (50MB)
- ✅ MIME type validation with allowlist
- ✅ Image metadata extracted with timeout
- ✅ Video metadata extracted with timeout
- ✅ DELETE requests use body instead of query params
- ✅ Delete confirmations use Chakra UI (RTL-safe)
- ✅ API responses follow `{ ok, data?, error? }` contract
- ✅ Zod schemas validate all inputs
- ✅ No `any` types (strict TypeScript)
- ✅ Error messages in Arabic
- ✅ Test script passes (12/12)
- ✅ Build passes (exit 0)

---

## API Contract Examples

### Upload File
**Request:**
```bash
POST /api/upload
Content-Type: multipart/form-data

file: <binary>
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "url": "/uploads/image/file_12345_abc.jpg",
    "filename": "file_12345_abc.jpg",
    "type": "image",
    "size": 250000
  }
}
```

### Create Blog Post with Media
**Request:**
```bash
POST /api/blog/posts
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "My Post",
  "slug": "my-post",
  "content": "<p>Content</p>",
  "media": [
    {
      "type": "IMAGE",
      "url": "/uploads/image/file.jpg",
      "filename": "file.jpg",
      "mimeType": "image/jpeg",
      "width": 1920,
      "height": 1080,
      "caption": "Caption",
      "altText": "Alt text",
      "order": 0
    }
  ],
  "status": "DRAFT",
  "visibility": "PUBLIC"
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "clu7q...",
    "title": "My Post",
    "slug": "my-post",
    "media": [...],
    "createdAt": "2026-02-01T..."
  }
}
```

### Delete Post
**Request:**
```bash
DELETE /api/blog/posts
Content-Type: application/json

{
  "id": "clu7q..."
}
```

**Response:**
```json
{
  "ok": true,
  "data": {
    "id": "clu7q..."
  }
}
```

---

## Diagnostic Endpoint

### URL
```
GET /api/admin/media/diagnose
```

### Authorization
- Development: No auth needed
- Production: Admin role required

### Response
```json
{
  "ok": true,
  "data": {
    "timestamp": "2026-02-01T12:30:45.000Z",
    "environment": "development",
    "checks": [
      {
        "name": "Database Connection",
        "status": "pass",
        "details": "Prisma client connected to database"
      },
      {
        "name": "BlogPost Model",
        "status": "pass",
        "details": "Schema loaded, 5 posts in database"
      },
      {
        "name": "Upload Directory",
        "status": "pass",
        "details": "/path/to/public/uploads is accessible"
      },
      // ... more checks
    ],
    "summary": {
      "total": 10,
      "passed": 10,
      "failed": 0,
      "warnings": 0
    }
  }
}
```

---

## File Type Allowlists

### Allowed Images
- JPEG (`image/jpeg`)
- PNG (`image/png`)
- GIF (`image/gif`)
- WebP (`image/webp`)

### Allowed Videos
- MP4 (`video/mp4`)
- WebM (`video/webm`)
- OGG (`video/ogg`)

### Allowed Audio
- MP3 (`audio/mpeg`)
- WAV (`audio/wav`)
- OGG (`audio/ogg`)
- WebM (`audio/webm`)

### Allowed Documents
- PDF (`application/pdf`)

### Size Limit
- Maximum: 50MB per file

---

## Testing Locally

### Manual Test: Upload Image
1. Go to Admin → Blog Posts
2. Click "Create Post"
3. Add title, slug, content
4. Click "Add Media"
5. Select image file (< 50MB)
6. See image preview with dimensions
7. Click "Save" → Should upload image first, then save

### Manual Test: Delete Post
1. Go to Admin → Blog Posts
2. Select existing post
3. Click "Delete"
4. See Chakra Dialog (not native confirm)
5. Click "Confirm" → Media deleted, post deleted

### Manual Test: Diagnostics
1. Start dev server: `npm run dev`
2. In browser: `http://localhost:3000/api/admin/media/diagnose`
3. Should see checklist with all status: "pass" or "warn"

---

## Troubleshooting

### Build Fails with TypeScript Errors
```bash
npm run build
```
If it fails, check that Prisma client is regenerated:
```bash
npx prisma generate
```

### Test Script Fails
```bash
npm run test:admin-media
```
Make sure all imports in [scripts/test-admin-media.ts](scripts/test-admin-media.ts) resolve:
- [src/components/ui/MediaUploader.tsx](src/components/ui/MediaUploader.tsx)
- [src/app/api/blog/posts/route.ts](src/app/api/blog/posts/route.ts)
- [src/app/api/social/posts/route.ts](src/app/api/social/posts/route.ts)
- [src/app/api/upload/route.ts](src/app/api/upload/route.ts)

### Upload Fails with "File type not supported"
Check that file's actual MIME type is in allowlist (not just the extension). Browser reports MIME type as `file.type` after upload attempt. Verify in console:
```javascript
const file = event.target.files[0];
console.log(file.type); // Should be "image/jpeg" not "image/jpg"
```

### Media URLs show as "blob:..."
This was the main bug - ensure `uploadMediaItems()` is called BEFORE form submit:
```typescript
const hasUnuploadedMedia = media.some(m => m.file && !m.url);
if (hasUnuploadedMedia) {
  uploadedMedia = await uploadMediaItems(media);  // FIX
}
```

---

## Performance Notes

1. **Image Dimension Extraction:** 5-second timeout per image
2. **Video Metadata Extraction:** 5-second timeout per video
3. **Batch Upload:** Sequential (one file at a time) via `uploadMediaItems()`
4. **Database Queries:** Indexed on `authorId`, `status`, `slug`, `createdAt`
5. **File Size:** 50MB limit enforced on client AND server

---

## Security Checklist

- ✅ MIME type validated (allowlist, not just extension)
- ✅ File size validated (50MB max)
- ✅ DELETE ID sent in body (not exposed in URL)
- ✅ Auth checks on all admin endpoints
- ✅ Role validation (ADMIN required)
- ✅ No direct file access (must go through `/api/upload`)
- ✅ All inputs validated with Zod
- ✅ SQL injection impossible (Prisma, no raw SQL)

---

## Documents

- [ADMIN_MEDIA_AUDIT_FINAL_REPORT.md](ADMIN_MEDIA_AUDIT_FINAL_REPORT.md) - Comprehensive audit report
- [ADMIN_MEDIA_ERRORS_EXACT_LOCATIONS.md](ADMIN_MEDIA_ERRORS_EXACT_LOCATIONS.md) - Exact error locations with code
- [ADMIN_MEDIA_CHANGED_FILES.md](ADMIN_MEDIA_CHANGED_FILES.md) - Detailed diffs of all changes

---

**Generated:** February 1, 2026  
**Project:** Tibyan LMS  
**Status:** ✅ COMPLETE & PRODUCTION READY
