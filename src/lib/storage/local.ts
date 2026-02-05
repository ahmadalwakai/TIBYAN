/**
 * Local File Storage Provider
 * 
 * Writes files to public/uploads/ directory.
 * FOR DEVELOPMENT ONLY - will reject in production.
 */

import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";
import type { StorageProvider, UploadOptions, UploadResult } from "./types";
import { StorageError } from "./types";

const PUBLIC_UPLOADS_DIR = join(process.cwd(), "public", "uploads");

export const localStorageProvider: StorageProvider = {
  type: "local",

  isConfigured(): boolean {
    // Local storage is always "configured" in dev
    // But will be blocked in production by upload()
    return true;
  },

  async upload(buffer: Buffer | Uint8Array, path: string, options: UploadOptions): Promise<UploadResult> {
    // SAFETY: Never write to public/ in production
    if (process.env.NODE_ENV === "production") {
      throw new StorageError(
        "Storage is not configured for production. Configure BLOB_READ_WRITE_TOKEN.",
        "PRODUCTION_LOCAL_DENIED"
      );
    }

    const fullPath = join(PUBLIC_UPLOADS_DIR, path);
    const dir = dirname(fullPath);

    // Ensure directory exists
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
    }

    // Write file
    const data = buffer instanceof Uint8Array ? Buffer.from(buffer) : buffer;
    await writeFile(fullPath, data);

    // Return public URL (relative path for Next.js)
    const url = `/uploads/${path}`;

    return {
      url,
      storage: "local",
      size: data.length,
    };
  },
};
