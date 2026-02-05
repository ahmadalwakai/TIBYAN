/**
 * Zyphon Image Generation Provider Manager
 * 
 * Manages pluggable image generation providers.
 * Default provider: Replicate (Stable Diffusion XL)
 */

import type { ImageProvider, ImageGenerationRequest, ImageGenerationResult } from "./types";
import { replicateProvider } from "./replicate";

// Registry of available providers
const providers: Map<string, ImageProvider> = new Map([
  ["replicate", replicateProvider],
]);

// Default provider
let currentProvider: ImageProvider = replicateProvider;

/**
 * Get the current image generation provider
 */
export function getImageProvider(): ImageProvider {
  return currentProvider;
}

/**
 * Set the active image generation provider
 */
export function setImageProvider(name: string): boolean {
  const provider = providers.get(name);
  if (provider) {
    currentProvider = provider;
    return true;
  }
  return false;
}

/**
 * Register a new image generation provider
 */
export function registerImageProvider(provider: ImageProvider): void {
  providers.set(provider.name, provider);
}

/**
 * Check if image generation is configured
 */
export function isImageGenerationConfigured(): boolean {
  return currentProvider.isConfigured();
}

/**
 * Generate an image using the current provider
 */
export async function generateImage(
  request: ImageGenerationRequest
): Promise<ImageGenerationResult> {
  if (!currentProvider.isConfigured()) {
    return {
      success: false,
      error: `Image provider '${currentProvider.name}' is not configured`,
    };
  }

  return currentProvider.generate(request);
}
