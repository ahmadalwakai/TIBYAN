# Advanced Post Editor - Complete Implementation

## Overview

Fully functional photo and video editor with iOS-style bottom toolbar, integrated into the Tibyan social platform at `/social/create/edit`.

## Features

### Core Editing Capabilities

- ✅ **Media Import**: Drag & drop or file picker for images and videos
- ✅ **Canvas-Based Preview**: Fabric.js-powered image editing with real-time layer rendering
- ✅ **Video Preview**: Native HTMLVideoElement with timeline scrubbing
- ✅ **Layer System**: Unlimited layers with drag-to-reorder, show/hide, delete
- ✅ **Transform Handles**: Visual drag handles for repositioning and resizing layers
- ✅ **Undo/Redo**: 20-step history with keyboard shortcuts (Ctrl+Z / Ctrl+Shift+Z)
- ✅ **Draft Persistence**: Auto-save to localStorage, restore on reload
- ✅ **Real Export**: PNG for images, MP4 with ffmpeg.wasm for video

### Editing Tools (14 Panels)

1. **تعديل (Edit)** - Quick actions: crop, rotate, flip, reset
2. **صوت (Audio)** - Volume control, extract audio (video only)
3. **نص (Text)** - Add styled text with font, color, size, alignment
4. **تأثيرات (Effects)** - Brightness, contrast, saturation, blur
5. **تراكب (Overlay)** - Gradient and color overlays
6. **ترجمة (Captions)** - Subtitle management with timestamps
7. **فلاتر (Filters)** - 10 presets: Grayscale, Sepia, Vintage, etc.
8. **خلفية (Background)** - Solid colors or blur background
9. **نسبة الأبعاد (Aspect Ratio)** - 1:1, 4:3, 16:9, 9:16 presets
10. **وسائط (Media)** - Import images/videos, manage library
11. **ملصقات (Stickers)** - 20+ emoji stickers with search
12. **ضبط (Adjust)** - Fine-tune hue, sharpen, vignette, temperature
13. **شكل (Shape)** - Rectangle, circle, line shapes with colors
14. **أفاتار ذكي (AI Avatar)** - AI-generated avatar section

## File Structure

```
src/
├── lib/
│   └── editor/
│       ├── index.ts           # Main exports
│       ├── types.ts           # TypeScript definitions (~460 lines)
│       ├── store.ts           # Zustand state management (~670 lines)
│       ├── utils.ts           # Utilities, presets (~313 lines)
│       ├── fabricEngine.ts    # Fabric.js canvas wrapper
│       └── ffmpegExport.ts    # Video export with FFmpeg (~616 lines)
│
└── components/
    └── PostEditor/
        ├── PostEditor.tsx              # Main component
        ├── PreviewStage.tsx            # Canvas/video preview
        ├── BottomToolbar.tsx           # iOS-style toolbar
        ├── LayerList.tsx               # Layer management
        ├── LayerTransformHandles.tsx   # Visual drag handles
        └── panels/
            ├── EditPanel.tsx
            ├── AudioPanel.tsx
            ├── TextPanel.tsx
            ├── EffectsPanel.tsx
            ├── OverlayPanel.tsx
            ├── CaptionsPanel.tsx
            ├── FiltersPanel.tsx
            ├── BackgroundPanel.tsx
            ├── AspectRatioPanel.tsx
            ├── MediaPanel.tsx
            ├── StickersPanel.tsx
            ├── AdjustPanel.tsx
            ├── ShapePanel.tsx
            └── AiAvatarPanel.tsx
```

## Technology Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 16.1.6 | App Router, Server Actions |
| **Chakra UI** | 3.31.0 | Component library, theming |
| **Fabric.js** | 6.5.1 | Canvas-based image editing |
| **FFmpeg.wasm** | 0.12.10 | Browser-based video encoding |
| **Zustand** | 5.0.10 | State management |
| **TypeScript** | Strict mode | Type safety |

## Usage

### 1. Navigate to Editor

```
/social/create/edit
```

### 2. Import Media

- Click "رفع وسائط" button
- Or drag & drop into the preview area
- Supports: JPG, PNG, GIF, MP4, MOV, AVI

### 3. Edit

- Select tool from bottom toolbar
- Apply adjustments in the panel
- Add layers (text, shapes, stickers)
- Use transform handles to reposition

### 4. Export

- Click "تصدير" button
- Image: Exports as PNG
- Video: Encodes with FFmpeg to MP4
- Creates social post with media

## State Management

### Zustand Store (`usePostEditorStore`)

