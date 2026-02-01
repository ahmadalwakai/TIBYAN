# Admin Certificates - Quick Reference

## Files Modified/Created

| File | Type | Lines | Purpose |
|------|------|-------|---------|
| `src/types/certificate.ts` | NEW | 74 | Response DTOs |
| `src/lib/certificate-service.ts` | NEW | 171 | Service layer with typed fetch functions |
| `src/app/api/admin/certificates/[id]/route.ts` | NEW | 147 | PATCH & DELETE endpoints |
| `src/lib/validations.ts` | MODIFIED | +61 | Zod schemas for certificates |
| `src/app/api/admin/certificates/route.ts` | MODIFIED | +106 | Enhanced validation & error handling |
| `src/app/admin/certificates/page.tsx` | MODIFIED | +500 | Rewrite: service layer, toasts, edit mode |
| `package.json` | MODIFIED | +1 | Added npm script |
| `scripts/test-admin-certificates.ts` | NEW | 253 | Verification tests |

## Commands to Verify

```bash
# Build (should exit with 0)
npm run build

# Test (should show 7 passed)
npm run test:admin:certificates
```

## API Contract (All Endpoints)

All endpoints return: `{ ok: boolean, data?, error?: string }`

| Method | Path | Auth | Validates | Returns |
|--------|------|------|-----------|---------|
| GET | `/api/admin/certificates` | ADMIN | CertificateFilterSchema | { certificates[], pagination } |
| GET | `/api/admin/certificates?id=X` | ADMIN | CUID format | CertificateDTO |
| POST | `/api/admin/certificates` | ADMIN | CreateCertificateSchema | CertificateDTO |
| PATCH | `/api/admin/certificates/:id` | ADMIN | UpdateCertificateSchema | CertificateDTO |
| DELETE | `/api/admin/certificates/:id` | ADMIN | CUID format | { deleted: true } |

## Key Improvements

- ✅ **Service Layer**: All API calls centralized in `certificate-service.ts`
- ✅ **Toasts**: Professional error/success notifications via Chakra UI
- ✅ **Edit Mode**: Full certificate update capability
- ✅ **Pagination**: Server-side with UI controls
- ✅ **Type Safety**: Complete DTO layer, no `any`
- ✅ **Validation**: Zod on server, form validation on client
- ✅ **Delete Dialog**: Confirmation modal instead of `confirm()`
- ✅ **Loading States**: Prevents double-submit
- ✅ **RTL Layout**: Arabic-first design

## Type Exports

```typescript
// Response DTOs
export interface CertificateDTO { ... }
export interface CertificateListResponse { ... }
export interface CertificateDetailResponse { ... }
export interface CertificateCreateResponse { ... }
export interface CertificateUpdateResponse { ... }
export interface CertificateDeleteResponse { ... }

// Input types (from Zod)
export type CreateCertificateInput = z.infer<typeof CreateCertificateSchema>
export type UpdateCertificateInput = z.infer<typeof UpdateCertificateSchema>
export type CertificateFilterInput = z.infer<typeof CertificateFilterSchema>
```

## Service Functions

```typescript
// All from src/lib/certificate-service.ts
fetchCertificates(options?: { page, limit, search, sortBy, sortOrder })
fetchCertificate(id: string)
createCertificate(payload: CreateCertificateInput)
updateCertificate(id: string, payload: UpdateCertificateInput)
deleteCertificate(id: string)
```

## Database

Prisma Certificate model fields:
- id, certificateNumber (unique)
- studentName, studentNameEn
- courseName, courseNameEn
- completionDate, grade, score
- instructorName, courseDuration, templateType
- userId, courseId (optional relations)
- issuedBy (admin who created), createdAt, updatedAt

Indexes on: certificateNumber, studentName, courseName

## Admin UI Features

| View | Features |
|------|----------|
| **List** | Search, pagination, sort, view, edit, delete (with confirmation dialog) |
| **Create** | Form + live preview, 20 templates, auto-generate cert number, success toast |
| **Edit** | Update any field except cert number, live preview, error handling |
| **Preview** | Export as PDF/PNG, template selector, quick create new |

## Testing

```bash
# Run verification (checks imports, schemas, types, files)
npm run test:admin:certificates

# Expected output: 7/7 passed
```

## Error Handling

- ❌ 400: Validation error (Zod failure)
- ❌ 401: Not admin
- ❌ 404: Certificate not found
- ❌ 500: Server error

All errors show Arabic messages on UI via toasts.

## RTL Notes

- Page has `dir="rtl"` on root Box
- Arabic labels throughout
- Chakra components handle RTL automatically
- Right-aligned buttons and controls
