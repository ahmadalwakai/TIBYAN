import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Force Node.js runtime - Prisma doesn't work in Edge
export const runtime = 'nodejs';
export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {
    timestamp: new Date().toISOString(),
    nodeEnv: process.env.NODE_ENV ?? "unknown",
    hasDbUrl: process.env.DATABASE_URL ? "yes" : "no",
    hasDirectDbUrl: process.env.DATABASE_URL_NON_POOLING ? "yes" : "no",
    hasResendKey: process.env.RESEND_API_KEY ? "yes" : "no",
    hasAppUrl: process.env.NEXT_PUBLIC_APP_URL ?? "not set",
  };

  // Test database connection
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    checks.database = "connected";
    checks.dbResult = JSON.stringify(result);
  } catch (dbError) {
    checks.database = "failed";
    checks.dbError = dbError instanceof Error ? dbError.message : String(dbError);
  }

  // Test user count
  try {
    const userCount = await prisma.user.count();
    checks.userCount = String(userCount);
  } catch (countError) {
    checks.userCountError = countError instanceof Error ? countError.message : String(countError);
  }

  return NextResponse.json({
    ok: checks.database === "connected",
    checks,
  });
}
