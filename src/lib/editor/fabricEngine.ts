/**
 * Fabric.js Canvas Engine
 * Handles image editing with layers using Fabric.js
 */

import type { Canvas, FabricObject, FabricImage, FabricText, Rect, Circle, Group } from "fabric";
import type {
  Layer,
  TextLayer,
  StickerLayer,
  OverlayLayer,
  CaptionLayer,
  ShapeMaskSettings,
  AdjustmentSettings,
} from "./types";
import { loadImage } from "./utils";

// ============== Types ==============

export interface FabricEngineConfig {
  width: number;
  height: number;
  backgroundColor?: string;
}

export interface LayerObjectMap {
  [layerId: string]: FabricObject;
}

// ============== Fabric Engine Class ==============

export class FabricEngine {
  private canvas: Canvas | null = null;
  private layerObjects: LayerObjectMap = {};
  private backgroundImage: FabricImage | null = null;
  private maskClipPath: FabricObject | null = null;
  private fabricModule: typeof import("fabric") | null = null;

  async initialize(
    canvasElement: HTMLCanvasElement,
    config: FabricEngineConfig
  ): Promise<void> {
    // Dynamically import fabric
    this.fabricModule = await import("fabric");
    const { Canvas } = this.fabricModule;

    this.canvas = new Canvas(canvasElement, {
      width: config.width,
      height: config.height,
      backgroundColor: config.backgroundColor || "#000000",
      preserveObjectStacking: true,
      selection: true,
      controlsAboveOverlay: true,
    });

    // Fix passive wheel event listener warning
    // Fabric.js adds wheel listeners without passive flag, we need to patch this
    this.patchWheelEventListener(canvasElement);

    // Set up selection events
    this.canvas.on("selection:created", this.handleSelection.bind(this));
    this.canvas.on("selection:updated", this.handleSelection.bind(this));
    this.canvas.on("selection:cleared", this.handleSelectionCleared.bind(this));
    this.canvas.on("object:modified", this.handleObjectModified.bind(this));
  }

  private patchWheelEventListener(canvasElement: HTMLCanvasElement): void {
    // Store original addEventListener
    const originalAddEventListener = canvasElement.addEventListener;
    let wheelHandlers: Array<{
      listener: EventListener;
      options: AddEventListenerOptions;
    }> = [];

    // Override addEventListener to intercept wheel event listeners
    canvasElement.addEventListener = function (
      this: HTMLCanvasElement,
      type: string,
      listener: EventListener,
      options?: boolean | AddEventListenerOptions
    ): void {
      // If it's a wheel event, ensure it's passive
      if (type === "wheel") {
        const opts =
          typeof options === "boolean" ? { capture: options } : options || {};
        wheelHandlers.push({ listener, options: opts });
        originalAddEventListener.call(this, type, listener, {
          ...opts,
          passive: true, // Force passive for wheel events
        });
      } else {
        originalAddEventListener.call(this, type, listener, options);
      }
    } as any;
  }

  private onSelectionChange?: (layerId: string | null) => void;
  private onLayerUpdate?: (layerId: string, updates: Partial<Layer>) => void;

  setSelectionCallback(callback: (layerId: string | null) => void): void {
    this.onSelectionChange = callback;
  }

  setLayerUpdateCallback(callback: (layerId: string, updates: Partial<Layer>) => void): void {
    this.onLayerUpdate = callback;
  }

  private handleSelection(e: { selected?: FabricObject[] }): void {
    if (e.selected && e.selected.length > 0) {
      const obj = e.selected[0];
      const layerId = Object.entries(this.layerObjects).find(
        ([, o]) => o === obj
      )?.[0];
      if (layerId && this.onSelectionChange) {
        this.onSelectionChange(layerId);
      }
    }
  }

  private handleSelectionCleared(): void {
    if (this.onSelectionChange) {
      this.onSelectionChange(null);
    }
  }

  private handleObjectModified(e: { target?: FabricObject }): void {
    if (!e.target) return;
    const layerId = Object.entries(this.layerObjects).find(
      ([, o]) => o === e.target
    )?.[0];
    if (layerId && this.onLayerUpdate) {
      const obj = e.target;
      this.onLayerUpdate(layerId, {
        x: obj.left || 0,
        y: obj.top || 0,
        width: (obj.width || 0) * (obj.scaleX || 1),
        height: (obj.height || 0) * (obj.scaleY || 1),
        rotation: obj.angle || 0,
      });
    }
  }

  getCanvas(): Canvas | null {
    return this.canvas;
  }

