/**
 * Post Editor Types
 * Comprehensive type definitions for the media editor
 */

// ============== Media Types ==============

export type MediaType = "image" | "video";

export interface MediaAsset {
  id: string;
  type: MediaType;
  file?: File;
  url: string;
  name: string;
  duration?: number; // For video, in seconds
  width: number;
  height: number;
  thumbnail?: string;
  // Trim settings for video
  trimStart?: number;
  trimEnd?: number;
}

// ============== Layer Types ==============

export type LayerType = "text" | "sticker" | "overlay" | "caption";

export interface BaseLayer {
  id: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  zIndex: number;
}

export interface TextLayer extends BaseLayer {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: "normal" | "italic";
  textAlign: "left" | "center" | "right";
  color: string;
  backgroundColor?: string;
  backgroundPadding?: number;
  borderRadius?: number;
  strokeColor?: string;
  strokeWidth?: number;
  shadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
}

export interface StickerLayer extends BaseLayer {
  type: "sticker";
  stickerId: string;
  stickerUrl: string;
}

export interface OverlayLayer extends BaseLayer {
  type: "overlay";
  imageUrl: string;
  blendMode: BlendMode;
}

export interface CaptionLayer extends BaseLayer {
  type: "caption";
  text: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  color: string;
  backgroundColor?: string;
  backgroundPadding?: number;
  position: "top" | "center" | "bottom";
}

export type Layer = TextLayer | StickerLayer | OverlayLayer | CaptionLayer;

// ============== Effect Types ==============

export type BlendMode = "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten";

export interface FilterPreset {
  id: string;
  name: string;
  nameAr: string;
  cssFilter: string;
  thumbnail?: string;
}

export interface EffectPreset {
  id: string;
  name: string;
  nameAr: string;
  type: "vignette" | "blur" | "glow" | "grain" | "sepia";
  intensity: number;
}

export interface AdjustmentSettings {
  brightness: number;    // -100 to 100
  contrast: number;      // -100 to 100
  saturation: number;    // -100 to 100
  temperature: number;   // -100 to 100 (cool to warm)
  sharpen: number;       // 0 to 100
  exposure: number;      // -100 to 100
  highlights: number;    // -100 to 100
  shadows: number;       // -100 to 100
}

// ============== Background Types ==============

export type BackgroundType = "solid" | "gradient" | "blur" | "image";

export interface BackgroundSettings {
  type: BackgroundType;
  color?: string;
  gradient?: {
    type: "linear" | "radial";
    colors: string[];
    angle?: number;
  };
  blurAmount?: number;
  imageUrl?: string;
}

// ============== Shape Mask Types ==============

export type ShapeMaskType = "none" | "rectangle" | "rounded-rectangle" | "circle" | "pill";

export interface ShapeMaskSettings {
  type: ShapeMaskType;
  borderRadius?: number; // For rounded-rectangle
}

// ============== Aspect Ratio Types ==============

export type AspectRatioPreset = "1:1" | "4:5" | "16:9" | "9:16" | "4:3" | "3:4" | "free";

export interface AspectRatioSettings {
  preset: AspectRatioPreset;
  width: number;
  height: number;
}

// ============== Audio Types ==============

export interface AudioTrack {
  id: string;
  file?: File;
  url: string;
  name: string;
  duration: number;
  volume: number;       // 0 to 1
  trimStart: number;
  trimEnd: number;
  fadeIn?: number;      // seconds
  fadeOut?: number;     // seconds
}

// ============== Video Edit Types ==============

export interface VideoEditSettings {
  speed: number;        // 0.25 to 4
  rotation: number;     // 0, 90, 180, 270
  flipHorizontal: boolean;
  flipVertical: boolean;
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// ============== AI Avatar Types ==============

export interface AiAvatarSettings {
  enabled: boolean;
  avatarId?: string;
  avatarUrl?: string;
  style?: "realistic" | "cartoon" | "anime";
}

// ============== Toolbar Types ==============

export type MainToolbarItem =
  | "edit"
  | "audio"
  | "text"
  | "effects"
  | "overlay"
  | "captions"
  | "filters";

export type SecondaryToolbarItem =
  | "background"
  | "aspect"
  | "media"
  | "stickers"
  | "adjust"
  | "shape"
  | "ai-avatar";

export type ToolbarItem = MainToolbarItem | SecondaryToolbarItem;

export interface ToolbarButton {
  id: ToolbarItem;
  icon: string;
  label: string;
  labelAr: string;
}

// ============== History Types ==============

export interface HistoryState {
  layers: Layer[];
  activeLayerId: string | null;
  adjustments: AdjustmentSettings;
  background: BackgroundSettings;
  aspectRatio: AspectRatioSettings;
  shapeMask: ShapeMaskSettings;
  activeFilter: string | null;
  filterIntensity: number;
  activeEffect: string | null;
  effectIntensity: number;
  videoSettings?: VideoEditSettings;
  audioTracks: AudioTrack[];
}

// ============== Export Types ==============

export type ExportFormat = "png" | "jpg" | "mp4" | "gif";

export interface ExportSettings {
  format: ExportFormat;
  quality: number;      // 0 to 1
  width?: number;
  height?: number;
  fps?: number;         // For video/gif
  includeAudio?: boolean;
}

export interface ExportProgress {
  stage: "preparing" | "rendering" | "encoding" | "finalizing";
  progress: number;     // 0 to 100
  message: string;
}

// ============== Editor State ==============

export interface EditorState {
  // Media assets
  mediaAssets: MediaAsset[];
  activeMediaId: string | null;
  
