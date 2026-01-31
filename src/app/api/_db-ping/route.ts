import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Force Node.js runtime for Prisma
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/_db-ping
 * 
 * Debug endpoint to test database connectivity on Vercel.
 * Returns detailed error information if connection fails.
 */
export async function GET() {
  const startTime = Date.now();
  
  try {
    // Test basic connectivity
    const result = await prisma.$queryRaw<[{ now: Date }]>`SELECT NOW() as now`;
    
    // Test a simple model query
    const userCount = await prisma.user.count();
    
    const duration = Date.now() - startTime;
    
    return NextResponse.json({
      ok: true,
      data: {
        status: "connected",
        timestamp: result[0]?.now,
        userCount,
        duration: `${duration}ms`,
        env: {
          nodeEnv: process.env.NODE_ENV,
          hasDbUrl: !!process.env.DATABASE_URL,
          hasDirectUrl: !!process.env.DIRECT_DATABASE_URL,
          dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
        },
      },
    });
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    
    // Extract Prisma error details
    const prismaError = error as {
      code?: string;
      message?: string;
      meta?: Record<string, unknown>;
      name?: string;
    };
    
    return NextResponse.json({
      ok: false,
      error: {
        name: prismaError.name || "UnknownError",
        code: prismaError.code || "UNKNOWN",
        message: prismaError.message || String(error),
        meta: prismaError.meta || null,
        duration: `${duration}ms`,
        env: {
          nodeEnv: process.env.NODE_ENV,
          hasDbUrl: !!process.env.DATABASE_URL,
          hasDirectUrl: !!process.env.DIRECT_DATABASE_URL,
          dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + "...",
        },
      },
    }, { status: 500 });
  }
}
