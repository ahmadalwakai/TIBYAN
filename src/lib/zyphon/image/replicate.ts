/**
 * Replicate Image Generation Provider
 * 
 * Uses Replicate API to generate images via Stable Diffusion.
 * Requires REPLICATE_API_TOKEN environment variable.
 * 
 * Error handling:
 * - Timeout: Returns error after POLL_TIMEOUT_MS (default 90s)
 * - Failed prediction: Returns Replicate's error message
 * - Missing output: Returns clear error about empty response
 */

import type { ImageProvider, ImageGenerationRequest, ImageGenerationResult } from "./types";

const REPLICATE_API_URL = "https://api.replicate.com/v1/predictions";

// Stable Diffusion XL model on Replicate
const SDXL_MODEL = "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";

// Polling configuration
const POLL_INTERVAL_MS = 1000; // 1 second between polls
const POLL_TIMEOUT_MS = 90_000; // 90 seconds max (image gen can be slow)

function getApiToken(): string | null {
  return process.env.REPLICATE_API_TOKEN || null;
}

function getDimensions(size: string): { width: number; height: number } {
  const [w, h] = size.split("x").map(Number);
  return { width: w, height: h };
}

/**
 * Detect MIME type from Content-Type header or URL
 */
function detectMimeType(contentType: string | null, url: string, requestedFormat: string): string {
  // Trust Content-Type header if present
  if (contentType) {
    if (contentType.includes("png")) return "image/png";
    if (contentType.includes("jpeg") || contentType.includes("jpg")) return "image/jpeg";
    if (contentType.includes("webp")) return "image/webp";
  }
  
  // Fall back to URL extension
  if (url.includes(".png")) return "image/png";
  if (url.includes(".jpg") || url.includes(".jpeg")) return "image/jpeg";
  if (url.includes(".webp")) return "image/webp";
  
  // Default to requested format
  return requestedFormat === "png" ? "image/png" : "image/jpeg";
}

export const replicateProvider: ImageProvider = {
  name: "replicate",

  isConfigured(): boolean {
    return !!getApiToken();
  },

  async generate(request: ImageGenerationRequest): Promise<ImageGenerationResult> {
    const token = getApiToken();
    if (!token) {
      return {
        success: false,
        error: "REPLICATE_API_TOKEN not configured",
      };
    }

    try {
      const { width, height } = getDimensions(request.size);

      // Create prediction
      const createResponse = await fetch(REPLICATE_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Prefer": "wait",
        },
        body: JSON.stringify({
          version: SDXL_MODEL.split(":")[1],
          input: {
            prompt: request.prompt,
            width,
            height,
            num_outputs: 1,
            output_format: request.format,
          },
        }),
      });

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        console.error("[Replicate] API error:", errorText);
        return {
          success: false,
          error: `Replicate API error (${createResponse.status})`,
        };
      }

      const prediction = await createResponse.json();

      // If using "Prefer: wait", the response should include output directly
      // Otherwise, we need to poll for completion
      let output = prediction.output;

      if (!output && prediction.status !== "succeeded") {
        // Poll for completion with timeout
        const pollUrl = prediction.urls?.get || `${REPLICATE_API_URL}/${prediction.id}`;
        const startTime = Date.now();

        while (Date.now() - startTime < POLL_TIMEOUT_MS) {
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
          
          const pollResponse = await fetch(pollUrl, {
            headers: { "Authorization": `Bearer ${token}` },
          });

          if (!pollResponse.ok) {
            const pollError = await pollResponse.text().catch(() => "Unknown");
            console.error("[Replicate] Poll error:", pollResponse.status, pollError);
            return { 
              success: false, 
              error: `Failed to poll prediction status (${pollResponse.status})` 
            };
          }

          const pollResult = await pollResponse.json();
          const status = pollResult.status;

          if (status === "succeeded") {
            output = pollResult.output;
            break;
          } else if (status === "failed") {
            const errorMsg = pollResult.error || "Prediction failed without error message";
            console.error("[Replicate] Prediction failed:", errorMsg);
            return { 
              success: false, 
              error: `Image generation failed: ${errorMsg}` 
            };
          } else if (status === "canceled") {
            return { 
              success: false, 
              error: "Image generation was canceled" 
            };
          }
          // status is "starting" or "processing" - continue polling
        }

        if (!output) {
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          return { 
            success: false, 
            error: `Image generation timed out after ${elapsed}s. Try again or use a simpler prompt.` 
          };
        }
      }

      // Output is an array of URLs
      const imageUrl = Array.isArray(output) ? output[0] : output;

      if (!imageUrl || typeof imageUrl !== "string") {
        console.error("[Replicate] Invalid output:", output);
        return { 
          success: false, 
          error: "No image URL in response. The model may have returned an unexpected format." 
        };
      }

      // Fetch the image bytes
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        console.error("[Replicate] Failed to fetch image:", imageResponse.status);
        return { 
          success: false, 
          error: `Failed to fetch generated image (${imageResponse.status})` 
        };
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      
      // Detect actual mime type from response
      const contentType = imageResponse.headers.get("content-type");
      const mimeType = detectMimeType(contentType, imageUrl, request.format);

      return {
        success: true,
        imageBuffer,
        mimeType,
      };
    } catch (error) {
      console.error("[Replicate] Error:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        error: `Replicate provider error: ${message}`,
      };
    }
  },
};
