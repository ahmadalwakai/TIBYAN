/**
 * FFmpeg Export Module
 * Handles video export with overlays using ffmpeg.wasm
 */

import type { FFmpeg } from "@ffmpeg/ffmpeg";
import type {
  ExportProgress,
  ExportSettings,
  Layer,
  CaptionLayer,
  AudioTrack,
  VideoEditSettings,
  AdjustmentSettings,
} from "./types";

// ============== Types ==============

interface ExportContext {
  ffmpeg: FFmpeg;
  videoUrl: string;
  duration: number;
  trimStart: number;
  trimEnd: number;
  width: number;
  height: number;
  layers: Layer[];
  audioTracks: AudioTrack[];
  originalAudioVolume: number;
  videoSettings: VideoEditSettings;
  adjustments: AdjustmentSettings;
  filterCss: string;
  overlayCanvas: HTMLCanvasElement | null;
  onProgress: (progress: ExportProgress) => void;
}

// ============== FFmpeg Loader ==============

let ffmpegInstance: FFmpeg | null = null;
let isLoaded = false;

export const loadFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpegInstance && isLoaded) {
    return ffmpegInstance;
  }

  // Dynamically import ffmpeg
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { toBlobURL } = await import("@ffmpeg/util");

  ffmpegInstance = new FFmpeg();

  // Load from CDN for CORS headers
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm";

  await ffmpegInstance.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  isLoaded = true;
  return ffmpegInstance;
};

export const isFFmpegLoaded = (): boolean => isLoaded;

// ============== Export Image from Canvas ==============

export const exportImageFromCanvas = async (
  canvas: HTMLCanvasElement,
  settings: ExportSettings
): Promise<Blob> => {
  const format = settings.format === "jpg" ? "image/jpeg" : "image/png";
  const quality = settings.quality;

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to export image"));
        }
      },
      format,
      quality
    );
  });
};

// ============== Export Image from Editor State ==============

export const exportImage = async (
  state: { canvasWidth: number; canvasHeight: number; adjustments: AdjustmentSettings; layers: Layer[] },
  activeMedia: { url: string; type: string }
): Promise<Blob> => {
  // Create a canvas and render the image with all adjustments and layers
  const canvas = document.createElement("canvas");
  canvas.width = state.canvasWidth;
  canvas.height = state.canvasHeight;
  const ctx = canvas.getContext("2d");
  
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }
  
  // Load and draw the base image
  const img = new Image();
  img.crossOrigin = "anonymous";
  
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = activeMedia.url;
  });
  
  // Draw base image
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  // Apply adjustments (simplified)
  const { brightness, contrast, saturation } = state.adjustments;
  if (brightness !== 0 || contrast !== 0 || saturation !== 0) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      // Brightness
      data[i] = Math.min(255, Math.max(0, data[i] + brightness * 2.55));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + brightness * 2.55));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + brightness * 2.55));
      
      // Contrast
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
      data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
      data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  // Draw layers on top
  const overlayCanvas = renderOverlayCanvas(state.layers, canvas.width, canvas.height);
  ctx.drawImage(overlayCanvas, 0, 0);
  
  // Export as PNG
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to export image"));
        }
      },
      "image/png",
      1.0
    );
  });
};

// ============== Export Video ==============