```typescript
interface PostEditorState {
  // Media
  mediaFile: File | null;
  mediaType: "image" | "video" | null;
  
  // Canvas
  canvasWidth: number;
  canvasHeight: number;
  aspectRatio: string;
  
  // Layers
  layers: EditorLayer[];
  selectedLayerId: string | null;
  
  // History
  history: HistoryEntry[];
  historyIndex: number;
  
  // UI
  activePanel: string | null;
  isExporting: boolean;
  
  // Actions
  addLayer: (layer: EditorLayer) => void;
  updateLayer: (id: string, updates: Partial<EditorLayer>) => void;
  removeLayer: (id: string) => void;
  undo: () => void;
  redo: () => void;
  // ... more actions
}
```

### Local Storage Persistence

```typescript
// Auto-save every state change
persist(
  (set, get) => ({ /* store */ }),
  {
    name: "post-editor-draft",
    partialize: (state) => ({
      layers: state.layers,
      aspectRatio: state.aspectRatio,
      // ... relevant fields
    }),
  }
)
```

## Export Pipeline

### Image Export

1. Render all visible layers to Fabric.js canvas
2. Apply filters and effects
3. Export as PNG Blob via `canvas.toBlob()`
4. Upload to `/api/upload`
5. Create post via `/api/social/posts`

### Video Export (FFmpeg.wasm)

1. **Load FFmpeg**: Download wasm binary (~30MB)
2. **Prepare Frames**: Extract video frames at 30fps
3. **Overlay Layers**: Render each frame with Fabric.js layers
4. **Encode**: Combine frames into MP4 with H.264 codec
5. **Upload & Post**: Same as image

```typescript
// Simplified export flow
const blob = await exportVideo(videoElement, layers, {
  width: 1080,
  height: 1920,
  fps: 30,
  quality: 0.8,
});
```

## Keyboard Shortcuts

| Shortcut | Action |
|---------|--------|
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Delete` | Delete selected layer |
| `Escape` | Deselect layer / Close panel |
| `Ctrl+S` | Export (captured) |

## Performance Optimizations

1. **Lazy Loading**: FFmpeg only loaded when exporting video
2. **Debounced Updates**: Layer updates debounced 100ms
3. **Canvas Caching**: Fabric.js object caching enabled
4. **Worker-Based Export**: FFmpeg runs in Web Worker
5. **Progressive Rendering**: Video frames processed in batches

## Integration Points

### Authentication

```typescript
// Check user role before editor access
if (!["MEMBER", "INSTRUCTOR", "ADMIN"].includes(user.role)) {
  router.push("/pricing");
}
```

### Upload API

```typescript
POST /api/upload
Content-Type: multipart/form-data

FormData:
  - file: Blob (image/png or video/mp4)

Response:
{
  ok: true,
  data: { url: "/uploads/image/xyz.png" }
}
```

### Create Post API

```typescript
POST /api/social/posts
Content-Type: application/json

Body:
{
  content: "Post caption",
  status: "PUBLISHED",
  visibility: "PUBLIC",
  media: [
    {
      type: "IMAGE" | "VIDEO",
      url: "/uploads/image/xyz.png",
      order: 0
    }
  ]
}
```

## Known Limitations

1. **Video Size**: Large videos (>100MB) may cause memory issues
2. **FFmpeg Load**: First video export takes ~5-10 seconds to load FFmpeg
3. **Mobile**: Touch gestures for transform handles not yet implemented
4. **Audio Editing**: Basic volume control only (no mixing/effects)
5. **Undo Limit**: 20 steps (configurable in `store.ts`)

## Future Enhancements

- [ ] Real-time collaboration (multiple editors)
- [ ] Cloud-based video encoding (server-side FFmpeg)
- [ ] Advanced audio editing (trim, fade, effects)
- [ ] Template library (pre-designed layouts)
- [ ] AI-powered background removal
- [ ] Gesture controls for mobile
- [ ] Export presets (Instagram, TikTok, YouTube)

## Testing

```bash
# Build verification
npm run build

# Development
npm run dev

# Navigate to editor
http://localhost:3000/social/create/edit
```

## Troubleshooting

### Issue: FFmpeg fails to load

**Solution**: Check network connectivity. FFmpeg wasm is loaded from CDN on first video export.

### Issue: Canvas not rendering

**Solution**: Ensure `fabricEngine.ts` is initialized. Check browser console for errors.

### Issue: Cookies not persisting (auth issue)

**Solution**: See [COOKIE_AUTH_FIX.md](./COOKIE_AUTH_FIX.md) - all fetch calls must include `credentials: "include"`.

### Issue: Export takes too long

**Solution**: Reduce canvas dimensions or video duration. Video export is CPU-intensive.

## Credits

- **Fabric.js**: Canvas manipulation library
- **FFmpeg.wasm**: WebAssembly port of FFmpeg
- **Chakra UI**: Component library and design system
- **Zustand**: Lightweight state management

## License

Part of the Tibyan LMS project. All rights reserved.

---

**Last Updated**: January 2025
**Status**: ✅ Production Ready
**Build**: Verified passing on Next.js 16.1.6
