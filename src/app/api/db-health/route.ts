import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/db-health
 * Test database connection in production
 */
export async function GET() {
  const startTime = Date.now();
  
  const result = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      connected: false,
      latencyMs: 0,
      error: null as string | null,
      errorCode: null as string | null,
    },
    env: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasDirectDatabaseUrl: !!process.env.DIRECT_DATABASE_URL,
      databaseUrlPrefix: process.env.DATABASE_URL?.substring(0, 50) + "...",
      directUrlPrefix: process.env.DIRECT_DATABASE_URL?.substring(0, 50) + "...",
    },
  };

  try {
    // Simple query to test connection
    await db.$queryRaw`SELECT 1 as test`;
    
    result.database.connected = true;
    result.database.latencyMs = Date.now() - startTime;
    
    return NextResponse.json({
      ok: true,
      message: "✅ Database connected successfully",
      ...result,
    });
  } catch (error) {
    result.database.latencyMs = Date.now() - startTime;
    
    if (error instanceof Error) {
      result.database.error = error.message;
      // Extract Prisma error code if available
      if ('code' in error) {
        result.database.errorCode = String((error as { code: string }).code);
      }
    }
    
    return NextResponse.json({
      ok: false,
      message: "❌ Database connection failed",
      ...result,
    }, { status: 500 });
  }
}