  // Layers
  layers: Layer[];
  activeLayerId: string | null;
  
  // Adjustments
  adjustments: AdjustmentSettings;
  
  // Background
  background: BackgroundSettings;
  
  // Aspect ratio
  aspectRatio: AspectRatioSettings;
  
  // Shape mask
  shapeMask: ShapeMaskSettings;
  
  // Filter
  activeFilter: string | null;
  filterIntensity: number;
  
  // Effects
  activeEffect: string | null;
  effectIntensity: number;
  
  // Video-specific
  videoSettings: VideoEditSettings;
  currentTime: number;
  isPlaying: boolean;
  
  // Audio
  audioTracks: AudioTrack[];
  originalAudioVolume: number;
  
  // AI Avatar
  aiAvatar: AiAvatarSettings;
  
  // UI State
  activePanel: ToolbarItem | null;
  isExporting: boolean;
  exportProgress: ExportProgress | null;
  
  // History
  history: HistoryState[];
  historyIndex: number;
  
  // Canvas dimensions
  canvasWidth: number;
  canvasHeight: number;
  
  // Draft persistence
  draftId: string | null;
  lastSaved: Date | null;
  isDirty: boolean;
}

// ============== Store Actions ==============

export interface EditorActions {
  // Media
  addMediaAsset: (asset: Omit<MediaAsset, "id">) => void;
  removeMediaAsset: (id: string) => void;
  setActiveMedia: (id: string | null) => void;
  reorderMediaAssets: (fromIndex: number, toIndex: number) => void;
  updateMediaAsset: (id: string, updates: Partial<MediaAsset>) => void;
  
  // Layers
  addLayer: (layer: Omit<Layer, "id" | "zIndex">) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<Layer>) => void;
  setActiveLayer: (id: string | null) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  duplicateLayer: (id: string) => void;
  
  // Adjustments
  setAdjustments: (adjustments: Partial<AdjustmentSettings>) => void;
  resetAdjustments: () => void;
  
  // Background
  setBackground: (background: Partial<BackgroundSettings>) => void;
  
  // Aspect ratio
  setAspectRatio: (aspectRatio: AspectRatioSettings) => void;
  
  // Shape mask
  setShapeMask: (shapeMask: ShapeMaskSettings) => void;
  
  // Filters
  setFilter: (filterId: string | null) => void;
  setFilterIntensity: (intensity: number) => void;
  
  // Effects
  setEffect: (effectId: string | null) => void;
  setEffectIntensity: (intensity: number) => void;
  
  // Video
  setVideoSettings: (settings: Partial<VideoEditSettings>) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  
  // Audio
  addAudioTrack: (track: Omit<AudioTrack, "id">) => void;
  removeAudioTrack: (id: string) => void;
  updateAudioTrack: (id: string, updates: Partial<AudioTrack>) => void;
  setOriginalAudioVolume: (volume: number) => void;
  
  // AI Avatar
  setAiAvatar: (settings: Partial<AiAvatarSettings>) => void;
  
  // UI
  setActivePanel: (panel: ToolbarItem | null) => void;
  setExporting: (exporting: boolean) => void;
  setExportProgress: (progress: ExportProgress | null) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Canvas
  setCanvasDimensions: (width: number, height: number) => void;
  
  // Persistence
  saveDraft: () => void;
  loadDraft: () => boolean;
  clearDraft: () => void;
  setDirty: (dirty: boolean) => void;
  
  // Reset
  reset: () => void;
}

// ============== Default Values ==============

export const DEFAULT_ADJUSTMENTS: AdjustmentSettings = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  sharpen: 0,
  exposure: 0,
  highlights: 0,
  shadows: 0,
};

export const DEFAULT_BACKGROUND: BackgroundSettings = {
  type: "solid",
  color: "#000000",
};

export const DEFAULT_ASPECT_RATIO: AspectRatioSettings = {
  preset: "1:1",
  width: 1080,
  height: 1080,
};

export const DEFAULT_SHAPE_MASK: ShapeMaskSettings = {
  type: "none",
};

export const DEFAULT_VIDEO_SETTINGS: VideoEditSettings = {
  speed: 1,
  rotation: 0,
  flipHorizontal: false,
  flipVertical: false,
  crop: { x: 0, y: 0, width: 100, height: 100 },
};

export const DEFAULT_AI_AVATAR: AiAvatarSettings = {
  enabled: false,
};

// ============== Stickers ==============

export interface StickerItem {
  id: string;
  name: string;
  category: string;
  url: string;
}

export const STICKER_CATEGORIES = [
  { id: "emoji", name: "Emoji", nameAr: "الإيموجي" },
  { id: "shapes", name: "Shapes", nameAr: "الأشكال" },
  { id: "arrows", name: "Arrows", nameAr: "الأسهم" },
  { id: "islamic", name: "Islamic", nameAr: "إسلامية" },
] as const;
