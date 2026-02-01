/**
 * Post Editor Zustand Store
 * Manages all editor state with undo/redo and persistence
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import {
  EditorState,
  EditorActions,
  MediaAsset,
  Layer,
  TextLayer,
  StickerLayer,
  OverlayLayer,
  CaptionLayer,
  AdjustmentSettings,
  BackgroundSettings,
  AspectRatioSettings,
  ShapeMaskSettings,
  VideoEditSettings,
  AudioTrack,
  AiAvatarSettings,
  HistoryState,
  ExportProgress,
  ToolbarItem,
  DEFAULT_ADJUSTMENTS,
  DEFAULT_BACKGROUND,
  DEFAULT_ASPECT_RATIO,
  DEFAULT_SHAPE_MASK,
  DEFAULT_VIDEO_SETTINGS,
  DEFAULT_AI_AVATAR,
} from "./types";

// ============== Utility Functions ==============

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const DRAFT_KEY = "tibyan_post_editor_draft";
const MAX_HISTORY = 20;

// ============== Initial State ==============

const getInitialState = (): EditorState => ({
  // Media
  mediaAssets: [],
  activeMediaId: null,

  // Layers
  layers: [],
  activeLayerId: null,

  // Adjustments
  adjustments: { ...DEFAULT_ADJUSTMENTS },

  // Background
  background: { ...DEFAULT_BACKGROUND },

  // Aspect ratio
  aspectRatio: { ...DEFAULT_ASPECT_RATIO },

  // Shape mask
  shapeMask: { ...DEFAULT_SHAPE_MASK },

  // Filters
  activeFilter: null,
  filterIntensity: 100,

  // Effects
  activeEffect: null,
  effectIntensity: 50,

  // Video
  videoSettings: { ...DEFAULT_VIDEO_SETTINGS },
  currentTime: 0,
  isPlaying: false,

  // Audio
  audioTracks: [],
  originalAudioVolume: 1,

  // AI Avatar
  aiAvatar: { ...DEFAULT_AI_AVATAR },

  // UI
  activePanel: null,
  isExporting: false,
  exportProgress: null,

  // History
  history: [],
  historyIndex: -1,

  // Canvas
  canvasWidth: 1080,
  canvasHeight: 1080,

  // Draft
  draftId: null,
  lastSaved: null,
  isDirty: false,
});

// ============== Create History State ==============

const createHistoryState = (state: EditorState): HistoryState => ({
  layers: JSON.parse(JSON.stringify(state.layers)),
  activeLayerId: state.activeLayerId,
  adjustments: { ...state.adjustments },
  background: { ...state.background },
  aspectRatio: { ...state.aspectRatio },
  shapeMask: { ...state.shapeMask },
  activeFilter: state.activeFilter,
  filterIntensity: state.filterIntensity,
  activeEffect: state.activeEffect,
  effectIntensity: state.effectIntensity,
  videoSettings: state.videoSettings ? { ...state.videoSettings } : undefined,
  audioTracks: JSON.parse(JSON.stringify(state.audioTracks)),
});

// ============== Restore from History State ==============

const restoreFromHistory = (historyState: HistoryState): Partial<EditorState> => ({
  layers: JSON.parse(JSON.stringify(historyState.layers)),
  activeLayerId: historyState.activeLayerId,
  adjustments: { ...historyState.adjustments },
  background: { ...historyState.background },
  aspectRatio: { ...historyState.aspectRatio },
  shapeMask: { ...historyState.shapeMask },
  activeFilter: historyState.activeFilter,
  filterIntensity: historyState.filterIntensity,
  activeEffect: historyState.activeEffect,
  effectIntensity: historyState.effectIntensity,
  videoSettings: historyState.videoSettings
    ? { ...historyState.videoSettings }
    : DEFAULT_VIDEO_SETTINGS,
  audioTracks: JSON.parse(JSON.stringify(historyState.audioTracks)),
});

// ============== Store Type ==============

export type EditorStore = EditorState & EditorActions;

// ============== Create Store ==============

export const useEditorStore = create<EditorStore>()(
  subscribeWithSelector((set, get) => ({
    ...getInitialState(),

    // ============== Media Actions ==============

    addMediaAsset: (asset) => {
      const newAsset: MediaAsset = {
        ...asset,
        id: generateId(),
      };
      set((state) => ({
        mediaAssets: [...state.mediaAssets, newAsset],
        activeMediaId: newAsset.id,
        isDirty: true,
      }));
      get().saveToHistory();
    },

    removeMediaAsset: (id) => {
      set((state) => {
        const newAssets = state.mediaAssets.filter((a) => a.id !== id);
        const newActiveId =
          state.activeMediaId === id
            ? newAssets.length > 0
              ? newAssets[0].id
              : null
            : state.activeMediaId;
        return {
          mediaAssets: newAssets,
          activeMediaId: newActiveId,
          isDirty: true,
        };
      });
      get().saveToHistory();
    },

    setActiveMedia: (id) => {
      set({ activeMediaId: id });
    },

    reorderMediaAssets: (fromIndex, toIndex) => {
      set((state) => {
        const newAssets = [...state.mediaAssets];
        const [removed] = newAssets.splice(fromIndex, 1);
        newAssets.splice(toIndex, 0, removed);
        return { mediaAssets: newAssets, isDirty: true };
      });
      get().saveToHistory();
    },

    updateMediaAsset: (id, updates) => {
      set((state) => ({
        mediaAssets: state.mediaAssets.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
        isDirty: true,
      }));
      get().saveToHistory();
    },

    // ============== Layer Actions ==============

    addLayer: (layer) => {
      const state = get();
      const maxZIndex = Math.max(0, ...state.layers.map((l) => l.zIndex));
      const newLayer: Layer = {
        ...layer,
        id: generateId(),
        zIndex: maxZIndex + 1,
      } as Layer;
      set((state) => ({
        layers: [...state.layers, newLayer],
        activeLayerId: newLayer.id,
        isDirty: true,
      }));
      get().saveToHistory();
    },

    removeLayer: (id) => {
      set((state) => {
        const newLayers = state.layers.filter((l) => l.id !== id);
        const newActiveId =
          state.activeLayerId === id
            ? newLayers.length > 0
              ? newLayers[newLayers.length - 1].id
              : null
            : state.activeLayerId;
        return {
          layers: newLayers,
          activeLayerId: newActiveId,
          isDirty: true,
        };
      });
      get().saveToHistory();
    },

    updateLayer: (id, updates) => {
      set((state) => ({
        layers: state.layers.map((l) =>
          l.id === id ? ({ ...l, ...updates } as Layer) : l
        ),
        isDirty: true,
      }));
    },

    setActiveLayer: (id) => {
      set({ activeLayerId: id });
    },

    reorderLayers: (fromIndex, toIndex) => {
      set((state) => {
        const sortedLayers = [...state.layers].sort(
          (a, b) => a.zIndex - b.zIndex
        );
        const [removed] = sortedLayers.splice(fromIndex, 1);
        sortedLayers.splice(toIndex, 0, removed);
        // Reassign z-indices
        const updatedLayers = sortedLayers.map((layer, index) => ({
          ...layer,
          zIndex: index,
        }));
        return { layers: updatedLayers as Layer[], isDirty: true };
      });
      get().saveToHistory();
    },

    duplicateLayer: (id) => {
      const state = get();
      const layer = state.layers.find((l) => l.id === id);
      if (!layer) return;

      const maxZIndex = Math.max(0, ...state.layers.map((l) => l.zIndex));
      const duplicated: Layer = {
        ...layer,
        id: generateId(),
        x: layer.x + 20,
        y: layer.y + 20,
        zIndex: maxZIndex + 1,
      } as Layer;

      set((state) => ({
        layers: [...state.layers, duplicated],
        activeLayerId: duplicated.id,
        isDirty: true,
      }));
      get().saveToHistory();
    },

    // ============== Adjustment Actions ==============

    setAdjustments: (adjustments) => {
      set((state) => ({
        adjustments: { ...state.adjustments, ...adjustments },
        isDirty: true,
      }));
    },

    resetAdjustments: () => {
      set({
        adjustments: { ...DEFAULT_ADJUSTMENTS },
        isDirty: true,
      });
      get().saveToHistory();
    },

    // ============== Background Actions ==============

    setBackground: (background) => {
      set((state) => ({
        background: { ...state.background, ...background },
        isDirty: true,
      }));
      get().saveToHistory();
    },

    // ============== Aspect Ratio Actions ==============

    setAspectRatio: (aspectRatio) => {
      set({ aspectRatio, isDirty: true });
      get().saveToHistory();
    },

    // ============== Shape Mask Actions ==============

    setShapeMask: (shapeMask) => {
      set({ shapeMask, isDirty: true });
      get().saveToHistory();
    },

    // ============== Filter Actions ==============

    setFilter: (filterId) => {
      set({ activeFilter: filterId, isDirty: true });
      get().saveToHistory();
    },

    setFilterIntensity: (intensity) => {
      set({ filterIntensity: intensity, isDirty: true });
    },

    // ============== Effect Actions ==============

    setEffect: (effectId) => {
      set({ activeEffect: effectId, isDirty: true });
      get().saveToHistory();
    },

    setEffectIntensity: (intensity) => {
      set({ effectIntensity: intensity, isDirty: true });
    },

    // ============== Video Actions ==============

    setVideoSettings: (settings) => {
      set((state) => ({
        videoSettings: { ...state.videoSettings, ...settings },
        isDirty: true,
      }));
    },

    setCurrentTime: (time) => {
      set({ currentTime: time });
    },

    setIsPlaying: (playing) => {
      set({ isPlaying: playing });
    },

    // ============== Audio Actions ==============

    addAudioTrack: (track) => {
      const newTrack: AudioTrack = {
        ...track,
        id: generateId(),
      };
      set((state) => ({
        audioTracks: [...state.audioTracks, newTrack],
        isDirty: true,
      }));
      get().saveToHistory();
    },

    removeAudioTrack: (id) => {
      set((state) => ({
        audioTracks: state.audioTracks.filter((t) => t.id !== id),
        isDirty: true,
      }));
      get().saveToHistory();
    },

    updateAudioTrack: (id, updates) => {
      set((state) => ({
        audioTracks: state.audioTracks.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
        isDirty: true,
      }));
    },

    setOriginalAudioVolume: (volume) => {
      set({ originalAudioVolume: volume, isDirty: true });
    },

    // ============== AI Avatar Actions ==============

    setAiAvatar: (settings) => {
      set((state) => ({
        aiAvatar: { ...state.aiAvatar, ...settings },
        isDirty: true,
      }));
      get().saveToHistory();
    },

    // ============== UI Actions ==============

    setActivePanel: (panel) => {
      set((state) => ({
        activePanel: state.activePanel === panel ? null : panel,
      }));
    },

    setExporting: (exporting) => {
      set({ isExporting: exporting });
    },

    setExportProgress: (progress) => {
      set({ exportProgress: progress });
    },

    // ============== History Actions ==============

    saveToHistory: () => {
      const state = get();
      const historyState = createHistoryState(state);

      // Remove any future history if we're not at the end
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(historyState);

      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }

      set({
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
    },

    undo: () => {
      const state = get();
      if (state.historyIndex <= 0) return;

      const newIndex = state.historyIndex - 1;
      const historyState = state.history[newIndex];

      set({
        ...restoreFromHistory(historyState),
        historyIndex: newIndex,
        isDirty: true,
      });
    },

    redo: () => {
      const state = get();
      if (state.historyIndex >= state.history.length - 1) return;

      const newIndex = state.historyIndex + 1;
      const historyState = state.history[newIndex];

      set({
        ...restoreFromHistory(historyState),
        historyIndex: newIndex,
        isDirty: true,
      });
    },

    canUndo: () => {
      return get().historyIndex > 0;
    },

    canRedo: () => {
      const state = get();
      return state.historyIndex < state.history.length - 1;
    },

    // ============== Canvas Actions ==============

    setCanvasDimensions: (width, height) => {
      set({ canvasWidth: width, canvasHeight: height });
    },

    // ============== Persistence Actions ==============

    saveDraft: () => {
      const state = get();
      const draft = {
        mediaAssets: state.mediaAssets.map((a) => ({
          ...a,
          file: undefined, // Can't serialize File objects
        })),
        layers: state.layers,
        adjustments: state.adjustments,
        background: state.background,
        aspectRatio: state.aspectRatio,
        shapeMask: state.shapeMask,
        activeFilter: state.activeFilter,
        filterIntensity: state.filterIntensity,
        activeEffect: state.activeEffect,
        effectIntensity: state.effectIntensity,
        videoSettings: state.videoSettings,
        audioTracks: state.audioTracks.map((t) => ({
          ...t,
          file: undefined,
        })),
        aiAvatar: state.aiAvatar,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
      };

      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        set({
          lastSaved: new Date(),
          isDirty: false,
          draftId: DRAFT_KEY,
        });
      } catch (error) {
        console.error("Failed to save draft:", error);
      }
    },

    loadDraft: () => {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (!saved) return false;

        const draft = JSON.parse(saved);
        set({
          mediaAssets: draft.mediaAssets || [],
          layers: draft.layers || [],
          adjustments: draft.adjustments || { ...DEFAULT_ADJUSTMENTS },
          background: draft.background || { ...DEFAULT_BACKGROUND },
          aspectRatio: draft.aspectRatio || { ...DEFAULT_ASPECT_RATIO },
          shapeMask: draft.shapeMask || { ...DEFAULT_SHAPE_MASK },
          activeFilter: draft.activeFilter || null,
          filterIntensity: draft.filterIntensity ?? 100,
          activeEffect: draft.activeEffect || null,
          effectIntensity: draft.effectIntensity ?? 50,
          videoSettings: draft.videoSettings || { ...DEFAULT_VIDEO_SETTINGS },
          audioTracks: draft.audioTracks || [],
          aiAvatar: draft.aiAvatar || { ...DEFAULT_AI_AVATAR },
          canvasWidth: draft.canvasWidth || 1080,
          canvasHeight: draft.canvasHeight || 1080,
          draftId: DRAFT_KEY,
          isDirty: false,
        });

        // Initialize history
        get().saveToHistory();
        return true;
      } catch (error) {
        console.error("Failed to load draft:", error);
        return false;
      }
    },

    clearDraft: () => {
      try {
        localStorage.removeItem(DRAFT_KEY);
        set({ draftId: null, lastSaved: null });
      } catch (error) {
        console.error("Failed to clear draft:", error);
      }
    },

    setDirty: (dirty) => {
      set({ isDirty: dirty });
    },

    // ============== Reset ==============

    reset: () => {
      set(getInitialState());
    },
  }))
);

// ============== Selectors ==============

export const selectActiveMedia = (state: EditorStore): MediaAsset | null => {
  return state.mediaAssets.find((a) => a.id === state.activeMediaId) || null;
};

export const selectActiveLayer = (state: EditorStore): Layer | null => {
  return state.layers.find((l) => l.id === state.activeLayerId) || null;
};

export const selectSortedLayers = (state: EditorStore): Layer[] => {
  return [...state.layers].sort((a, b) => a.zIndex - b.zIndex);
};

export const selectTextLayers = (state: EditorStore): TextLayer[] => {
  return state.layers.filter((l): l is TextLayer => l.type === "text");
};

export const selectStickerLayers = (state: EditorStore): StickerLayer[] => {
  return state.layers.filter((l): l is StickerLayer => l.type === "sticker");
};

export const selectOverlayLayers = (state: EditorStore): OverlayLayer[] => {
  return state.layers.filter((l): l is OverlayLayer => l.type === "overlay");
};

export const selectCaptionLayers = (state: EditorStore): CaptionLayer[] => {
  return state.layers.filter((l): l is CaptionLayer => l.type === "caption");
};

export const selectVisibleCaptions = (state: EditorStore): CaptionLayer[] => {
  return selectCaptionLayers(state).filter(
    (c) =>
      c.visible &&
      state.currentTime >= c.startTime &&
      state.currentTime <= c.endTime
  );
};

export const selectIsVideoMode = (state: EditorStore): boolean => {
  const activeMedia = selectActiveMedia(state);
  return activeMedia?.type === "video";
};

export const selectHasMedia = (state: EditorStore): boolean => {
  return state.mediaAssets.length > 0;
};

export const selectCssFilters = (state: EditorStore): string => {
  const { adjustments, activeFilter, filterIntensity } = state;
  const filters: string[] = [];

  // Base adjustments
  if (adjustments.brightness !== 0) {
    filters.push(`brightness(${1 + adjustments.brightness / 100})`);
  }
  if (adjustments.contrast !== 0) {
    filters.push(`contrast(${1 + adjustments.contrast / 100})`);
  }
  if (adjustments.saturation !== 0) {
    filters.push(`saturate(${1 + adjustments.saturation / 100})`);
  }

  // Temperature is simulated with sepia + hue-rotate
  if (adjustments.temperature > 0) {
    filters.push(`sepia(${adjustments.temperature / 200})`);
  } else if (adjustments.temperature < 0) {
    filters.push(`hue-rotate(${adjustments.temperature}deg)`);
  }

  return filters.join(" ");
};