export const exportVideo = async (
  ctx: ExportContext
): Promise<Blob> => {
  const { ffmpeg, onProgress } = ctx;

  onProgress({
    stage: "preparing",
    progress: 0,
    message: "جاري تحضير الفيديو...",
  });

  try {
    // Fetch the video file
    const videoResponse = await fetch(ctx.videoUrl);
    const videoData = await videoResponse.arrayBuffer();
    await ffmpeg.writeFile("input.mp4", new Uint8Array(videoData));

    onProgress({
      stage: "preparing",
      progress: 20,
      message: "جاري تحميل الملفات...",
    });

    // Build filter complex
    const filters: string[] = [];
    const inputs: string[] = ["-i", "input.mp4"];
    let inputIndex = 1;

    // Trim
    const trimDuration = ctx.trimEnd - ctx.trimStart;
    const trimFilter = `trim=start=${ctx.trimStart}:end=${ctx.trimEnd},setpts=PTS-STARTPTS`;
    filters.push(trimFilter);

    // Speed adjustment
    if (ctx.videoSettings.speed !== 1) {
      const pts = 1 / ctx.videoSettings.speed;
      filters.push(`setpts=${pts}*PTS`);
    }

    // Rotation
    if (ctx.videoSettings.rotation !== 0) {
      const rotations = ctx.videoSettings.rotation / 90;
      for (let i = 0; i < rotations; i++) {
        filters.push("transpose=1");
      }
    }

    // Flip
    if (ctx.videoSettings.flipHorizontal) {
      filters.push("hflip");
    }
    if (ctx.videoSettings.flipVertical) {
      filters.push("vflip");
    }

    // Scale to output dimensions
    filters.push(`scale=${ctx.width}:${ctx.height}:force_original_aspect_ratio=decrease`);
    filters.push(`pad=${ctx.width}:${ctx.height}:(ow-iw)/2:(oh-ih)/2:black`);

    // Color adjustments
    const colorFilters: string[] = [];
    if (ctx.adjustments.brightness !== 0) {
      colorFilters.push(`brightness=${ctx.adjustments.brightness / 100}`);
    }
    if (ctx.adjustments.contrast !== 0) {
      colorFilters.push(`contrast=${1 + ctx.adjustments.contrast / 100}`);
    }
    if (ctx.adjustments.saturation !== 0) {
      colorFilters.push(`saturation=${1 + ctx.adjustments.saturation / 100}`);
    }
    if (colorFilters.length > 0) {
      filters.push(`eq=${colorFilters.join(":")}`);
    }

    onProgress({
      stage: "rendering",
      progress: 40,
      message: "جاري معالجة الفيديو...",
    });

    // Handle overlay canvas (text, stickers, etc.)
    if (ctx.overlayCanvas) {
      const overlayBlob = await new Promise<Blob | null>((resolve) => {
        ctx.overlayCanvas!.toBlob(resolve, "image/png");
      });

      if (overlayBlob) {
        const overlayData = await overlayBlob.arrayBuffer();
        await ffmpeg.writeFile("overlay.png", new Uint8Array(overlayData));
        inputs.push("-i", "overlay.png");
        filters.push(`overlay=0:0`);
      }
    }

    // Handle captions (draw text)
    const captions = ctx.layers.filter(
      (l): l is CaptionLayer => l.type === "caption" && l.visible
    );

    for (const caption of captions) {
      const escapedText = caption.text
        .replace(/'/g, "'\\''")
        .replace(/:/g, "\\:");
      
      const y = caption.position === "top" 
        ? 50 
        : caption.position === "bottom" 
        ? ctx.height - 80 
        : ctx.height / 2;

      filters.push(
        `drawtext=text='${escapedText}':fontsize=${caption.fontSize}:fontcolor=${caption.color}:x=(w-text_w)/2:y=${y}:enable='between(t,${caption.startTime},${caption.endTime})'`
      );
    }

    // Handle audio
    let audioFilters: string[] = [];
    
    // Original audio volume
    if (ctx.originalAudioVolume !== 1) {
      audioFilters.push(`volume=${ctx.originalAudioVolume}`);
    }

    // Add external audio tracks
    for (const track of ctx.audioTracks) {
      if (track.url) {
        const audioResponse = await fetch(track.url);
        const audioData = await audioResponse.arrayBuffer();
        await ffmpeg.writeFile(`audio_${track.id}.mp3`, new Uint8Array(audioData));
        inputs.push("-i", `audio_${track.id}.mp3`);
        inputIndex++;
      }
    }

    onProgress({
      stage: "encoding",
      progress: 60,
      message: "جاري ترميز الفيديو...",
    });

    // Build ffmpeg command
    const filterComplex = filters.join(",");
    const args = [
      ...inputs,
      "-filter_complex",
      `[0:v]${filterComplex}[outv]`,
      "-map",
      "[outv]",
    ];

    // Audio handling
    if (ctx.audioTracks.length > 0 || ctx.originalAudioVolume !== 1) {
      const audioMixParts: string[] = [];
      
      if (ctx.originalAudioVolume > 0) {
        audioMixParts.push(`[0:a]volume=${ctx.originalAudioVolume}[a0]`);
      }

      ctx.audioTracks.forEach((track, i) => {
        audioMixParts.push(
          `[${i + 1}:a]volume=${track.volume}[a${i + 1}]`
        );
      });

      if (audioMixParts.length > 0) {
        // Mix all audio
        const mixInputs = audioMixParts.map((_, i) => `[a${i}]`).join("");
        args.push("-filter_complex", `${audioMixParts.join(";")}; ${mixInputs}amix=inputs=${audioMixParts.length}[outa]`);
        args.push("-map", "[outa]");
      } else {
        args.push("-map", "0:a?");
      }
    } else {
      args.push("-map", "0:a?");
    }

    // Output settings
    args.push(
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "23",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-movflags",
      "+faststart",
      "-y",
      "output.mp4"
    );

    // Set up progress callback
    ffmpeg.on("progress", ({ progress }) => {
      onProgress({
        stage: "encoding",
        progress: 60 + progress * 30,
        message: `جاري الترميز... ${Math.round(progress * 100)}%`,
      });
    });

    // Execute
    await ffmpeg.exec(args);

    onProgress({
      stage: "finalizing",
      progress: 95,
      message: "جاري إنهاء التصدير...",
    });

    // Read output
    const outputData = await ffmpeg.readFile("output.mp4");
    
    // Clean up
    await ffmpeg.deleteFile("input.mp4");
    await ffmpeg.deleteFile("output.mp4");

    onProgress({
      stage: "finalizing",
      progress: 100,
      message: "تم التصدير بنجاح!",
    });

    // Cast to correct type for Blob constructor
    const outputBuffer = outputData instanceof Uint8Array ? outputData.buffer : outputData;
    return new Blob([new Uint8Array(outputBuffer as ArrayBuffer)], { type: "video/mp4" });
  } catch (error) {
    console.error("FFmpeg export error:", error);
    throw error;
  }
};

// ============== Simple Video Export (from Editor State) ==============

export const exportVideoSimple = async (
  state: {
    mediaAssets: { id: string; type: string; url: string; duration?: number }[];
    activeMediaId: string | null;
    videoSettings: VideoEditSettings;
    canvasWidth: number;
    canvasHeight: number;
  }
): Promise<Blob> => {
  // Get active media
  const activeMedia = state.mediaAssets.find(m => m.id === state.activeMediaId);
  if (!activeMedia || activeMedia.type !== "video") {
    throw new Error("No active video to export");
  }

  const ffmpeg = await loadFFmpeg();

  // Fetch video
  const response = await fetch(activeMedia.url);
  const videoData = await response.arrayBuffer();
  await ffmpeg.writeFile("input.mp4", new Uint8Array(videoData));

  // Build filter chain
  const filters: string[] = [];

  // Speed adjustment  
  if (state.videoSettings.speed !== 1) {
    const pts = 1 / state.videoSettings.speed;
    filters.push(`setpts=${pts}*PTS`);
  }

  // Rotation
  if (state.videoSettings.rotation !== 0) {
    const rotations = state.videoSettings.rotation / 90;
    for (let i = 0; i < rotations; i++) {
      filters.push("transpose=1");
    }
  }

  // Flip
  if (state.videoSettings.flipHorizontal) {
    filters.push("hflip");
  }
  if (state.videoSettings.flipVertical) {
    filters.push("vflip");
  }

  // Scale
  filters.push(`scale=${state.canvasWidth}:${state.canvasHeight}:force_original_aspect_ratio=decrease`);
  filters.push(`pad=${state.canvasWidth}:${state.canvasHeight}:(ow-iw)/2:(oh-ih)/2:black`);

  const filterString = filters.length > 0 ? filters.join(",") : "null";

  // Execute
  const args = [
    "-i",
    "input.mp4",
    "-vf",
    filterString,
    "-c:v",
    "libx264",
    "-preset",
    "fast",
    "-crf",
    "23",
    "-c:a",
    "copy",
    "-y",
    "output.mp4",
  ];

  await ffmpeg.exec(args);

  const output = await ffmpeg.readFile("output.mp4");

  // Cleanup
  await ffmpeg.deleteFile("input.mp4");
  await ffmpeg.deleteFile("output.mp4");

  // Cast to correct type for Blob constructor
  const outputBuffer = output instanceof Uint8Array ? output.buffer : output;
  return new Blob([new Uint8Array(outputBuffer as ArrayBuffer)], { type: "video/mp4" });
};

// ============== Render Overlay Canvas ==============

export const renderOverlayCanvas = (
  layers: Layer[],
  width: number,
  height: number,
  currentTime: number = 0
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Sort layers by zIndex
  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

  for (const layer of sortedLayers) {
    if (!layer.visible) continue;

    // Skip captions not in time range
    if (layer.type === "caption") {
      const caption = layer as CaptionLayer;
      if (currentTime < caption.startTime || currentTime > caption.endTime) {
        continue;
      }
    }

    ctx.save();
    ctx.globalAlpha = layer.opacity;
    ctx.translate(layer.x + layer.width / 2, layer.y + layer.height / 2);
    ctx.rotate((layer.rotation * Math.PI) / 180);

    switch (layer.type) {
      case "text": {
        const textLayer = layer as import("./types").TextLayer;
        ctx.font = `${textLayer.fontStyle} ${textLayer.fontWeight} ${textLayer.fontSize}px ${textLayer.fontFamily}`;
        ctx.fillStyle = textLayer.color;
        ctx.textAlign = textLayer.textAlign as CanvasTextAlign;
        ctx.textBaseline = "middle";

        if (textLayer.backgroundColor) {
          const metrics = ctx.measureText(textLayer.text);
          const padding = textLayer.backgroundPadding || 8;
          const bgWidth = metrics.width + padding * 2;
          const bgHeight = textLayer.fontSize + padding * 2;

          ctx.fillStyle = textLayer.backgroundColor;
          if (textLayer.borderRadius) {
            roundRect(
              ctx,
              -bgWidth / 2,
              -bgHeight / 2,
              bgWidth,
              bgHeight,
              textLayer.borderRadius
            );
          } else {
            ctx.fillRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight);
          }

          ctx.fillStyle = textLayer.color;
        }

        ctx.fillText(textLayer.text, 0, 0);
        break;
      }

      case "caption": {
        const captionLayer = layer as CaptionLayer;
        ctx.font = `${captionLayer.fontWeight} ${captionLayer.fontSize}px ${captionLayer.fontFamily}`;
        ctx.fillStyle = captionLayer.color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (captionLayer.backgroundColor) {
          const metrics = ctx.measureText(captionLayer.text);
          const padding = captionLayer.backgroundPadding || 12;
          const bgWidth = metrics.width + padding * 2;
          const bgHeight = captionLayer.fontSize + padding * 2;

          ctx.fillStyle = captionLayer.backgroundColor;
          roundRect(ctx, -bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 8);
          ctx.fillStyle = captionLayer.color;
        }

        ctx.fillText(captionLayer.text, 0, 0);
        break;
      }

      // Stickers and overlays would need async image loading
      // For simplicity, they should be pre-loaded in a real implementation
    }

    ctx.restore();
  }

  return canvas;
};

// Helper for rounded rectangles
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

// ============== Cleanup ==============

export const unloadFFmpeg = (): void => {
  if (ffmpegInstance) {
    ffmpegInstance = null;
    isLoaded = false;
  }
};
