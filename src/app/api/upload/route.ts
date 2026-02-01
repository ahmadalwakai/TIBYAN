import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { z } from "zod";

// Allowed file types
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const uploadResponseSchema = z.object({
  ok: z.boolean(),
  data: z
    .object({
      url: z.string(),
      filename: z.string(),
      type: z.enum(["image", "video", "audio"]),
      size: z.number(),
    })
    .optional(),
  error: z.string().optional(),
});

type UploadResponse = z.infer<typeof uploadResponseSchema>;

function getMediaType(mimeType: string): "image" | "video" | "audio" | null {
  if (ALLOWED_IMAGE_TYPES.includes(mimeType)) return "image";
  if (ALLOWED_VIDEO_TYPES.includes(mimeType)) return "video";
  if (ALLOWED_AUDIO_TYPES.includes(mimeType)) return "audio";
  return null;
}

function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split(".").pop() || "bin";
  const safeName = originalName
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .substring(0, 50);
  return `${safeName}_${timestamp}_${randomStr}.${ext}`;
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { ok: false, error: "File size exceeds 50MB limit" },
        { status: 400 }
      );
    }

    // Validate file type
    const mediaType = getMediaType(file.type);
    if (!mediaType) {
      return NextResponse.json(
        {
          ok: false,
          error: `Unsupported file type: ${file.type}. Allowed: images (jpeg, png, gif, webp), videos (mp4, webm, ogg), audio (mp3, wav, ogg)`,
        },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", mediaType);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Generate unique filename and save
    const filename = generateUniqueFilename(file.name);
    const filepath = join(uploadsDir, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Return the public URL
    const url = `/uploads/${mediaType}/${filename}`;

    return NextResponse.json({
      ok: true,
      data: {
        url,
        filename,
        type: mediaType,
        size: file.size,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
