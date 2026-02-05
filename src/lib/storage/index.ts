/**
 * Storage Provider Selection
 * 
 * Selects the appropriate storage provider based on environment:
 * - Production: Vercel Blob (BLOB_READ_WRITE_TOKEN required)
 * - Development: Local (writes to public/uploads/)
 * 
 * Usage:
 *   import { storage } from "@/lib/storage";
 *   const result = await storage.upload(buffer, "ai-images/file.png", { contentType: "image/png" });
 */

import type { StorageProvider, UploadOptions, UploadResult, StorageProviderType } from "./types";
import { StorageError } from "./types";
import { localStorageProvider } from "./local";
import { vercelBlobProvider } from "./vercel-blob";

export type { StorageProvider, UploadOptions, UploadResult, StorageProviderType };
export { StorageError };

/**
 * Get the active storage provider based on environment
 */
function getProvider(): StorageProvider {
  const isProduction = process.env.NODE_ENV === "production";

  // In production, require Vercel Blob
  if (isProduction) {
    if (vercelBlobProvider.isConfigured()) {
      return vercelBlobProvider;
    }
    // Return a "dummy" provider that will fail with a clear message
    return {
      type: "local",
      isConfigured: () => false,
      upload: async () => {
        throw new StorageError(
          "Storage is not configured for production. Configure BLOB_READ_WRITE_TOKEN.",
          "PRODUCTION_LOCAL_DENIED"
        );
      },
    };
  }

  // In development, prefer Vercel Blob if configured, else local
  if (vercelBlobProvider.isConfigured()) {
    return vercelBlobProvider;
  }
  return localStorageProvider;
}

/**
 * Unified storage interface
 */
export const storage = {
  /**
   * Get the current storage provider type
   */
  getProviderType(): StorageProviderType {
    return getProvider().type;
  },

  /**
   * Check if storage is properly configured for the current environment
   */
  isConfigured(): boolean {
    const provider = getProvider();
    const isProduction = process.env.NODE_ENV === "production";
    
    // In production, must have Vercel Blob
    if (isProduction) {
      return vercelBlobProvider.isConfigured();
    }
    
    // In dev, local is always available
    return provider.isConfigured();
  },

  /**
   * Upload a file to storage
   */
  async upload(buffer: Buffer | Uint8Array, path: string, options: UploadOptions): Promise<UploadResult> {
    const provider = getProvider();
    return provider.upload(buffer, path, options);
  },
};

// Export individual providers for testing
export { localStorageProvider, vercelBlobProvider };
