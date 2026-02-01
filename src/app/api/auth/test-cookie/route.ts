import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * DEV-ONLY: Test cookie setting and reading
 * 
 * GET - read all cookies
 * POST - set a test cookie
 */

export async function GET(request: Request): Promise<NextResponse> {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  // Also check raw header
  const rawHeader = request.headers.get("cookie");

  return NextResponse.json({
    ok: true,
    cookies: allCookies.map(c => ({ name: c.name, valueLength: c.value.length })),
    rawCookieHeader: rawHeader,
    count: allCookies.length,
  });
}

export async function POST(): Promise<NextResponse> {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const testValue = `test-${Date.now()}`;
  
  const response = NextResponse.json({
    ok: true,
    message: "Test cookie set",
    testValue,
  });

  // In development, use SameSite=Lax; in production use SameSite=None; Secure
  const isDev = process.env.NODE_ENV === "development";
  const sameSiteValue = isDev ? "lax" : "none";
  const secureValue = !isDev;

  // Set a simple test cookie
  response.cookies.set("test-cookie", testValue, {
    httpOnly: false,
    secure: secureValue,
    sameSite: sameSiteValue as "none" | "lax",
    maxAge: 60 * 5, // 5 minutes
    path: "/",
  });

  // Log the Set-Cookie header
  console.log("[Test-Cookie] Set-Cookie headers:", response.headers.getSetCookie());

  return response;
}
