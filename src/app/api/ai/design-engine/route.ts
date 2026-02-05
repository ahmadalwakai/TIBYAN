/**
 * Design Engine API Route
 * 
 * POST /api/ai/design-engine
 * 
 * New endpoint using the Design Engine system.
 * Supports presets, themes, and advanced options.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { chatCompletion } from "@/lib/groqClient";
import {
  createSpec,
  render,
  EngineRequestSchema,
  getRegistrySummary,
  type EngineRequest,
  type EngineSpec,
  type RenderResult,
} from "@/lib/zyphon/design-engine";

// Force Node.js runtime
export const runtime = "nodejs";

// ============================================
// Request Schema
// ============================================

const APIRequestSchema = z.object({
  // Use AI to generate spec
  useAI: z.boolean().default(false),
  aiPrompt: z.string().max(500).optional(),
  
  // Direct spec options
  presetId: z.enum(["logo", "banner", "pattern", "social-card"]).default("logo"),
  themeId: z.string().default("emerald"),
  text: z.string().max(100).optional(), // Semantic input, NOT rendered as text
  seed: z.number().int().min(0).max(999999999).optional(),
  
  // Intensity sliders (0-1)
  // NOTE: For logo preset, pattern and circuit are disabled by default
  patternIntensity: z.number().min(0).max(1).default(0.5),
  circuitIntensity: z.number().min(0).max(1).default(0.5),
  accentIntensity: z.number().min(0).max(1).default(0.5),
  
  // Canvas overrides
  width: z.number().min(64).max(4096).optional(),
  height: z.number().min(64).max(4096).optional(),
  
  // Renderer override
  // CRITICAL: symbolic-mark is default for logo preset
  // Text-based renderers are deprecated for logos
  markRenderer: z.enum([
    "symbolic-mark",      // DEFAULT: Abstract geometric marks
    "kufic-block-v2",     // DEPRECATED for logo preset
    "geometric-wordmark",
    "abstract-grid",
    "text-fallback",      // DEPRECATED for logo preset
  ]).optional(),
});

type APIRequest = z.infer<typeof APIRequestSchema>;

// ============================================
// Groq Prompt Builder
// ============================================

// AI-generated config shape (flat, before mapping to EngineRequest)
interface AIConfig {
  presetId?: "logo" | "banner" | "pattern" | "social-card";
  themeId?: string;
  text?: string;
  patternIntensity?: number;
  circuitIntensity?: number;
  accentIntensity?: number;
  markRenderer?: "symbolic-mark" | "geometric-wordmark" | "abstract-grid";
}

function buildSystemPrompt(): string {
  return `You are a JSON-only design configuration generator. Output ONLY valid JSON, no prose.

Generate configuration for an SVG design engine. The JSON schema:
{
  "presetId": "logo" | "banner" | "pattern" | "social-card",
  "themeId": "emerald" | "gold" | "sapphire" | "monochrome",
  "text": "string (semantic brand name, optional - NOT rendered as visible text)",
  "patternIntensity": 0-1,
  "circuitIntensity": 0-1,
  "accentIntensity": 0-1,
  "markRenderer": "symbolic-mark" | "geometric-wordmark" | "abstract-grid"
}

CRITICAL RULES:
- For logos: ALWAYS use "symbolic-mark" (creates abstract geometric marks, NOT text)
- NEVER use text-based renderers for logos
- The "text" field is semantic input only - it influences the mark but is NOT rendered as visible text
- For patterns: set low intensities (0.3-0.5) for subtle effect
- For social cards: medium intensities work well
- For banners: keep pattern/circuit low to not overwhelm
- emerald = green/tech, gold = traditional/premium, sapphire = modern/corporate, monochrome = minimal`;
}

function buildUserPrompt(prompt: string): string {
  return `Generate design config for: "${prompt}"\n\nOutput JSON only. Remember: logos use symbolic-mark (abstract shapes), NOT text rendering.`;
}

async function generateWithAI(prompt: string): Promise<AIConfig> {
  const response = await chatCompletion(
    [
      { role: "system", content: buildSystemPrompt() },
      { role: "user", content: buildUserPrompt(prompt) },
    ],
    {
      model: "llama-3.3-70b-versatile",
      maxTokens: 512,
      temperature: 0.7,
    }
  );
  
  // Parse JSON from response
  let jsonStr = response.trim();
  if (jsonStr.startsWith("```")) {
    const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) jsonStr = match[1];
  }
  
  return JSON.parse(jsonStr);
}

// ============================================
// Response Types
// ============================================

interface SuccessResponse {
  ok: true;
  data: {
    svg: string;
    spec: EngineSpec;
    stats: RenderResult["stats"];
    validation: RenderResult["validation"];
  };
}

interface ErrorResponse {
  ok: false;
  error: string;
  details?: unknown;
}

type APIResponse = SuccessResponse | ErrorResponse;

// ============================================
// Handlers
// ============================================

export async function GET() {
  // Return available presets and themes
  const summary = getRegistrySummary();
  return NextResponse.json({ ok: true, data: summary });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = APIRequestSchema.safeParse(body);
    
    if (!parseResult.success) {
      return NextResponse.json(
        { ok: false, error: "Invalid request", details: parseResult.error.issues },
        { status: 400 }
      );
    }
    
    const req = parseResult.data;
    let engineRequest: EngineRequest;
    
    // If using AI, generate config from prompt
    if (req.useAI && req.aiPrompt) {
      try {
        const aiConfig = await generateWithAI(req.aiPrompt);
        engineRequest = {
          presetId: aiConfig.presetId || req.presetId,
          themeId: aiConfig.themeId || req.themeId,
          text: aiConfig.text || req.text,
          seed: req.seed,
          patternIntensity: aiConfig.patternIntensity ?? req.patternIntensity,
          circuitIntensity: aiConfig.circuitIntensity ?? req.circuitIntensity,
          accentIntensity: aiConfig.accentIntensity ?? req.accentIntensity,
          overrides: {
            canvas: req.width && req.height ? { width: req.width, height: req.height } : undefined,
            markRenderer: aiConfig.markRenderer || req.markRenderer,
          },
        };
      } catch (aiError) {
        // Fallback to manual config if AI fails
        console.error("[DesignEngine] AI generation failed:", aiError);
        engineRequest = {
          presetId: req.presetId,
          themeId: req.themeId,
          text: req.text,
          seed: req.seed,
          patternIntensity: req.patternIntensity,
          circuitIntensity: req.circuitIntensity,
          accentIntensity: req.accentIntensity,
          overrides: {
            canvas: req.width && req.height ? { width: req.width, height: req.height } : undefined,
            markRenderer: req.markRenderer,
          },
        };
      }
    } else {
      engineRequest = {
        presetId: req.presetId,
        themeId: req.themeId,
        text: req.text,
        seed: req.seed,
        patternIntensity: req.patternIntensity,
        circuitIntensity: req.circuitIntensity,
        accentIntensity: req.accentIntensity,
        overrides: {
          canvas: req.width && req.height ? { width: req.width, height: req.height } : undefined,
          markRenderer: req.markRenderer,
        },
      };
    }
    
    // Create spec and render
    const spec = createSpec(engineRequest);
    const result = render(spec);
    
    return NextResponse.json({
      ok: true,
      data: {
        svg: result.svg,
        spec: result.spec,
        stats: result.stats,
        validation: result.validation,
      },
    } as SuccessResponse);
    
  } catch (error) {
    console.error("[DesignEngine] Error:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
