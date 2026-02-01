import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Get JWT secret for Edge runtime
 */
function getJWTSecretEdge(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  const secretString = secret || "dev-fallback-secret-change-in-production-minimum-32-chars";
  return new TextEncoder().encode(secretString);
}

/**
 * Verify JWT token in proxy (Edge runtime compatible)
 * Returns the role if valid, null otherwise
 */
async function verifyTokenEdge(token: string): Promise<{ userId: string; role: string } | null> {
  try {
    const secret = getJWTSecretEdge();
    const { payload } = await jwtVerify(token, secret);
    
    if (typeof payload.userId !== "string" || typeof payload.role !== "string") {
      return null;
    }
    
    return { userId: payload.userId, role: payload.role };
  } catch {
    return null;
  }
}

/**
 * Next.js Proxy - protects /admin routes
 */
export default async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Allow admin login page without authentication
  // Add pathname header so layout can detect login page
  if (path === "/auth/admin-login") {
    const response = NextResponse.next();
    response.headers.set("x-pathname", path);
    return response;
  }

  // Skip proxy for non-admin routes
  if (!path.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Check for JWT token (new email-based admin auth)
  const authToken = request.cookies.get("auth-token")?.value;

  // If no token, redirect to admin login
  if (!authToken) {
    const loginUrl = new URL("/auth/admin-login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify JWT signature and expiration
  const payload = await verifyTokenEdge(authToken);
  
  if (!payload) {
    // Invalid or expired token - clear it and redirect to login
    const loginUrl = new URL("/auth/admin-login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    loginUrl.searchParams.set("error", "session_expired");
    
    const response = NextResponse.redirect(loginUrl);
    response.cookies.set({
      name: "auth-token",
      value: "",
      path: "/",
      maxAge: 0,
    });
    return response;
  }

  // Check if user has ADMIN role
  if (payload.role !== "ADMIN") {
    // Not an admin - redirect to home with error
    const homeUrl = new URL("/", request.url);
    homeUrl.searchParams.set("error", "access_denied");
    return NextResponse.redirect(homeUrl);
  }

  // Valid admin token - allow access with pathname header
  const response = NextResponse.next();
  response.headers.set("x-pathname", path);
  return response;
}

// Proxy matcher - only admin routes
export const config = {
  matcher: ["/admin/:path*", "/auth/admin-login"],
};
