/**
 * Editor Utility Functions
 * Helper functions for the post editor
 */

import { AspectRatioPreset, AspectRatioSettings, FilterPreset, EffectPreset, StickerItem } from "./types";

// ============== ID Generation ==============

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// ============== Color Utilities ==============

export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
};

export const getContrastColor = (hex: string): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#000000";
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
};

// ============== Aspect Ratio Utilities ==============

export const ASPECT_RATIOS: Record<AspectRatioPreset, { width: number; height: number; label: string; labelAr: string }> = {
  "1:1": { width: 1, height: 1, label: "Square", labelAr: "مربع" },
  "4:5": { width: 4, height: 5, label: "Portrait", labelAr: "عمودي" },
  "16:9": { width: 16, height: 9, label: "Landscape", labelAr: "أفقي" },
  "9:16": { width: 9, height: 16, label: "Story", labelAr: "قصة" },
  "4:3": { width: 4, height: 3, label: "Standard", labelAr: "قياسي" },
  "3:4": { width: 3, height: 4, label: "Portrait 3:4", labelAr: "عمودي 3:4" },
  "free": { width: 0, height: 0, label: "Free", labelAr: "حر" },
};

export const getAspectRatioDimensions = (
  preset: AspectRatioPreset,
  baseSize: number = 1080
): AspectRatioSettings => {
  const ratio = ASPECT_RATIOS[preset];
  if (preset === "free" || ratio.width === 0) {
    return { preset, width: baseSize, height: baseSize };
  }
  
  const aspectRatio = ratio.width / ratio.height;
  let width: number;
  let height: number;
  
  if (aspectRatio >= 1) {
    width = baseSize;
    height = Math.round(baseSize / aspectRatio);
  } else {
    height = baseSize;
    width = Math.round(baseSize * aspectRatio);
  }
  
  return { preset, width, height };
};

