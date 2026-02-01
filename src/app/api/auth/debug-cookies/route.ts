import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/auth/debug-cookies
 * Debug endpoint to inspect cookie behavior
 */
export async function GET(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== "production";

  if (!isDev) {
    return NextResponse.json(
      { ok: false, error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    const rawCookieHeader = request.headers.get("cookie");

    return NextResponse.json({
      ok: true,
      data: {
        cookieCount: allCookies.length,
        cookies: allCookies.map((c) => ({
          name: c.name,
          valueLength: c.value?.length || 0,
          // Don't expose actual values for security
        })),
        hasAuthToken: allCookies.some((c) => c.name === "auth-token"),
        hasUserData: allCookies.some((c) => c.name === "user-data"),
        rawHeader: rawCookieHeader ? rawCookieHeader.substring(0, 200) : null,
      },
    });
  } catch (error) {
    console.error("[Debug Cookies] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to read cookies" },
      { status: 500 }
    );
  }
}
