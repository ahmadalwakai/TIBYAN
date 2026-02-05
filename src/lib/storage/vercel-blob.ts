/**
 * Vercel Blob Storage Provider
 * 
 * Uses Vercel Blob for production file storage.
 * Requires BLOB_READ_WRITE_TOKEN environment variable.
 */

import type { StorageProvider, UploadOptions, UploadResult } from "./types";
import { StorageError } from "./types";

// Vercel Blob API endpoint
const BLOB_API_URL = "https://blob.vercel-storage.com";

function getToken(): string | null {
  return process.env.BLOB_READ_WRITE_TOKEN || null;
}

export const vercelBlobProvider: StorageProvider = {
  type: "blob",

  isConfigured(): boolean {
    return !!getToken();
  },

  async upload(buffer: Buffer | Uint8Array, path: string, options: UploadOptions): Promise<UploadResult> {
    const token = getToken();
    if (!token) {
      throw new StorageError(
        "Vercel Blob not configured. Set BLOB_READ_WRITE_TOKEN.",
        "NOT_CONFIGURED"
      );
    }

    const data = buffer instanceof Uint8Array ? Buffer.from(buffer) : buffer;

    // Use Vercel Blob REST API directly (no SDK dependency)
    // PUT to https://blob.vercel-storage.com/<pathname>
    const response = await fetch(`${BLOB_API_URL}/${path}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": options.contentType,
        "x-content-type": options.contentType,
        "x-cache-control-max-age": options.cacheControl || "31536000", // 1 year default
      },
      body: data,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      console.error("[VercelBlob] Upload failed:", response.status, errorText);
      throw new StorageError(
        `Vercel Blob upload failed (${response.status})`,
        "UPLOAD_FAILED"
      );
    }

    const result = await response.json();

    // Vercel Blob returns { url, pathname, contentType, contentDisposition }
    return {
      url: result.url,
      storage: "blob",
      size: data.length,
    };
  },
};
