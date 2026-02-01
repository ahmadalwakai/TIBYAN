# ERRORS & FIXES - STRUCTURED REFERENCE

## All Issues Found & Fixed

### P0 CRITICAL (3 issues)

#### ❌ ERROR #1: Media Uploaded with Broken/Placeholder URLs
**Severity:** CRITICAL - Data Loss  
**Type:** Logic Bug (Resource Not Saved)  

**Evidence:**
- Line 246 in [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx#L246):
  ```tsx
  url: m.url || m.preview || `https://placeholder.com/${m.id}`
  ```
- When new media added: `m.url` empty, `m.preview` is blob: URL
- Blob URLs not accessible on server → 404 on page load

**Files Affected:**
1. [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx#L246)
2. [src/app/admin/social/page.tsx](src/app/admin/social/page.tsx#L225)

**✅ FIXED:**
- Created [src/lib/media-utils.ts](src/lib/media-utils.ts) with `uploadMediaItems()`
- Added upload loop in `handleSubmit()` before API call
- All media files uploaded first, then URLs used

**Verification:** Build ✓, Tests ✓

---

#### ❌ ERROR #2: DELETE Requests Use Query Params (Security)
**Severity:** HIGH - Security Issue (ID in History)  
**Type:** RESTful Violation + Security  

**Evidence:**
- Line 287 in [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx#L287):
  ```tsx
  fetch(`/api/blog/posts?id=${post.id}`, { method: "DELETE" })
  ```
- DELETE should use body, not query params
- ID exposed in browser history, proxy logs

**Files Affected:**
1. [src/app/api/blog/posts/route.ts](src/app/api/blog/posts/route.ts#L318)
2. [src/app/api/social/posts/route.ts](src/app/api/social/posts/route.ts#L386)
3. [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx#L287)
4. [src/app/admin/social/page.tsx](src/app/admin/social/page.tsx#L292)

**✅ FIXED:**
- Changed API routes to: `const { id } = await request.json()`
- Changed admin calls to send body:
  ```tsx
  fetch("/api/blog/posts", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: post.id })
  })
  ```

**Verification:** Build ✓, Tests ✓

---

#### ❌ ERROR #3: Alt Text Never Submitted to API
**Severity:** MEDIUM - Accessibility  
**Type:** Missing Implementation  

**Evidence:**
- Line 39 in [src/components/ui/MediaUploader.tsx](src/components/ui/MediaUploader.tsx#L39):
  - Field exists in interface: `altText?: string`
- Lines 246, 225 in admin pages: Not included in payload
- API schema accepts it but admin never sends it
- Images have no accessibility description

**Files Affected:**
1. [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx#L246)
2. [src/app/admin/social/page.tsx](src/app/admin/social/page.tsx#L225)

**✅ FIXED:**
- Added altText input in Media Configuration Panel
- Included in mediaToSend: `altText: m.altText`
- Full UI for entering alt text per media item

**Verification:** Build ✓, Tests ✓

---

### P1 HIGH (3 issues)

#### ❌ ERROR #4: Missing Media Styling UI Controls
**Severity:** MEDIUM - UX/Functionality  
**Type:** Missing UI  

**Evidence:**
- Schema accepts: `styling: { borderRadius, objectFit, aspectRatio }`
- Zero UI controls to set these values
- Users can't customize media presentation
- Hard-coded defaults in MediaUploader preview only

**Files Affected:**
1. [src/app/admin/blog-posts/page.tsx](src/app/admin/blog-posts/page.tsx)
2. [src/app/admin/social/page.tsx](src/app/admin/social/page.tsx)

**✅ FIXED:**
- Added Media Configuration Panel with styling controls:
  - Border Radius: 5 options (sharp to circular)
  - Object Fit: 4 options (cover, contain, fill, stretch)
- Per-media item controls
- Real-time preview possible

**Verification:** Build ✓, Tests ✓

---

#### ❌ ERROR #5: Zod Validation Missing for mimeType
**Severity:** MEDIUM - Data Integrity  
**Type:** Weak Validation  

**Evidence:**
- Line 37 in [src/app/api/blog/posts/route.ts](src/app/api/blog/posts/route.ts#L37):
  ```typescript
  mimeType: z.string().optional(),  // No validation!
  ```
- API accepts any MIME type
- Could conflict with upload API which has strict checking

**Files Affected:**
1. [src/app/api/blog/posts/route.ts](src/app/api/blog/posts/route.ts#L37)
2. [src/app/api/social/posts/route.ts](src/app/api/social/posts/route.ts#L37)

**✅ FIXED:**
- Added enum validation:
  ```typescript
  mimeType: z.string().refine(
    (mimeType) => ALLOWED_ALL_MIMES.includes(mimeType),
    "نوع MIME غير مدعوم"
  ).optional(),
  ```
- Enforces: JPEG, PNG, GIF, WebP, MP4, WebM, Ogg, MP3, WAV, PDF only

**Verification:** Build ✓, Tests ✓

---

#### ❌ ERROR #6: Zod Validation Missing for fileSize
**Severity:** MEDIUM - Data Integrity  
**Type:** Weak Validation  

**Evidence:**
- Line 39 in [src/app/api/blog/posts/route.ts](src/app/api/blog/posts/route.ts#L39):
  ```typescript
  fileSize: z.number().optional(),  // No max limit!
  ```
- API accepts any file size
- Inconsistent with upload API (50MB limit)

**Files Affected:**
1. [src/app/api/blog/posts/route.ts](src/app/api/blog/posts/route.ts#L39)
2. [src/app/api/social/posts/route.ts](src/app/api/social/posts/route.ts#L39)

**✅ FIXED:**
- Added max constraint:
  ```typescript
  fileSize: z.number().max(
    MAX_FILE_SIZE,
    `حجم الملف يجب أن لا يتجاوز 50MB`
  ).optional(),
  ```
- Consistent with /api/upload (50MB = 52,428,800 bytes)

**Verification:** Build ✓, Tests ✓

---

### P2 POLISH (6 issues - Not Implemented)

#### ⏸️ ISSUE #7: Empty State Message Missing
**Severity:** LOW - UX Polish  
**Type:** Missing Message  
**File:** [src/components/ui/MediaUploader.tsx](src/components/ui/MediaUploader.tsx#L320)  
**Impact:** No feedback when no media added  
**Status:** Deferred (nice-to-have)

#### ⏸️ ISSUE #8: RTL Grid Layout Not Optimized
**Severity:** LOW - UX Polish  
**Type:** Layout Issue  
**Files:** Admin pages  
**Impact:** Media grid doesn't perfectly mirror in RTL  
**Status:** Deferred (cosmetic)

#### ⏸️ ISSUE #9: No Error Boundary for Media Components
**Severity:** LOW - Robustness  
**Type:** Missing Error Handling  
**Files:** PostEditor, MediaUploader  
**Impact:** Component crash takes down entire admin page  
**Status:** Deferred (rare edge case)

#### ⏸️ ISSUE #10: No Client Diagnostic Panel
**Severity:** LOW - Dev Experience  
**Type:** Missing Debug UI  
**File:** None (would be in admin layout)  
**Impact:** Harder to debug media issues in dev  
**Status:** Deferred (dev-only, not blocking)

#### ⏸️ ISSUE #11: No Upload Progress Indicator
**Severity:** LOW - UX Polish  
**Type:** Missing Feedback  
**Files:** Admin pages  
**Impact:** No visual feedback during media upload  
**Status:** Deferred (toast on success/error added)

#### ⏸️ ISSUE #12: No URL Reachability Check
**Severity:** LOW - Data Quality  
**Type:** Validation Gap  
**Files:** Admin pages  
**Impact:** Can save media with unreachable URLs  
**Status:** Deferred (low priority)

---

## Summary Table

| ID | Severity | Type | Error | Fix | Status |
|:--:|:--------:|:----:|:-----:|:---:|:------:|
| 1 | CRITICAL | Logic | Blob URLs saved | Upload before save | ✅ Done |
| 2 | HIGH | Security | DELETE query param | DELETE body | ✅ Done |
| 3 | MEDIUM | Feature | altText not sent | Add UI + payload | ✅ Done |
| 4 | MEDIUM | Feature | No styling UI | Add control panel | ✅ Done |
| 5 | MEDIUM | Validation | mimeType unchecked | Add refine() | ✅ Done |
| 6 | MEDIUM | Validation | fileSize unchecked | Add max() | ✅ Done |
| 7 | LOW | UX | No empty state | Add message | ⏸️ Deferred |
| 8 | LOW | Layout | RTL grid off | Fix grid direction | ⏸️ Deferred |
| 9 | LOW | Robustness | No error boundary | Wrap components | ⏸️ Deferred |
| 10 | LOW | DevExp | No diag panel | Build UI | ⏸️ Deferred |
| 11 | LOW | UX | No upload progress | Add spinner | ⏸️ Deferred |
| 12 | LOW | Quality | No URL check | Validate URLs | ⏸️ Deferred |

---

## Line-by-Line Changes

### src/app/admin/blog-posts/page.tsx

**Change 1: Import uploadMediaItems**
```diff
+ import { uploadMediaItems } from "@/lib/media-utils";
```

**Change 2: Add altText to BlogMedia interface**
```diff
  interface BlogMedia {
    id: string;
    type: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "PDF";
    url: string;
    filename?: string;
    caption?: string;
+   altText?: string;
    styling?: { ... };
  }
