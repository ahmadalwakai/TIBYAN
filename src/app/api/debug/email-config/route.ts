import { NextResponse } from "next/server";

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/email-config
 * Check email configuration (no sensitive data exposed)
 */
export async function GET() {
  const fromEmail = process.env.FROM_EMAIL;
  const hasResendKey = !!process.env.RESEND_API_KEY;
  const resendKeyPrefix = process.env.RESEND_API_KEY?.substring(0, 10) + "...";
  
  return NextResponse.json({
    ok: true,
    config: {
      FROM_EMAIL: fromEmail || "NOT SET",
      RESEND_API_KEY: hasResendKey ? resendKeyPrefix : "NOT SET",
      fromDomain: fromEmail ? fromEmail.split("@")[1] : "N/A",
    },
  });
}
