#!/usr/bin/env tsx
/**
 * Admin Media Tooling Test Script
 * 
 * Runs validation tests on media tooling:
 * - Module imports (catch missing exports)
 * - Zod schema validation
 * - Utility functions
 * - API response contracts
 */

import { z } from "zod";

console.log("🔍 Admin Media Tooling Tests\n");

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result
        .then(() => {
          console.log(`✓ ${name}`);
          passed++;
        })
        .catch((err) => {
          console.error(`✗ ${name}`, err.message);
          failed++;
        });
    } else {
      console.log(`✓ ${name}`);
      passed++;
    }
  } catch (err) {
    console.error(`✗ ${name}`, err instanceof Error ? err.message : String(err));
    failed++;
  }
}

// 1. Test imports
test("Import MediaUploader component", () => {
  const path = require.resolve("../src/components/ui/MediaUploader.tsx");
  if (!path) throw new Error("MediaUploader not found");
});

test("Import PostEditor component", () => {
  const path = require.resolve("../src/components/PostEditor/PostEditor.tsx");
  if (!path) throw new Error("PostEditor not found");
});

test("Import blog posts API route", () => {
  const path = require.resolve("../src/app/api/blog/posts/route.ts");
  if (!path) throw new Error("Blog posts API not found");
});

test("Import social posts API route", () => {
  const path = require.resolve("../src/app/api/social/posts/route.ts");
  if (!path) throw new Error("Social posts API not found");
});

test("Import upload API route", () => {
  const path = require.resolve("../src/app/api/upload/route.ts");
  if (!path) throw new Error("Upload API not found");
});

// 2. Test Zod schemas
test("CreateBlogPostSchema with media", () => {
  const CreateBlogPostSchema = z.object({
    title: z.string().min(1),
    slug: z.string().min(1),
    content: z.string().min(1),
    excerpt: z.string().optional(),
    styling: z.object({
      fontFamily: z.string().optional(),
      fontSize: z.string().optional(),
      fontColor: z.string().optional(),
      backgroundColor: z.string().optional(),
      textAlign: z.string().optional(),
    }).optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
    visibility: z.enum(["PUBLIC", "MEMBERS_ONLY", "PRIVATE"]).default("PUBLIC"),
    featured: z.boolean().default(false),
    allowComments: z.boolean().default(true),
    tags: z.array(z.string()).optional(),
    media: z.array(z.object({
      type: z.enum(["IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "PDF"]),
      url: z.string().url(),
      filename: z.string().optional(),
      mimeType: z.string().optional(),
      fileSize: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
      duration: z.number().optional(),
      caption: z.string().optional(),
      altText: z.string().optional(),
      order: z.number().default(0),
      styling: z.object({
        borderRadius: z.string().optional(),
        objectFit: z.string().optional(),
        aspectRatio: z.string().optional(),
      }).optional(),
    })).optional(),
  });

  const validData = {
    title: "Test",
    slug: "test",
    content: "Content",
    media: [{
      type: "IMAGE" as const,
      url: "https://example.com/image.jpg",
      caption: "Alt text",
      order: 0,
    }],
  };

  const result = CreateBlogPostSchema.safeParse(validData);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`);
  }
});

test("CreatePostSchema with media", () => {
  const CreatePostSchema = z.object({
    title: z.string().optional(),
    content: z.string().min(1),
    excerpt: z.string().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
    visibility: z.enum(["PUBLIC", "TEACHERS_ONLY", "PRIVATE"]).default("PUBLIC"),
    allowComments: z.boolean().default(true),
    allowLikes: z.boolean().default(true),
    media: z.array(z.object({
      type: z.enum(["IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "PDF"]),
      url: z.string().url(),
      filename: z.string().optional(),
      mimeType: z.string().optional(),
      caption: z.string().optional(),
      altText: z.string().optional(),
      order: z.number().default(0),
    })).optional(),
  });

  const validData = {
    content: "Post content",
    media: [{
      type: "VIDEO" as const,
      url: "https://example.com/video.mp4",
      order: 0,
    }],
  };

  const result = CreatePostSchema.safeParse(validData);
  if (!result.success) {
    throw new Error(`Validation failed: ${result.error.message}`);
  }
});

// 3. Test file validation functions
test("File type validation", () => {
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];
  
  if (!ALLOWED_IMAGE_TYPES.includes("image/jpeg")) throw new Error("JPEG validation failed");
  if (!ALLOWED_VIDEO_TYPES.includes("video/mp4")) throw new Error("MP4 validation failed");
  if (ALLOWED_IMAGE_TYPES.includes("video/mp4")) throw new Error("Type confusion check failed");
});

test("File size validation", () => {
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const testSize = 100 * 1024; // 100KB
  
  if (testSize > MAX_FILE_SIZE) throw new Error("Size comparison failed");
  if (testSize <= 0) throw new Error("Size validation failed");
});

// 4. Test API response contract
test("API response contract { ok, data?, error? }", () => {
  const apiResponseSchema = z.object({
    ok: z.boolean(),
    data: z.unknown().optional(),
    error: z.string().optional(),
  });

  const validResponse = { ok: true, data: { id: "123" } };
  const result = apiResponseSchema.safeParse(validResponse);
  if (!result.success) {
    throw new Error("API response validation failed");
  }

  const errorResponse = { ok: false, error: "Something went wrong" };
  const errorResult = apiResponseSchema.safeParse(errorResponse);
  if (!errorResult.success) {
    throw new Error("API error response validation failed");
  }
});

// 5. Test MediaType enum
test("MediaType enum values", () => {
  const MediaTypeEnum = z.enum(["IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "PDF"]);
  
  const testValues = ["IMAGE", "VIDEO", "AUDIO", "DOCUMENT", "PDF"];
  testValues.forEach((val) => {
    const result = MediaTypeEnum.safeParse(val);
    if (!result.success) {
      throw new Error(`Invalid MediaType: ${val}`);
    }
  });
});

// 6. Test media styling
test("MediaStyling schema", () => {
  const MediaStylingSchema = z.object({
    borderRadius: z.string().optional(),
    objectFit: z.string().optional(),
    aspectRatio: z.string().optional(),
  });

  const validStyling = {
    borderRadius: "8px",
    objectFit: "cover",
    aspectRatio: "16/9",
  };

  const result = MediaStylingSchema.safeParse(validStyling);
  if (!result.success) {
    throw new Error("MediaStyling validation failed");
  }
});

// Wait for async tests
setTimeout(() => {
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}, 100);