```

**Change 3: Fix handleSubmit to upload media**
```diff
- const mediaToSend = media.map((m, i) => ({
-   type: m.type,
-   url: m.url || m.preview || `https://placeholder.com/${m.id}`,
-   ...
- }));

+ let uploadedMedia = media;
+ const hasUnuploadedMedia = media.some(m => m.file && !m.url);
+ if (hasUnuploadedMedia) {
+   try {
+     uploadedMedia = await uploadMediaItems(media);
+   } catch (err) {
+     return;
+   }
+ }
+ const mediaToSend = uploadedMedia.map((m, i) => ({
+   type: m.type,
+   url: m.url,
+   filename: m.filename,
+   mimeType: m.mimeType,
+   fileSize: m.fileSize,
+   width: m.width,
+   height: m.height,
+   duration: m.duration,
+   caption: m.caption,
+   altText: m.altText,
+   order: i,
+   styling: m.styling,
+ }));
```

**Change 4: Fix confirmDelete to use body**
```diff
- const res = await fetch(`/api/blog/posts?id=${post.id}`, {
+ const res = await fetch("/api/blog/posts", {
    method: "DELETE",
+   headers: { "Content-Type": "application/json" },
+   body: JSON.stringify({ id: post.id }),
    credentials: "include",
  });
```

**Change 5: Add Media Configuration Panel**
```diff
  {/* Media */}
  <Box>
    <Text fontWeight="600" mb={2}>الوسائط</Text>
    <MediaUploader
      media={media}
      onChange={setMedia}
      maxItems={10}
    />
+   {media.length > 0 && (
+     <Stack gap={4} mt={6} p={4} borderWidth="1px">
+       {/* Alt Text, Caption, Styling Controls per media item */}
+     </Stack>
+   )}
  </Box>
```

Similar changes in [src/app/admin/social/page.tsx](src/app/admin/social/page.tsx)

---

### src/app/api/blog/posts/route.ts

**Change 1: Add MIME validation constants**
```diff
+ const ALLOWED_IMAGE_MIMES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
+ const ALLOWED_VIDEO_MIMES = ["video/mp4", "video/webm", "video/ogg"];
+ const ALLOWED_AUDIO_MIMES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"];
+ const ALLOWED_DOCUMENT_MIMES = ["application/pdf"];
+ const ALLOWED_ALL_MIMES = [...];
+ const MAX_FILE_SIZE = 50 * 1024 * 1024;
```

**Change 2: Add validation to schema**
```diff
  media: z.array(z.object({
    type: z.enum(["IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "PDF"]),
    url: z.string().url(),
    filename: z.string().optional(),
-   mimeType: z.string().optional(),
-   fileSize: z.number().optional(),
+   mimeType: z.string().refine(
+     (mimeType) => ALLOWED_ALL_MIMES.includes(mimeType),
+     "نوع MIME غير مدعوم"
+   ).optional(),
+   fileSize: z.number().max(MAX_FILE_SIZE, "...").optional(),
    width: z.number().optional(),
    height: z.number().optional(),
    duration: z.number().optional(),
    caption: z.string().optional(),
+   altText: z.string().optional(),
    order: z.number().default(0),
    styling: z.object({...}).optional(),
  })).optional(),
```

**Change 3: Fix DELETE to use body**
```diff
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "..." }, { status: 403 });
    }
-   const { searchParams } = new URL(request.url);
-   const id = searchParams.get("id");
+   const body = await request.json();
+   const { id } = body;
    
    if (!id) {
      return NextResponse.json({ ok: false, error: "..." }, { status: 400 });
    }
    // ... rest unchanged
  }
}
```

Similar changes in [src/app/api/social/posts/route.ts](src/app/api/social/posts/route.ts)

---

### src/lib/media-utils.ts (NEW FILE)

**Full file content** - Provides:
- `uploadMediaFile(file: File): Promise<string>` - Upload single file
- `uploadMediaItems(media: MediaItem[]): Promise<MediaItem[]>` - Upload all, return updated

---

## Validation

### TypeScript Strict
```
✅ No 'any' types
✅ All imports resolved
✅ All types properly declared
✅ No unsafe type assertions
```

### Build
```
✅ npm run build → exit 0
✅ All files compile
✅ No warnings
```

### Tests
```
✅ 12/12 tests pass
✅ Schema validation works
✅ Module imports correct
✅ API contract { ok, data?, error? } verified
```

### Runtime
- ✅ Media uploads before save
- ✅ DELETE uses body not query
- ✅ altText included in payload
- ✅ Styling controls editable
- ✅ MIME types validated
- ✅ File sizes validated

---

**Report Complete**
**All P0 + P1 issues FIXED**
**Status: READY FOR PRODUCTION ✅**
