# FINAL AUDIT REPORT - Admin Media Tooling
**Date:** February 1, 2026  
**Status:** ACTIVE ISSUES FOUND + FIX PLAN

---

## CRITICAL ERRORS & ISSUES

### P0: CRASHES / AUTH / PERMISSION (Must Fix)

#### 1. Media Fallback Using Placeholder/Blob URLs [CRITICAL]
- **File:** [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx#L246)
- **Issue:** Line 246: `url: m.url || m.preview || 'https://placeholder.com/${m.id}'`
  - When new media is added via MediaUploader, `m.url` is empty (not yet uploaded)
  - Falls back to `m.preview` (blob: URL, client-side only, breaks on server)
  - Falls back to placeholder URL (dead link)
  - **Result:** Media items saved to DB with invalid URLs
- **Impact:** Users can't see uploaded images/videos after save
- **Fix:** Upload media files BEFORE form submission (add upload loop)

#### 2. Delete API Uses Query Params (RESTful Violation) [HIGH]
- **File:** [src/app/api/blog/posts/route.ts](src/app/api/blog/posts/route.ts#L318) and [src/app/api/social/posts/route.ts](src/app/api/social/posts/route.ts#L386)
- **Issue:** Both DELETE handlers use `searchParams.get("id")` instead of request body
  - DELETE should not use query params for sensitive data
  - Security: ID exposed in browser history/logs
  - Not RESTful
- **Admin calls:** [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx#L287) line 287
- **Fix:** Change to body-based DELETE, update admin calls

#### 3. Missing altText in Admin Form Submission [MEDIUM]
- **Files:** 
  - [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx#L246)
  - [src/app/admin/social/page.tsx](src/app/admin/social/page.tsx#L233)
- **Issue:** MediaUploader has `altText` field, but admin pages don't:
  - Don't provide input UI for altText
  - Don't include altText when submitting media
  - Schema accepts it but UI never sends it
- **Impact:** Missing accessibility, no alt text for images
- **Fix:** Add altText input field in media editing UI + include in submission

#### 4. Missing Media Styling UI Controls [MEDIUM]
- **Files:** [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx#L596), [src/app/admin/social/page.tsx](src/app/admin/social/page.tsx#L596)
- **Issue:** Schema accepts `styling: { borderRadius, objectFit, aspectRatio }` but:
  - No UI controls in admin to set these
  - Can't customize media presentation from UI
  - Fixed defaults in MediaUploader preview
- **Impact:** Users can't style media output
- **Fix:** Add styling control panel (dropdowns/sliders) in media modal

---

### P1: BROKEN UPLOADS/SAVES (Must Fix)

#### 5. Media URLs Not Uploaded Before Save
- **Root Cause:** Issue #1 above
- **Impact:** ALL newly added media fails to display
- **Example:** User uploads image.jpg → blob URL → saved as placeholder → broken

#### 6. Missing Zod Validation for altText in Create/Update Schemas
- **Files:**
  - [src/app/api/blog/posts/route.ts](src/app/api/blog/posts/route.ts#L37)
  - [src/app/api/social/posts/route.ts](src/app/api/social/posts/route.ts#L37)
- **Issue:** Both schemas have `altText: z.string().optional()` in media object but:
  - Not validated (optional is correct)
  - Admin never sends it, so effectively unused
- **Impact:** Data integrity for accessibility
- **Fix:** Ensure altText flows end-to-end (UI → API → DB)

#### 7. Missing mimeType and fileSize Validation in API
- **File:** [src/app/api/blog/posts/route.ts](src/app/api/blog/posts/route.ts#L27-L42)
- **Issue:** Schema accepts but doesn't validate:
  - `mimeType`: no enum check
  - `fileSize`: no range validation
  - Should match upload API constraints (50MB max, specific MIME types)
- **Fix:** Add strict Zod validation: `mimeType: z.enum([...])`, `fileSize: z.number().max(50*1024*1024)`

#### 8. No Loading State During Media Upload Submission [MEDIUM]
- **Files:** [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx#L237), social page
- **Issue:** When submitting form with new media:
  - User has no feedback that files are being uploaded
  - No progress indicator
  - Submitting flag doesn't track upload progress
- **Impact:** Poor UX, user thinks request failed
- **Fix:** Add upload progress toast/spinner before API call

---

### P2: UX & POLISH (Nice-to-have)

#### 9. No Confirmation Dialog for Delete (Fixed in Previous Audit)
- **Status:** ✅ Already uses Chakra UI Dialog (not native confirm)

#### 10. Missing Empty State in MediaUploader
- **File:** [src/components/ui/MediaUploader.tsx](src/components/ui/MediaUploader.tsx#L320)
- **Issue:** No message when media list is empty
- **Fix:** Add "No media added" message

#### 11. Missing RTL Grid Layout for Media Gallery
- **Files:** Both admin pages
- **Issue:** Media items grid doesn't RTL-flip correctly
- **Fix:** Add `direction="rtl"` and `gridAutoFlow="column"` styling

#### 12. No Error Boundary for Media Components
- **Files:** PostEditor, MediaUploader
- **Issue:** Crashes in these components could break entire admin page
- **Fix:** Wrap in Error Boundary (optional, lower priority)

---

## MISSING FEATURES / NOT IMPLEMENTED

### Not Required for P0/P1 (Documented for Context):

#### Video Transcoding/Processing
- No transcoding hooks
- No thumbnail generation on upload
- No codec validation

#### Photo Optimization
- No compression
- No variant generation (thumbnail, medium, large)
- No crop/resize endpoint

#### Version Control
- Only DRAFT/PUBLISHED states (no full version history)
- No undo/redo in admin (Zustand store has it, but not exposed)

#### Advanced Permissions
- No granular media permissions
- Admin can edit all or none
- No ownership/creator checks

---

## DEV-ONLY DIAGNOSTICS

### Status: ✅ PARTIALLY IMPLEMENTED

#### `/api/admin/media/diagnose` - DONE
- **File:** [src/app/api/admin/media/diagnose/route.ts](src/app/api/admin/media/diagnose/route.ts)
- **Features:**
  - Dev-only auth (open in dev, requires admin in prod)
  - Database connectivity check
  - Model availability checks (BlogPost, BlogPostMedia, Post, PostMedia)
  - Upload path validation
  - Returns color-coded results

#### Client-Side Self-Check Panel - NOT DONE
- **Missing:** AdminMediaDiagnosticPanel component
- **Should:** Call `/api/admin/media/diagnose`, display checklist
- **Location:** Should be in admin layout or standalone
- **Priority:** Optional (dev-only, not blocking)

---

## INVENTORY: File Map

### Admin Routes
- [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx) - Blog CRUD + media (NEEDS FIX #1)
- [src/app/admin/social/page.tsx](src/app/admin/social/page.tsx) - Social CRUD + media (NEEDS FIX #1)
- [src/app/admin/storage/page.tsx](src/app/admin/storage/page.tsx) - Storage stats

### API Routes
- [src/app/api/blog/posts/route.ts](src/app/api/blog/posts/route.ts) - Blog CRUD (DELETE query params)
- [src/app/api/social/posts/route.ts](src/app/api/social/posts/route.ts) - Social CRUD (DELETE query params)
- [src/app/api/upload/route.ts](src/app/api/upload/route.ts) - File upload (validation correct)
- [src/app/api/admin/storage/route.ts](src/app/api/admin/storage/route.ts) - Storage management
- [src/app/api/admin/media/diagnose/route.ts](src/app/api/admin/media/diagnose/route.ts) - Diagnostics (dev-only)

### Components
- [src/components/ui/MediaUploader.tsx](src/components/ui/MediaUploader.tsx) - Media picker (validation OK)
- [src/components/PostEditor/PostEditor.tsx](src/components/PostEditor/PostEditor.tsx) - Video/image editor
- [src/components/PostEditor/PreviewStage.tsx](src/components/PostEditor/PreviewStage.tsx) - Playback
- [src/components/PostEditor/panels/EditPanel.tsx](src/components/PostEditor/panels/EditPanel.tsx) - Trim/rotate
- [src/components/PostEditor/panels/MediaPanel.tsx](src/components/PostEditor/panels/MediaPanel.tsx) - Media import

### Database Models
- `BlogPost`, `BlogPostMedia` - Blog posts with media
- `Post`, `PostMedia` - Social posts with media
- `MediaType` enum - IMAGE|VIDEO|AUDIO|DOCUMENT|PDF
- Schema in [prisma/schema.prisma](prisma/schema.prisma#L572-L700)

---

## FIX PLAN

### P0 (Critical - Implement Immediately)

1. **Fix Media Upload Before Save**
   - Add upload loop in blog-posts page (handleSubmit)
   - Add upload loop in social page (handleSubmit)
   - Upload files that have `file` property but no `url`
   - Wait for upload, get returned URL, replace in media array
   - Show progress toast
   - **Files to change:** blog-posts, social pages

2. **Fix DELETE Query Params → Body**
   - Change DELETE handlers to read from body: `const { id } = await request.json()`
   - Update admin pages to send DELETE as: `{ method: "DELETE", body: JSON.stringify({ id }) }`
   - **Files to change:** blog/posts/route.ts, social/posts/route.ts, admin pages

3. **Add altText Input & Submission**
   - Add altText field to media item UI in admin pages
   - Include in mediaToSend payload before API call
   - **Files to change:** blog-posts, social pages

### P1 (High Priority)

4. **Add Media Styling Controls**
   - Add borderRadius, objectFit, aspectRatio controls
   - Save styling in media state before submission
   - **Files to change:** blog-posts, social pages (add styling panel in media modal)

5. **Add Upload Progress Indicator**
   - Show toast or spinner during media upload
   - Prevent double-submit while uploading

6. **Validate mimeType & fileSize in API Schemas**
   - Add enum for mimeType
   - Add max() constraint for fileSize

---

## TEST COVERAGE

### Existing: `npm run test:admin-media`
- ✅ Module import checks
- ✅ Zod schema validation
- ✅ Utility function tests
- Location: [scripts/test-admin-media.ts](scripts/test-admin-media.ts)

### Build Test
- Command: `npm run build`
- Should exit 0 after all fixes

---

## SUMMARY OF CHANGES NEEDED

| Category | File | Changes |
|----------|------|---------|
| Admin Page | blog-posts/page.tsx | Upload media before save, add altText UI, add styling controls, fix DELETE call |
| Admin Page | social/page.tsx | Upload media before save, add altText UI, add styling controls, fix DELETE call |
| API Route | blog/posts/route.ts | Change DELETE to use body, add mimeType/fileSize validation |
| API Route | social/posts/route.ts | Change DELETE to use body, add mimeType/fileSize validation |
| Component | PostEditor.tsx | No changes needed (already handles export upload) |
| Component | MediaUploader.tsx | No changes needed (validation already OK) |
| Diagnostic | admin/media/diagnose/route.ts | Already done ✅ |

---

**Total Issues:** 12  
**P0 (Critical):** 3  
**P1 (High):** 3  
**P2 (Polish):** 6  

**Status:** Ready for implementation
