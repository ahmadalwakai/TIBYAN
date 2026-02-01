/**
 * Media Upload Utility
 * Handles uploading media files from the client to /api/upload
 */

import { toaster } from "@/components/ui/toaster";

export interface MediaStyling {
  borderRadius?: string;
  objectFit?: string;
  aspectRatio?: string;
}

export interface MediaItem {
  id: string;
  type: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "PDF";
  url: string;
  filename?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
  caption?: string;
  altText?: string;
  order: number;
  styling?: MediaStyling;
  file?: File;
  preview?: string;
}

/**
 * Upload media file to /api/upload and return the public URL
 * @param file - File to upload
 * @returns Promise<string> - Public URL of uploaded file
 * @throws Error if upload fails
 */
export async function uploadMediaFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const json = await res.json();

  if (!json.ok || !json.data?.url) {
    throw new Error(json.error || "فشل تحميل الملف");
  }

  return json.data.url;
}

/**
 * Upload multiple media items that have files
 * Updates the media array with uploaded URLs
 * @param media - Array of media items to upload
 * @returns Promise<MediaItem[]> - Updated media array with URLs
 */
export async function uploadMediaItems(media: MediaItem[]): Promise<MediaItem[]> {
  const uploaded: MediaItem[] = [];

  for (const item of media) {
    try {
      if (item.file && !item.url) {
        // This item needs to be uploaded
        const url = await uploadMediaFile(item.file);
        uploaded.push({
          ...item,
          url,
          // Don't send the file object to API
          file: undefined,
          preview: undefined,
        });
      } else {
        // Already uploaded or no file
        uploaded.push({
          ...item,
          file: undefined,
          preview: undefined,
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "خطأ غير متوقع";
      toaster.error({
        title: `فشل تحميل: ${item.filename || "الملف"}`,
        description: errorMsg,
      });
      throw err;
    }
  }

  return uploaded;
}
