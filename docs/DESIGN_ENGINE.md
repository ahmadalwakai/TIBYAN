# Design Engine Documentation

> Scalable SVG generation system for Tibyan/Zyphon branding assets.

## Overview

The Design Engine is a modular, extensible system for generating SVG graphics with:
- **Themes**: Color palettes and contrast settings
- **Presets**: Canvas dimensions and layer configurations
- **Layers**: Individual visual components (background, pattern, mark, etc.)
- **Validators**: Quality gates for contrast, bounds, and complexity

## Quick Start

```typescript
import { createSpec, render, renderQuick } from "@/lib/zyphon/design-engine";

// Create a spec from a request
const spec = createSpec({
  presetId: "logo",       // logo, banner, pattern, social-card
  themeId: "emerald",     // emerald, gold, sapphire, monochrome
  text: "تبيان",          // Optional Arabic text
  seed: 12345,            // Optional for deterministic output
  patternIntensity: 0.5,  // 0-1
  circuitIntensity: 0.5,  // 0-1
  accentIntensity: 0.5,   // 0-1
});

// Render with validation
const result = render(spec);
console.log(result.svg);            // SVG string
console.log(result.validation);     // Validation results
console.log(result.stats);          // Element counts

// Quick render (no validation, faster)
const svg = renderQuick(spec);
```

## API Reference

### Types

| Type | Description |
|------|-------------|
| `EngineRequest` | Input from API/UI with preset/theme selection |
| `EngineSpec` | Complete specification after expansion |
| `Theme` | Color palette and contrast rules |
| `Preset` | Canvas size and layer configuration |
| `Layer` | Individual layer in the SVG |
| `RenderResult` | Output with SVG, spec, validation, stats |

### Functions

| Function | Description |
|----------|-------------|
| `createSpec(request)` | Convert request to full spec |
| `render(spec)` | Render with validation |
| `renderQuick(spec)` | Render without validation |
| `validateSpec(layers, canvas, theme, preset)` | Run all validators |
| `getTheme(id)` | Get theme by ID |
| `getPreset(id)` | Get preset by ID |
| `listThemeIds()` | List available theme IDs |
| `listPresetIds()` | List available preset IDs |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   EngineRequest                      │
│  { presetId, themeId, text, intensities, seed }     │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                    createSpec()                      │
│  Expands preset → layers, applies theme             │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                    EngineSpec                        │
│  { version, canvas, layers[], seed, theme, preset } │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│                   render()                           │
│  1. Render each layer                               │
│  2. Validate (contrast, bounds, dominance, etc.)    │
│  3. Return RenderResult                             │
└─────────────────────┴───────────────────────────────┘
```

## Extending the Engine

### Adding a New Theme (2 steps)

1. **Create theme file** at `src/lib/zyphon/design-engine/themes/myTheme.ts`:

```typescript
import { Theme } from "../types";

export const myTheme: Theme = {
  id: "my-theme",
  name: "My Custom Theme",
  colors: {
    primary: "#FF5722",
    secondary: "#E64A19",
    accent: "#FF9800",
    background: "#0D0D0D",
    surface: "#1A1A1A",
    text: "#FFFFFF",
    textMuted: "#AAAAAA",
  },
  contrastRules: {
    minTextContrast: 4.5,
    minUIContrast: 3.0,
    minAccentContrast: 2.5,
  },
};
```

2. **Register in index** at `src/lib/zyphon/design-engine/themes/index.ts`:

```typescript
import { myTheme } from "./myTheme";

const themeRegistry = new Map<string, Theme>([
  // ... existing themes
  ["my-theme", myTheme],
]);
```

### Adding a New Preset (2 steps)

1. **Create preset file** at `src/lib/zyphon/design-engine/presets/myPreset.ts`:

```typescript
import { Preset } from "../types";

export const myPreset: Preset = {
  id: "my-preset",
  name: "My Custom Preset",
  canvas: {
    width: 800,
    height: 600,
    background: "theme.background",
  },
  layers: [
    { type: "background", order: 0 },
    { type: "pattern", order: 1, opacity: 0.1, scale: 1 },
    { type: "mark", order: 5, centered: true, scale: 0.6 },
  ],
  constraints: {
    minMarkDominance: 0.2,
    maxElementCount: 500,
    requireMark: true,
    autoAdjust: true,
  },
};
```

2. **Register in index** at `src/lib/zyphon/design-engine/presets/index.ts`:

```typescript
import { myPreset } from "./myPreset";

const presetRegistry = new Map<string, Preset>([
  // ... existing presets
  ["my-preset", myPreset],
]);

export type PresetId = "logo" | "banner" | "pattern" | "social-card" | "my-preset";
```

### Adding a New Layer Renderer

1. **Create layer file** at `src/lib/zyphon/design-engine/layers/myLayer.ts`:

```typescript
import { Canvas, Theme } from "../types";

