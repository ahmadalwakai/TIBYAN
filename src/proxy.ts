import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This proxy runs on EVERY request
export default function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect all /admin routes
  if (path.startsWith("/admin")) {
    // Check for auth token in cookies
    const token = request.cookies.get("auth-token")?.value;
    const userRole = request.cookies.get("user-role")?.value;

    // If no token or not an admin, redirect to login
    if (!token || userRole !== "admin") {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", path);
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

// Configure which routes this proxy runs on
export const config = {
  matcher: [
    // Protect all admin routes
    "/admin/:path*",
  ],
};
