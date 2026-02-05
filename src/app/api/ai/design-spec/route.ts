/**
 * AI Design Spec API Route (Internal)
 * 
 * Endpoint for generating design specs using Groq.
 * This is the internal endpoint used by the UI (no API key required).
 * 
 * POST /api/ai/design-spec
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chatCompletion } from "@/lib/groqClient";
import {
  DesignRequestSchema,
  DesignSpecSchema,
  ACCENT_COLORS,
  BACKGROUND_COLORS,
  type DesignSpec,
  type DesignRequest,
} from "@/lib/zyphon/svg-gen/types";

// Force Node.js runtime
export const runtime = "nodejs";

// ============================================
// Request Schema
// ============================================

const InternalDesignRequestSchema = DesignRequestSchema.extend({
  // Allow optional seed override
  seed: z.number().int().min(0).max(999999999).optional(),
});

// ============================================
// Response Types
// ============================================

interface SuccessResponse {
  ok: true;
  data: {
    spec: DesignSpec;
  };
}

interface ErrorResponse {
  ok: false;
  error: string;
}

type ApiResponse = SuccessResponse | ErrorResponse;

// ============================================
// Helpers
// ============================================

function buildSystemPrompt(): string {
  return `You are a JSON-only design specification generator. You output ONLY valid JSON, no prose, no markdown, no explanations.

Generate a DesignSpec JSON object for creating stylized Arabic calligraphy SVG images.

The JSON schema you MUST follow:
{
  "canvas": { "w": number (256-2048), "h": number (256-2048), "bg": "#RRGGBB" },
  "text": {
    "value": "string (Arabic text)",
    "strokeWidth": number (1-50),
    "geometryStyle": "kufic-block" | "kufic-rounded" | "angular" | "geometric",
    "centered": boolean,
    "color": "#RRGGBB" (optional),
    "scale": number (0.5-3)
  },
  "patterns": {
    "islamic": { "enabled": boolean, "opacity": 0-1, "tile": "8-point-star"|"6-point-star"|"hexagonal"|"octagonal", "scale": 0.5-3, "color": "#RRGGBB" (optional) },
    "circuit": { "enabled": boolean, "opacity": 0-1, "density": 0.1-1, "color": "#RRGGBB" (optional), "nodeRadius": 1-10 }
  },
  "accent": { "color": "#RRGGBB", "lineWeight": 1-20, "glow": 0-1 },
  "seed": number (random integer 0-999999999)
}

RULES:
1. Output ONLY the JSON object, nothing else
2. Respond with a single JSON object on one line if possible
3. All colors must be 6-digit hex format (#RRGGBB)
4. Adjust values based on the style/mood requested
5. For "minimal-premium": low pattern opacity (0.05-0.1), clean lines
6. For "vibrant": higher opacity, bolder colors
7. For "traditional": stronger islamic patterns, gold/warm accents
8. For "tech": stronger circuit patterns, cyan/green accents`;
}

function buildUserPrompt(request: DesignRequest): string {
  const accentColor = ACCENT_COLORS[request.accent] || ACCENT_COLORS.emerald;
  const bgColor = BACKGROUND_COLORS[request.background] || BACKGROUND_COLORS.black;
  
  return `Generate a DesignSpec for:
- Arabic text: "${request.brandTextAr}"
- Style: ${request.style}
- Mood: ${request.mood}
- Accent color: ${accentColor}
- Background: ${bgColor}

Output JSON only.`;
}

function parseDesignSpec(response: string): DesignSpec {
  let jsonStr = response.trim();
  
  // Remove markdown code blocks if present
  if (jsonStr.startsWith("```")) {
    const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      jsonStr = match[1];
    }
  }
  
  const parsed = JSON.parse(jsonStr);
  return DesignSpecSchema.parse(parsed);
}

// ============================================
// POST Handler
// ============================================

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // 1. Parse request body
    const body = await request.json();
    const parseResult = InternalDesignRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { ok: false, error: `Invalid request: ${parseResult.error.issues[0]?.message}` },
        { status: 400 }
      );
    }

    const designRequest = parseResult.data;

    // 2. Call Groq to generate design spec
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt(designRequest);

    const groqResponse = await chatCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      {
        model: "llama-3.3-70b-versatile",
        maxTokens: 1024,
        temperature: 0.7,
      }
    );

    // 3. Parse and validate the design spec
    let designSpec: DesignSpec;
    try {
      designSpec = parseDesignSpec(groqResponse);
      
      // Apply seed override if provided
      if (designRequest.seed !== undefined) {
        designSpec.seed = designRequest.seed;
      }
    } catch (parseError) {
      console.error("[DesignSpec] Failed to parse Groq response:", groqResponse);
      
      // Return a fallback design spec
      designSpec = {
        canvas: { w: 1024, h: 1024, bg: BACKGROUND_COLORS[designRequest.background] || "#000000" },
        text: {
          value: designRequest.brandTextAr,
          strokeWidth: 10,
          geometryStyle: "kufic-block",
          centered: true,
          scale: 1,
        },
        patterns: {
          islamic: { enabled: true, opacity: 0.08, tile: "8-point-star", scale: 1 },
          circuit: { enabled: true, opacity: 0.18, density: 0.35, nodeRadius: 3 },
        },
        accent: { 
          color: ACCENT_COLORS[designRequest.accent] || "#00A86B", 
          lineWeight: 3, 
          glow: 0 
        },
        seed: designRequest.seed ?? Math.floor(Math.random() * 999999999),
      };
    }

    // 4. Return design spec
    return NextResponse.json({
      ok: true,
      data: { spec: designSpec },
    });

  } catch (error) {
    console.error("[AI DesignSpec] Error:", error);
    
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