interface MyLayerConfig {
  type: "my-layer";
  order: number;
  // ... custom properties
}

export function renderMyLayer(
  config: MyLayerConfig,
  canvas: Canvas,
  theme: Theme,
  seed: number
): string {
  // Return SVG elements as string
  return `<g class="my-layer">
    <!-- SVG content -->
  </g>`;
}
```

2. **Register in layers/index.ts**:

```typescript
import { renderMyLayer } from "./myLayer";

export function getLayerRenderer(type: LayerType) {
  const renderers = {
    // ... existing renderers
    "my-layer": renderMyLayer,
  };
  return renderers[type] || null;
}
```

3. **Add type to LayerSchema** in `types.ts`:

```typescript
const MyLayerConfigSchema = z.object({
  type: z.literal("my-layer"),
  order: z.number(),
  // ... custom properties
});

export const LayerSchema = z.discriminatedUnion("type", [
  // ... existing layer schemas
  MyLayerConfigSchema,
]);
```

## API Endpoint

**POST** `/api/ai/design-engine`

Request:
```json
{
  "presetId": "logo",
  "themeId": "emerald",
  "text": "تبيان",
  "patternIntensity": 0.5,
  "circuitIntensity": 0.5,
  "accentIntensity": 0.5,
  "useAI": false
}
```

With AI planning:
```json
{
  "useAI": true,
  "aiPrompt": "Create a modern tech logo for an Arabic learning platform"
}
```

Response:
```json
{
  "ok": true,
  "data": {
    "svg": "<svg>...</svg>",
    "spec": { ... },
    "stats": { "elementCount": 127, "layerCount": 5 },
    "validation": { "valid": true, "issues": [] }
  }
}
```

**GET** `/api/ai/design-engine`

Returns available presets and themes:
```json
{
  "ok": true,
  "data": {
    "presets": ["logo", "banner", "pattern", "social-card"],
    "themes": ["emerald", "gold", "sapphire", "monochrome"],
    "markRenderers": ["kufic-block-v2", "geometric-wordmark", "abstract-grid", "text-fallback"]
  }
}
```

## Legacy Compatibility

The old `svg-gen` module still works via the adapter:

```typescript
// Old code continues to work
import { generateDesignSvg } from "@/lib/zyphon/svg-gen";

// Or use adapter directly
import { fromLegacySpec, toLegacySpec, renderLegacy } from "@/lib/zyphon/design-engine/adapter";

const legacySpec = {
  canvas: { w: 1024, h: 1024, bg: "#000000" },
  text: { value: "تبيان", strokeWidth: 10, geometryStyle: "kufic-block", centered: true, scale: 1 },
  patterns: { ... },
  accent: { ... },
  seed: 12345,
};

const svg = renderLegacy(legacySpec);
```

## Available Themes

| ID | Name | Primary Color | Style |
|----|------|--------------|-------|
| `emerald` | Emerald | #00A86B | Tech/Modern |
| `gold` | Gold | #D4AF37 | Traditional/Premium |
| `sapphire` | Sapphire | #0F52BA | Corporate/Trust |
| `monochrome` | Monochrome | #FFFFFF | Minimal/Clean |

## Available Presets

| ID | Canvas | Use Case |
|----|--------|----------|
| `logo` | 1024×1024 | Square logos, avatars |
| `banner` | 1920×600 | Website headers |
| `pattern` | 512×512 | Tileable patterns |
| `social-card` | 1200×630 | OG images, social shares |

## Testing

Run design engine tests:

```bash
npx vitest run src/lib/zyphon/design-engine/__tests__
```

## Files Structure

```
src/lib/zyphon/design-engine/
├── types.ts           # Core types and Zod schemas
├── index.ts           # Main exports
├── registry.ts        # Theme/preset registry utilities
├── adapter.ts         # Legacy svg-gen compatibility
├── themes/
│   ├── index.ts       # Theme registry
│   ├── emerald.ts
│   ├── gold.ts
│   ├── sapphire.ts
│   └── monochrome.ts
├── presets/
│   ├── index.ts       # Preset registry
│   ├── logo.ts
│   ├── banner.ts
│   ├── pattern.ts
│   └── social-card.ts
├── layers/
│   ├── index.ts       # Layer renderer registry
│   ├── background.ts
│   ├── mainMark.ts
│   ├── geometricPattern.ts
│   ├── circuit.ts
│   ├── accent.ts
│   ├── frame.ts
│   └── grid.ts
├── validators/
│   ├── index.ts       # Validation orchestrator
│   ├── contrast.ts
│   ├── bounds.ts
│   ├── dominance.ts
│   └── complexity.ts
├── render/
│   ├── index.ts
│   ├── pipeline.ts    # Main render orchestration
│   └── svg.ts         # SVG utilities
└── __tests__/
    ├── design-engine.test.ts
    └── validators.test.ts
```