  dispose(): void {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }
    this.layerObjects = {};
    this.backgroundImage = null;
    this.maskClipPath = null;
  }

  // ============== Background Image ==============

  async setBackgroundImage(imageUrl: string): Promise<void> {
    if (!this.canvas || !this.fabricModule) return;
    const { FabricImage } = this.fabricModule;

    try {
      const img = await loadImage(imageUrl);
      const fabricImg = new FabricImage(img);

      // Scale to fit canvas
      const scaleX = this.canvas.width! / fabricImg.width!;
      const scaleY = this.canvas.height! / fabricImg.height!;
      const scale = Math.max(scaleX, scaleY);

      fabricImg.set({
        scaleX: scale,
        scaleY: scale,
        left: (this.canvas.width! - fabricImg.width! * scale) / 2,
        top: (this.canvas.height! - fabricImg.height! * scale) / 2,
        selectable: false,
        evented: false,
      });

      // Apply clip path if set
      if (this.maskClipPath) {
        fabricImg.set({ clipPath: this.maskClipPath });
      }

      // Remove old background
      if (this.backgroundImage) {
        this.canvas.remove(this.backgroundImage);
      }

      this.backgroundImage = fabricImg;
      this.canvas.add(fabricImg);
      this.canvas.sendObjectToBack(fabricImg);
      this.canvas.renderAll();
    } catch (error) {
      console.error("Failed to set background image:", error);
    }
  }

  setBackgroundColor(color: string): void {
    if (!this.canvas) return;
    this.canvas.backgroundColor = color;
    this.canvas.renderAll();
  }

  // ============== Shape Mask ==============

  setShapeMask(settings: ShapeMaskSettings): void {
    if (!this.canvas || !this.fabricModule) return;
    const { Rect, Circle } = this.fabricModule;

    const width = this.canvas.width!;
    const height = this.canvas.height!;
    const centerX = width / 2;
    const centerY = height / 2;

    let clipPath: FabricObject | null = null;

    switch (settings.type) {
      case "rectangle":
        clipPath = new Rect({
          width: width * 0.9,
          height: height * 0.9,
          left: centerX,
          top: centerY,
          originX: "center",
          originY: "center",
        });
        break;

      case "rounded-rectangle":
        clipPath = new Rect({
          width: width * 0.9,
          height: height * 0.9,
          rx: settings.borderRadius || 20,
          ry: settings.borderRadius || 20,
          left: centerX,
          top: centerY,
          originX: "center",
          originY: "center",
        });
        break;

      case "circle":
        const radius = Math.min(width, height) * 0.45;
        clipPath = new Circle({
          radius,
          left: centerX,
          top: centerY,
          originX: "center",
          originY: "center",
        });
        break;

      case "pill":
        const pillHeight = height * 0.4;
        clipPath = new Rect({
          width: width * 0.9,
          height: pillHeight,
          rx: pillHeight / 2,
          ry: pillHeight / 2,
          left: centerX,
          top: centerY,
          originX: "center",
          originY: "center",
        });
        break;

      case "none":
      default:
        clipPath = null;
        break;
    }

    this.maskClipPath = clipPath;

    // Apply to background image
    if (this.backgroundImage) {
      this.backgroundImage.set({ clipPath: clipPath || undefined });
      this.canvas.renderAll();
    }
  }

  // ============== Filters & Adjustments ==============

  applyAdjustments(adjustments: AdjustmentSettings): void {
    if (!this.backgroundImage || !this.fabricModule) return;

    const filters: unknown[] = [];
    const { Brightness, Contrast } = this.fabricModule.filters;

    // Brightness
    if (adjustments.brightness !== 0) {
      filters.push(new Brightness({ brightness: adjustments.brightness / 100 }));
    }

    // Contrast
    if (adjustments.contrast !== 0) {
      filters.push(new Contrast({ contrast: adjustments.contrast / 100 }));
    }

    // Note: Saturation, temperature, etc. require custom filters
    // For simplicity, we'll use CSS filters on the container for video
    // and basic fabric filters for images

    this.backgroundImage.filters = filters as FabricImage["filters"];
    this.backgroundImage.applyFilters();
    this.canvas?.renderAll();
  }

  applyCssFilter(filterString: string, intensity: number = 100): void {
    if (!this.canvas) return;
    const canvasEl = this.canvas.getElement();
    const factor = intensity / 100;
    
    // Parse and apply filter with intensity
    if (filterString) {
      const adjustedFilter = filterString.replace(/\d+\.?\d*/g, (match) => {
        const num = parseFloat(match);
        // Interpolate from default (usually 1) to target
        const adjusted = 1 + (num - 1) * factor;
        return adjusted.toFixed(2);
      });
      canvasEl.style.filter = adjustedFilter;
    } else {
      canvasEl.style.filter = "";
    }
    this.canvas.renderAll();
  }

  // ============== Layer Management ==============

  async addTextLayer(layer: TextLayer): Promise<void> {
    if (!this.canvas || !this.fabricModule) return;
    const { FabricText, Rect, Group } = this.fabricModule;

    const textObj = new FabricText(layer.text, {
      left: layer.x,
      top: layer.y,
      fontFamily: layer.fontFamily,
      fontSize: layer.fontSize,
      fontWeight: layer.fontWeight,
      fontStyle: layer.fontStyle,
      textAlign: layer.textAlign,
      fill: layer.color,
      angle: layer.rotation,
      opacity: layer.opacity,
      selectable: !layer.locked,
      visible: layer.visible,
    });

    // Add background if specified
    if (layer.backgroundColor) {
      const padding = layer.backgroundPadding || 8;
      const textBounds = textObj.getBoundingRect();
      
      const bgRect = new Rect({
        width: textBounds.width + padding * 2,
        height: textBounds.height + padding * 2,
        fill: layer.backgroundColor,
        rx: layer.borderRadius || 0,
        ry: layer.borderRadius || 0,
        originX: "center",
        originY: "center",
      });

      textObj.set({
        originX: "center",
        originY: "center",
      });

      const group = new Group([bgRect, textObj], {
        left: layer.x,
        top: layer.y,
        angle: layer.rotation,
        opacity: layer.opacity,
        selectable: !layer.locked,
        visible: layer.visible,
      });

      this.layerObjects[layer.id] = group;
      this.canvas.add(group);
    } else {
      this.layerObjects[layer.id] = textObj;
      this.canvas.add(textObj);
    }

    this.canvas.renderAll();
  }

  async addStickerLayer(layer: StickerLayer): Promise<void> {
    if (!this.canvas || !this.fabricModule) return;
    const { FabricImage } = this.fabricModule;

    try {
      const img = await loadImage(layer.stickerUrl);
      const fabricImg = new FabricImage(img, {
        left: layer.x,
        top: layer.y,
        scaleX: layer.width / img.width,
        scaleY: layer.height / img.height,
        angle: layer.rotation,
        opacity: layer.opacity,
        selectable: !layer.locked,
        visible: layer.visible,
      });

      this.layerObjects[layer.id] = fabricImg;
      this.canvas.add(fabricImg);
      this.canvas.renderAll();
    } catch (error) {
      console.error("Failed to add sticker:", error);
    }
  }

  async addOverlayLayer(layer: OverlayLayer): Promise<void> {
    if (!this.canvas || !this.fabricModule) return;
    const { FabricImage } = this.fabricModule;

    try {
      const img = await loadImage(layer.imageUrl);
      const fabricImg = new FabricImage(img, {
        left: layer.x,
        top: layer.y,
        scaleX: layer.width / img.width,
        scaleY: layer.height / img.height,
        angle: layer.rotation,
        opacity: layer.opacity,
        selectable: !layer.locked,
        visible: layer.visible,
        globalCompositeOperation: layer.blendMode as GlobalCompositeOperation,
      });

      this.layerObjects[layer.id] = fabricImg;
      this.canvas.add(fabricImg);
      this.canvas.renderAll();
    } catch (error) {
      console.error("Failed to add overlay:", error);
    }
  }

  async addCaptionLayer(layer: CaptionLayer): Promise<void> {
    // Captions are like text layers but with timing
    if (!this.canvas || !this.fabricModule) return;
    const { FabricText, Rect, Group } = this.fabricModule;

    const textObj = new FabricText(layer.text, {
      fontFamily: layer.fontFamily,
      fontSize: layer.fontSize,
      fontWeight: layer.fontWeight,
      fill: layer.color,
      textAlign: "center",
      originX: "center",
      originY: "center",
    });

    let finalObj: FabricObject = textObj;

    if (layer.backgroundColor) {
      const padding = layer.backgroundPadding || 12;
      const textBounds = textObj.getBoundingRect();

      const bgRect = new Rect({
        width: textBounds.width + padding * 2,
        height: textBounds.height + padding * 2,
        fill: layer.backgroundColor,
        rx: 8,
        ry: 8,
        originX: "center",
        originY: "center",
      });

      finalObj = new Group([bgRect, textObj], {
        originX: "center",
        originY: "center",
      });
    }

    // Position based on layer.position
    const canvasHeight = this.canvas.height!;
    const canvasWidth = this.canvas.width!;
    let y = canvasHeight / 2;

    if (layer.position === "top") {
      y = 60;
    } else if (layer.position === "bottom") {
      y = canvasHeight - 60;
    }

    finalObj.set({
      left: canvasWidth / 2,
      top: y,
      angle: layer.rotation,
      opacity: layer.opacity,
      selectable: !layer.locked,
      visible: layer.visible,
    });

    this.layerObjects[layer.id] = finalObj;
    this.canvas.add(finalObj);
    this.canvas.renderAll();
  }

  updateLayer(layerId: string, updates: Partial<Layer>): void {
    const obj = this.layerObjects[layerId];
    if (!obj || !this.canvas) return;

    const fabricUpdates: Partial<FabricObject> = {};

    if (updates.x !== undefined) fabricUpdates.left = updates.x;
    if (updates.y !== undefined) fabricUpdates.top = updates.y;
    if (updates.rotation !== undefined) fabricUpdates.angle = updates.rotation;
    if (updates.opacity !== undefined) fabricUpdates.opacity = updates.opacity;
    if (updates.visible !== undefined) fabricUpdates.visible = updates.visible;
    if (updates.locked !== undefined) fabricUpdates.selectable = !updates.locked;

    if (updates.width !== undefined || updates.height !== undefined) {
      const currentWidth = (obj.width || 1) * (obj.scaleX || 1);
      const currentHeight = (obj.height || 1) * (obj.scaleY || 1);
      if (updates.width !== undefined) {
        fabricUpdates.scaleX = updates.width / (obj.width || 1);
      }
      if (updates.height !== undefined) {
        fabricUpdates.scaleY = updates.height / (obj.height || 1);
      }
    }

    obj.set(fabricUpdates);
    this.canvas.renderAll();
  }

  removeLayer(layerId: string): void {
    const obj = this.layerObjects[layerId];
    if (!obj || !this.canvas) return;

    this.canvas.remove(obj);
    delete this.layerObjects[layerId];
    this.canvas.renderAll();
  }

  selectLayer(layerId: string | null): void {
    if (!this.canvas) return;

    if (!layerId) {
      this.canvas.discardActiveObject();
    } else {
      const obj = this.layerObjects[layerId];
      if (obj) {
        this.canvas.setActiveObject(obj);
      }
    }
    this.canvas.renderAll();
  }

  reorderLayers(sortedLayerIds: string[]): void {
    if (!this.canvas) return;

    // Bring layers to front in order
    sortedLayerIds.forEach((id) => {
      const obj = this.layerObjects[id];
      if (obj) {
        this.canvas!.bringObjectToFront(obj);
      }
    });

    // Make sure background stays at back
    if (this.backgroundImage) {
      this.canvas.sendObjectToBack(this.backgroundImage);
    }

    this.canvas.renderAll();
  }

  setCaptionVisibility(layerId: string, visible: boolean): void {
    const obj = this.layerObjects[layerId];
    if (!obj || !this.canvas) return;
    obj.set({ visible });
    this.canvas.renderAll();
  }

  // ============== Canvas Dimensions ==============

  resize(width: number, height: number): void {
    if (!this.canvas) return;
    this.canvas.setDimensions({ width, height });
    this.canvas.renderAll();
  }

  // ============== Export ==============

  toDataURL(format: "png" | "jpeg" = "png", quality: number = 1): string {
    if (!this.canvas) return "";
    return this.canvas.toDataURL({
      format,
      quality,
      multiplier: 1,
    });
  }

  toBlob(format: "png" | "jpeg" = "png", quality: number = 1): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.canvas) {
        resolve(null);
        return;
      }
      
      const dataUrl = this.toDataURL(format, quality);
      fetch(dataUrl)
        .then((res) => res.blob())
        .then(resolve)
        .catch(() => resolve(null));
    });
  }

  // Get canvas element for video compositing
  getCanvasElement(): HTMLCanvasElement | null {
    return this.canvas?.getElement() || null;
  }
}

// ============== Singleton Export ==============

let engineInstance: FabricEngine | null = null;

export const getFabricEngine = (): FabricEngine => {
  if (!engineInstance) {
    engineInstance = new FabricEngine();
  }
  return engineInstance;
};

export const disposeFabricEngine = (): void => {
  if (engineInstance) {
    engineInstance.dispose();
    engineInstance = null;
  }
};
