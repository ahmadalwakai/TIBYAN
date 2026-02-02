import { NextRequest, NextResponse } from "next/server";
import { requireCsrf, CSRF_COOKIE_NAME } from "@/lib/csrf";

/**
 * POST /api/auth/logout
 * Clear authentication cookies
 * Requires CSRF token if authenticated
 */
export async function POST(req: NextRequest) {
  // Enforce CSRF only when authenticated (has auth-token)
  const csrfError = requireCsrf(req, { onlyIfAuthenticated: true });
  if (csrfError) {
    return csrfError;
  }

  const response = NextResponse.json(
    { ok: true, data: { message: "تم تسجيل الخروج بنجاح" } },
    { status: 200 }
  );

  const isDev = process.env.NODE_ENV !== "production";
  const sameSiteValue: "lax" | "none" = isDev ? "lax" : "none";
  const secureValue = !isDev;

  // Clear auth-token cookie
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: secureValue,
    sameSite: sameSiteValue,
    maxAge: 0,
    path: "/",
  });

  // Clear user-data cookie
  response.cookies.set("user-data", "", {
    secure: secureValue,
    sameSite: sameSiteValue,
    maxAge: 0,
    path: "/",
  });

  // Clear csrf-token cookie
  response.cookies.set(CSRF_COOKIE_NAME, "", {
    secure: secureValue,
    sameSite: sameSiteValue,
    maxAge: 0,
    path: "/",
  });

  return response;
}
