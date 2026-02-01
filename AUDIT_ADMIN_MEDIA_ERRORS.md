# Admin Media Tooling Audit Report

**Date:** Feb 1, 2026  
**Status:** AUDIT COMPLETE + FIXES IMPLEMENTING

---

## 1. CRITICAL ERRORS & MISTAKES

### P0: Crashes, Broken Routes, Auth/Permission Bugs

#### 1.1 Missing PUT Endpoint for `/api/blog/posts`
- **File:** [src/app/api/blog/posts/route.ts](src/app/api/blog/posts/route.ts#L219)
- **Issue:** Admin blog page calls `PUT /api/blog/posts` to update but endpoint handles it (line 219). This is correct, but DELETE uses query param `?id=` which is non-standard.
- **Risk:** Inconsistent API style (DELETE uses query, PUT uses body).
- **Fix:** Standardize DELETE to use request body or JSON payload.

#### 1.2 Missing Auth Check in Admin Blog Page
- **File:** [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx#L100)
- **Issue:** Page has NO auth check. It's a client component that assumes user is admin.
- **Risk:** Unauthorized users can access the page and attempt API calls (which will fail at API layer).
- **Fix:** Add auth guard + role check on page load.

#### 1.3 Missing Auth Check in Admin Social Page
- **File:** [src/app/admin/social/page.tsx](src/app/admin/social/page.tsx#L100)
- **Issue:** Same as above - NO auth guard on admin page.
- **Risk:** Unauthorized access to admin tools.
- **Fix:** Add useEffect auth check similar to `/social/create/edit`.

#### 1.4 Missing Media Export Blob Validation
- **File:** [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx#L310)
- **Issue:** `handleMediaEditorExport` reads Blob as DataURL but doesn't validate:
  - No error handling if FileReader fails
  - No check if blob is valid
  - DataURL stored in `media[].url` but API expects `url` to be HTTP URL
- **Risk:** Invalid media URLs sent to API cause 400 errors.
- **Fix:** Validate blob, upload to `/api/upload`, use returned URL.

#### 1.5 API Response Contract Violation (Blog POST)
- **File:** [src/app/api/blog/posts/route.ts](src/app/api/blog/posts/route.ts#L167)
- **Issue:** POST returns `{ ok: true, data: blogPost }` but admin page expects response to conform to contract.
- **Risk:** TypeScript strict mode issue + response shape mismatch.
- **Fix:** Ensure all endpoints return `{ ok: boolean, data?, error? }`.

#### 1.6 Undefined Media Type Enum Mismatch
- **File:** [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx#L34)
- **Issue:** BlogMedia interface uses `type: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "PDF"` (matches enum).
- But Prisma schema defines `enum MediaType` with same values.
- **Risk:** No issue currently but duplication.
- **Fix:** Import MediaType from lib/types or Prisma.

---

### P1: Broken Uploads/Previews/Saves

#### 1.7 MediaUploader Missing Image Dimensions in Admin
- **File:** [src/components/ui/MediaUploader.tsx](src/components/ui/MediaUploader.tsx#L140)
- **Issue:** When getting image dimensions (lines 131-142), code waits for `onload` but doesn't handle:
  - Timeout if image never loads
  - CORS errors silently fail
  - Returns `width/height` as `undefined` in newMedia push
- **Risk:** Images uploaded with null dimensions → API validation fails.
- **Fix:** Add timeout + error handler + ensure dimensions always set.

#### 1.8 Media Export Uses DataURL Not HTTP URL
- **File:** [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx#L320)
- **Issue:** `handleMediaEditorExport` sets `url: dataUrl` (base64) instead of uploading file.
- When POST is called, Zod validates `url: z.string().url()` - DataURLs are valid URLs but:
  - API stores them as-is
  - Frontend can't fetch them later (no CORS)
  - Database bloats with base64
- **Risk:** Broken image/video playback after export.
- **Fix:** Upload blob via `/api/upload` first, then use returned URL.

#### 1.9 File Size Check Missing in Upload
- **File:** [src/app/api/upload/route.ts](src/app/api/upload/route.ts#L48)
- **Issue:** Validates `file.size > MAX_FILE_SIZE` (50MB) correctly.
- But admin pages do NOT pre-validate file size before upload.
- **Risk:** Large files get uploaded then rejected → slow UX, no progress cancellation.
- **Fix:** Add client-side file size validation in MediaUploader.

#### 1.10 Missing MIME Type Validation in MediaUploader
- **File:** [src/components/ui/MediaUploader.tsx](src/components/ui/MediaUploader.tsx#L118)
- **Issue:** `handleFileSelect` calls `getMediaType(file.type)` but doesn't validate:
  - File extension vs MIME type mismatch (e.g., .exe with image/jpeg)
  - MIME type spoofing
- **Risk:** Malicious files bypass validation.
- **Fix:** Add magic number check or use accept attribute properly.

#### 1.11 Video Dimensions Not Extracted
- **File:** [src/components/ui/MediaUploader.tsx](src/components/ui/MediaUploader.tsx#L118)
- **Issue:** For videos, `width/height/duration` are NOT extracted (only for images).
- Calls `getMediaType` which returns MediaType but newMedia.push doesn't set video dimensions.
- **Risk:** Videos have `width: undefined, height: undefined, duration: undefined`.
- **Fix:** Extract video metadata using `<video>` element.

#### 1.12 Alt Text Not Saved for Media
- **File:** [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx#L205)
- **Issue:** MediaUploader component has `altText` field in interface but admin page:
  - Doesn't provide input for altText in UI
  - Doesn't map it when sending to API
- **Risk:** Missing accessibility (alt text), A11y violations.
- **Fix:** Add altText input in admin modal + include in media payload.

#### 1.13 Missing Media Styling UI in Admin Blog
- **File:** [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx#L596)
- **Issue:** MediaUploader is called with `media` state but admin doesn't show styling UI.
- API accepts `styling: { borderRadius, objectFit, aspectRatio }` but UI has no controls.
- **Risk:** Can't customize media presentation from admin.
- **Fix:** Add styling controls (border-radius, object-fit, aspect-ratio dropdowns).

#### 1.14 Blog Post "featured" Toggle Not Persisting
- **File:** [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx#L288)
- **Issue:** `handleToggleFeatured` sends `{ id, featured: !post.featured }` via PUT.
- But UpdateBlogPostSchema.partial() means `featured` is optional.
- **Risk:** If API doesn't merge data correctly, toggle may fail silently.
- **Fix:** Verify Prisma update merges partial data correctly (it does, but add test).

#### 1.15 Media Order Not Enforced
- **File:** [src/components/ui/MediaUploader.tsx](src/components/ui/MediaUploader.tsx#L165)
- **Issue:** When reordering media, `order` is set but NOT validated:
  - No uniqueness constraint
  - Could send `[{order: 0}, {order: 0}]` to API
- **Risk:** Unpredictable media display order.
- **Fix:** Add validation in Zod schema: media.map ensure order is sequential 0-N.

---

### P2: UX Issues, Missing States, RTL/Arabic Polish

#### 1.16 No Loading Spinner During Upload
- **File:** [src/components/ui/MediaUploader.tsx](src/components/ui/MediaUploader.tsx#L118)
- **Issue:** Upload happens via `handleFileSelect` but no progress indicator shown.
- Upload is fire-and-forget; user sees file added but doesn't know if upload succeeded.
- **Risk:** User thinks file is ready but it's still uploading → submit fails.
- **Fix:** Add `uploading: boolean` state, show spinner per file.

#### 1.17 No Error Toast on Upload Failure
- **File:** [src/components/ui/MediaUploader.tsx](src/components/ui/MediaUploader.tsx#L118)
- **Issue:** No try/catch or error handling in `handleFileSelect`.
- If upload fails, user gets no feedback.
- **Risk:** Silent failures confuse users.
- **Fix:** Add error boundary, toast on failure.

#### 1.18 No Confirmation Modal Before Delete
- **File:** [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx#L275)
- **Issue:** Uses native `confirm()` dialog (not Chakra UI modal).
- RTL text display broken in native confirm dialog.
- **Risk:** Poor UX, Arabic text unreadable in confirmation.
- **Fix:** Use Chakra UI AlertDialog component.

#### 1.19 Missing Empty State for Media
- **File:** [src/components/ui/MediaUploader.tsx](src/components/ui/MediaUploader.tsx#L250)
- **Issue:** If media array is empty, component shows file input but no helpful message.
- **Risk:** User unsure how to add media.
- **Fix:** Show empty state with icon + instructions.

#### 1.20 RTL Layout Not Applied to Media Grid
- **File:** [src/components/ui/MediaUploader.tsx](src/components/ui/MediaUploader.tsx#L300)
- **Issue:** Grid/Flex components use default LTR layout.
- In RTL mode, media items display incorrectly.
- **Risk:** Arabic UX broken for media gallery.
- **Fix:** Add `dir="rtl"` context or use `rtl` style props.

#### 1.21 No File Type Icon for DOCUMENT/PDF
- **File:** [src/components/ui/MediaUploader.tsx](src/components/ui/MediaUploader.tsx#L82)
- **Issue:** `getMediaIcon` returns emoji for IMAGE/VIDEO/AUDIO/PDF/DOCUMENT.
- But PDF and DOCUMENT are stored as URLs (not displayable as images).
- **Risk:** Misleading preview UI.
- **Fix:** Show file icon + filename instead of trying to render PDF/DOC as image.

#### 1.22 Missing Loading State in Admin Pages
- **File:** [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx#L100)
- **Issue:** Posts fetched but spinners only shown during `loading` state.
- During submit (create/update/delete), no spinner shown.
- **Risk:** User clicks button twice thinking first click didn't work.
- **Fix:** Show spinner on submit buttons while `submitting: true`.

#### 1.23 Arabic Labels for File Types
- **File:** [src/components/ui/MediaUploader.tsx](src/components/ui/MediaUploader.tsx#L82)
- **Issue:** MediaType enum and interfaces all use English labels (IMAGE, VIDEO, etc.).
- UI displays English type names.
- **Risk:** Inconsistent RTL/Arabic first experience.
- **Fix:** Add Arabic translations for media types.

---

## 2. MISSING FEATURES / NOT IMPLEMENTED

### Video Transcoding/Processing
- No transcoding hooks defined
- No thumbnail generation
- No video codec validation (accepts any .mp4)

### Photo Optimization
- No image compression
- No variant generation (thumbnail, medium, large)
- No crop/resize endpoint

### Advanced Edit Tools
- No version control / drafts (only DRAFT/PUBLISHED)
- No undo/redo (Zustand store has it but UI doesn't expose)
- No collaborative editing

### Validations
- No URL reachability check before saving media
- No virus/malware scan
- No NSFW content filter

### Permissions
- No granular permissions (can edit all or none)
- No ownership check (admin can edit anyone's media)

### Dev Diagnostics
- No `/api/admin/media/diagnose` endpoint
- No dev-only client self-check panel

---

## 3. INVENTORY: ADMIN MEDIA ROUTES/COMPONENTS

### Routes
- [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx) - Blog CRUD + media upload
- [src/app/admin/social/page.tsx](src/app/admin/social/page.tsx) - Social posts CRUD + media upload
- [src/app/admin/storage/page.tsx](src/app/admin/storage/page.tsx) - Storage manager (files listing)
- [src/app/admin/courses/page.tsx](src/app/admin/courses/page.tsx) - Courses listing (thumbnail refs)

### API Routes
- [src/app/api/blog/posts/route.ts](src/app/api/blog/posts/route.ts) - Blog CRUD with media
- [src/app/api/social/posts/route.ts](src/app/api/social/posts/route.ts) - Social CRUD with media
- [src/app/api/upload/route.ts](src/app/api/upload/route.ts) - File upload handler
- [src/app/api/admin/storage/route.ts](src/app/api/admin/storage/route.ts) - Storage stats & file list
- [src/app/api/admin/courses/[id]/route.ts](src/app/api/admin/courses/[id]/route.ts) - Course update (thumbnail field)

### Components
- [src/components/ui/MediaUploader.tsx](src/components/ui/MediaUploader.tsx) - Generic media picker/manager
- [src/components/PostEditor/PostEditor.tsx](src/components/PostEditor/PostEditor.tsx) - Advanced video/image editor
- [src/components/PostEditor/PreviewStage.tsx](src/components/PostEditor/PreviewStage.tsx) - Video preview/playback
- [src/components/PostEditor/panels/EditPanel.tsx](src/components/PostEditor/panels/EditPanel.tsx) - Video trim/rotate/speed
- [src/components/PostEditor/panels/MediaPanel.tsx](src/components/PostEditor/panels/MediaPanel.tsx) - Media import/reorder
- [src/components/PostEditor/panels/AudioPanel.tsx](src/components/PostEditor/panels/AudioPanel.tsx) - Audio controls
- [src/components/PostEditor/panels/EffectsPanel.tsx](src/components/PostEditor/panels/EffectsPanel.tsx) - Effects/filters

### Hooks/Stores
- [src/lib/editor/store.ts](src/lib/editor/store.ts) - Zustand editor state (media assets, undo/redo)
- [src/lib/editor/ffmpegExport.ts](src/lib/editor/ffmpegExport.ts) - FFmpeg video export

### DB Models
- `BlogPost` - Blog posts with media relation
- `BlogPostMedia` - Media for blog posts
- `Post` - Social posts with media relation
- `PostMedia` - Media for social posts
- `MediaType` enum - IMAGE|VIDEO|AUDIO|DOCUMENT|PDF
- `Course.thumbnail` - String field (url to thumbnail)
- `Lesson.videoUrl` - String field (url to video)

---

## 4. FIX PLAN

### P0 (Crashes/Auth) - IMPLEMENT IMMEDIATELY
- [ ] Add auth guard to admin blog-posts page
- [ ] Add auth guard to admin social page
- [ ] Fix Media Export to upload blob instead of using DataURL
- [ ] Standardize API DELETE to use body instead of query params
- [ ] Add Zod validation for media order (sequential)

### P1 (Broken Uploads/Saves) - IMPLEMENT IMMEDIATELY
- [ ] Add image dimension extraction in MediaUploader
- [ ] Add video metadata extraction (width, height, duration)
- [ ] Add client-side file size validation
- [ ] Add MIME type validation with extension check
- [ ] Add altText input field in admin pages
- [ ] Fix media styling UI in admin pages
- [ ] Add upload progress/error states

### P2 (UX/RTL) - IMPLEMENT AFTER P0/P1
- [ ] Use Chakra AlertDialog for delete confirmations
- [ ] Add empty state to MediaUploader
- [ ] Fix RTL layout for media grids
- [ ] Show loading spinners on form submission
- [ ] Add Arabic labels for media types
- [ ] Add dev diagnostics endpoint
- [ ] Add dev-only client self-check panel