// ============== Time Utilities ==============

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`;
};

export const parseTime = (timeString: string): number => {
  const parts = timeString.split(":");
  if (parts.length !== 2) return 0;
  const [mins, secsMs] = parts;
  const [secs, ms = "0"] = secsMs.split(".");
  return parseInt(mins) * 60 + parseInt(secs) + parseInt(ms) / 100;
};

// ============== File Utilities ==============

export const getFileExtension = (filename: string): string => {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2).toLowerCase();
};

export const isImageFile = (file: File): boolean => {
  return file.type.startsWith("image/");
};

export const isVideoFile = (file: File): boolean => {
  return file.type.startsWith("video/");
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const createObjectUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

export const revokeObjectUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};

// ============== Image Utilities ==============

export const getImageDimensions = (
  src: string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = src;
  });
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// ============== Video Utilities ==============

export const getVideoDimensions = (
  src: string
): Promise<{ width: number; height: number; duration: number }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: video.duration,
      });
    };
    video.onerror = reject;
    video.src = src;
  });
};

export const captureVideoFrame = (
  video: HTMLVideoElement,
  time: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const seekHandler = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }
        ctx.drawImage(video, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
        video.removeEventListener("seeked", seekHandler);
      } catch (err) {
        reject(err);
      }
    };
    video.addEventListener("seeked", seekHandler);
    video.currentTime = time;
  });
};

// ============== Canvas Utilities ==============

export const downloadDataUrl = (dataUrl: string, filename: string): void => {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  downloadDataUrl(url, filename);
  URL.revokeObjectURL(url);
};

// ============== Filter Presets ==============

export const FILTER_PRESETS: FilterPreset[] = [
  { id: "none", name: "None", nameAr: "بدون", cssFilter: "" },
  { id: "vivid", name: "Vivid", nameAr: "حيوي", cssFilter: "saturate(1.4) contrast(1.1)" },
  { id: "warm", name: "Warm", nameAr: "دافئ", cssFilter: "sepia(0.3) saturate(1.2)" },
  { id: "cool", name: "Cool", nameAr: "بارد", cssFilter: "hue-rotate(-15deg) saturate(0.9)" },
  { id: "vintage", name: "Vintage", nameAr: "كلاسيكي", cssFilter: "sepia(0.5) contrast(0.9) brightness(1.1)" },
  { id: "dramatic", name: "Dramatic", nameAr: "درامي", cssFilter: "contrast(1.3) saturate(0.8)" },
  { id: "faded", name: "Faded", nameAr: "باهت", cssFilter: "contrast(0.9) brightness(1.1) saturate(0.8)" },
  { id: "mono", name: "Mono", nameAr: "أحادي", cssFilter: "grayscale(1)" },
  { id: "noir", name: "Noir", nameAr: "نوار", cssFilter: "grayscale(1) contrast(1.4)" },
  { id: "sepia", name: "Sepia", nameAr: "بني", cssFilter: "sepia(0.8)" },
  { id: "chrome", name: "Chrome", nameAr: "كروم", cssFilter: "saturate(1.5) contrast(1.2)" },
  { id: "fade", name: "Fade", nameAr: "خافت", cssFilter: "brightness(1.2) saturate(0.7)" },
];

// ============== Effect Presets ==============

export const EFFECT_PRESETS: EffectPreset[] = [
  { id: "none", name: "None", nameAr: "بدون", type: "vignette", intensity: 0 },
  { id: "vignette", name: "Vignette", nameAr: "إطار داكن", type: "vignette", intensity: 50 },
  { id: "blur", name: "Blur", nameAr: "ضبابي", type: "blur", intensity: 30 },
  { id: "glow", name: "Glow", nameAr: "توهج", type: "glow", intensity: 50 },
  { id: "grain", name: "Grain", nameAr: "حبيبات", type: "grain", intensity: 30 },
  { id: "sepia", name: "Sepia Effect", nameAr: "تأثير بني", type: "sepia", intensity: 50 },
];

// ============== Built-in Stickers ==============

export const BUILT_IN_STICKERS: StickerItem[] = [
  // Emoji
  { id: "emoji-heart", name: "Heart", category: "emoji", url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='80' font-size='80'%3E❤️%3C/text%3E%3C/svg%3E" },
  { id: "emoji-star", name: "Star", category: "emoji", url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='80' font-size='80'%3E⭐%3C/text%3E%3C/svg%3E" },
  { id: "emoji-fire", name: "Fire", category: "emoji", url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='80' font-size='80'%3E🔥%3C/text%3E%3C/svg%3E" },
  { id: "emoji-sparkles", name: "Sparkles", category: "emoji", url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='80' font-size='80'%3E✨%3C/text%3E%3C/svg%3E" },
  { id: "emoji-thumbsup", name: "Thumbs Up", category: "emoji", url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='80' font-size='80'%3E👍%3C/text%3E%3C/svg%3E" },
  { id: "emoji-100", name: "100", category: "emoji", url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='80' font-size='80'%3E💯%3C/text%3E%3C/svg%3E" },
  
  // Shapes
  { id: "shape-circle", name: "Circle", category: "shapes", url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23FFD700'/%3E%3C/svg%3E" },
  { id: "shape-square", name: "Square", category: "shapes", url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect x='5' y='5' width='90' height='90' fill='%234169E1'/%3E%3C/svg%3E" },
  { id: "shape-triangle", name: "Triangle", category: "shapes", url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpolygon points='50,5 95,95 5,95' fill='%23FF6347'/%3E%3C/svg%3E" },
  { id: "shape-star", name: "Star Shape", category: "shapes", url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpolygon points='50,5 61,40 98,40 68,62 79,97 50,75 21,97 32,62 2,40 39,40' fill='%23FFD700'/%3E%3C/svg%3E" },
  
  // Arrows
  { id: "arrow-right", name: "Arrow Right", category: "arrows", url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M10 45h60v-20l25 25-25 25v-20h-60z' fill='%23FF4500'/%3E%3C/svg%3E" },
  { id: "arrow-left", name: "Arrow Left", category: "arrows", url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M90 45h-60v-20l-25 25 25 25v-20h60z' fill='%23FF4500'/%3E%3C/svg%3E" },
  { id: "arrow-up", name: "Arrow Up", category: "arrows", url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M45 90v-60h-20l25-25 25 25h-20v60z' fill='%2332CD32'/%3E%3C/svg%3E" },
  { id: "arrow-down", name: "Arrow Down", category: "arrows", url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M45 10v60h-20l25 25 25-25h-20v-60z' fill='%2332CD32'/%3E%3C/svg%3E" },
  
  // Islamic
  { id: "islamic-crescent", name: "Crescent", category: "islamic", url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M70 10c-24 0-44 20-44 44s20 44 44 44c-8 0-15-2-22-6 14-8 24-24 24-42s-10-34-24-42c7-4 14-6 22-6z' fill='%23FFD700'/%3E%3Ccircle cx='75' cy='25' r='8' fill='%23FFD700'/%3E%3C/svg%3E" },
  { id: "islamic-star8", name: "8-Point Star", category: "islamic", url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpolygon points='50,0 61,35 100,35 68,57 79,92 50,70 21,92 32,57 0,35 39,35' fill='%230B1F3A'/%3E%3C/svg%3E" },
  { id: "islamic-bismillah", name: "Bismillah", category: "islamic", url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'%3E%3Ctext x='100' y='45' text-anchor='middle' font-family='serif' font-size='24' fill='%230B1F3A'%3Eبِسْمِ اللَّهِ%3C/text%3E%3C/svg%3E" },
];

// ============== Font Options ==============

export const FONT_OPTIONS = [
  { value: "IBM Plex Sans Arabic", label: "IBM Plex Sans Arabic", labelAr: "IBM Plex عربي" },
  { value: "Arial", label: "Arial", labelAr: "Arial" },
  { value: "Tahoma", label: "Tahoma", labelAr: "تاهوما" },
  { value: "Georgia", label: "Georgia", labelAr: "Georgia" },
  { value: "Times New Roman", label: "Times New Roman", labelAr: "Times New Roman" },
  { value: "Courier New", label: "Courier New", labelAr: "Courier New" },
  { value: "Verdana", label: "Verdana", labelAr: "Verdana" },
];

// ============== Clamp Utilities ==============

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

// ============== Debounce ==============

export const debounce = <T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

// ============== Throttle ==============

export const throttle = <T extends (...args: Parameters<T>) => void>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};
