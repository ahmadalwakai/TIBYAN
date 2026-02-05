/**
 * Storage Provider Abstraction
 * 
 * Defines the interface for file storage providers (Local, Vercel Blob, etc.).
 * Used by Zyphon image/pdf endpoints.
 */

export type StorageProviderType = "local" | "blob";

export interface UploadOptions {
  /** Content-Type of the file */
  contentType: string;
  /** Optional cache control */
  cacheControl?: string;
}

export interface UploadResult {
  /** Public URL to access the file */
  url: string;
  /** Storage provider that was used */
  storage: StorageProviderType;
  /** Size in bytes */
  size: number;
}

export interface StorageProvider {
  /** Provider type identifier */
  readonly type: StorageProviderType;
  
  /** Check if this provider is properly configured */
  isConfigured(): boolean;
  
  /**
   * Upload a file to storage
   * @param buffer File contents
   * @param path Relative path/filename (e.g., "ai-images/123_abc.png")
   * @param options Upload options
   * @returns Upload result with public URL
   */
  upload(buffer: Buffer | Uint8Array, path: string, options: UploadOptions): Promise<UploadResult>;
}

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: "NOT_CONFIGURED" | "UPLOAD_FAILED" | "PRODUCTION_LOCAL_DENIED"
  ) {
    super(message);
    this.name = "StorageError";
  }
}
