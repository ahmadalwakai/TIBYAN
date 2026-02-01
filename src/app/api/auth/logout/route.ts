import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * Clear authentication cookies
 */
export async function POST() {
  const response = NextResponse.json(
    { ok: true, data: { message: "تم تسجيل الخروج بنجاح" } },
    { status: 200 }
  );

  const isDev = process.env.NODE_ENV !== "production";
  const sameSiteValue = isDev ? "lax" : "none";
  const secureValue = !isDev;

  // Clear auth-token cookie
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: secureValue,
    sameSite: sameSiteValue as "none" | "lax",
    maxAge: 0,
    path: "/",
  });

  // Clear user-data cookie (if exists)
  response.cookies.set("user-data", "", {
    maxAge: 0,
    path: "/",
  });

  return response;
}
