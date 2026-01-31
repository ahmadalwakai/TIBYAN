import { NextResponse } from "next/server";
import { signToken } from "@/lib/jwt";
import { type CookieUserData, encodeUserData } from "@/lib/auth/cookie-encoding";

/**
 * DEV-ONLY endpoint for quick admin login without database
 *
 * POST /api/auth/dev-login
 *
 * This endpoint exists ONLY in development mode for UI testing
 * when the database is unavailable or you want to bypass auth.
 *
 * In production, this endpoint returns 404.
 */

const DEV_ADMIN_USER: CookieUserData = {
  id: "dev-admin-001",
  email: "dev-admin@tibyan.test",
  name: "Dev Admin",
  role: "ADMIN",
};

export async function POST(request: Request): Promise<NextResponse> {
  // CRITICAL: Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    console.log("[Dev-Login] Creating dev admin session...");

    // Sign JWT token for dev user
    const authToken = await signToken({
      userId: DEV_ADMIN_USER.id,
      role: DEV_ADMIN_USER.role,
    });

    const cookieMaxAge = 60 * 60 * 24; // 1 day for dev sessions

    // Cookie options for development
    const cookieOptions = {
      httpOnly: true,
      secure: false, // Dev is HTTP
      sameSite: "lax" as const,
      maxAge: cookieMaxAge,
      path: "/",
    };

    const url = new URL(request.url);
    const redirectParam = url.searchParams.get("redirect");
    const safeRedirect = redirectParam && redirectParam.startsWith("/") ? redirectParam : "/admin";

    // Build response
    const response = redirectParam
      ? NextResponse.redirect(new URL(safeRedirect, request.url), 303)
      : NextResponse.json({
          ok: true,
          data: {
            user: DEV_ADMIN_USER,
            token: authToken,
            message: "Dev login successful",
          },
        });

    // Set auth-token cookie
    response.cookies.set("auth-token", authToken, cookieOptions);

    // Set user-data cookie (readable by client)
    response.cookies.set("user-data", encodeUserData(DEV_ADMIN_USER), {
      ...cookieOptions,
      httpOnly: false,
    });

    // Debug: Log cookies
    const setCookieHeaders = response.headers.getSetCookie();
    console.log("[Dev-Login] Set-Cookie headers:", setCookieHeaders);

    console.log("[Dev-Login] Dev admin session created:", {
      userId: DEV_ADMIN_USER.id,
      email: DEV_ADMIN_USER.email,
      role: DEV_ADMIN_USER.role,
    });

    return response;
  } catch (error) {
    console.error("[Dev-Login] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to create dev session" },
      { status: 500 }
    );
  }
}

// Also return 404 for GET requests in production
export async function GET(request: Request): Promise<NextResponse> {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  if (url.searchParams.has("redirect")) {
    return POST(request);
  }

  return NextResponse.json({
    ok: true,
    message: "Dev login endpoint. Use POST to create a dev admin session.",
    devUser: DEV_ADMIN_USER,
  });
}
