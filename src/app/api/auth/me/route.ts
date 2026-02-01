import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { type CookieUserData, encodeUserData } from "@/lib/auth/cookie-encoding";
import { prisma } from "@/lib/db";

// Force Node.js runtime for Prisma
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Parse user-data cookie - handles both raw JSON and URL-encoded JSON
 */
function parseUserDataCookie(rawValue: string): CookieUserData | null {
  try {
    let jsonStr = rawValue;
    
    // If it looks URL-encoded, decode it
    if (rawValue.includes("%")) {
      try {
        jsonStr = decodeURIComponent(rawValue);
      } catch {
        jsonStr = rawValue;
      }
    }
    
    const parsed = JSON.parse(jsonStr) as unknown;

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "id" in parsed &&
      "email" in parsed &&
      "name" in parsed &&
      "role" in parsed
    ) {
      return parsed as CookieUserData;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * User data structure returned by /api/auth/me
 */
interface AuthMeResponse {
  ok: boolean;
  data?: {
    id: string;
    email: string;
    name: string;
    role: string;
    authenticated: boolean;
  };
  error?: string;
}

const isDev = process.env.NODE_ENV === "development";

/**
 * GET /api/auth/me
 *
 * Verify the current user's authentication status by checking cookies server-side.
 * This endpoint is used after login to confirm cookies were properly set.
 *
 * IMPORTANT: This route does NOT hit the database to avoid failures when DB is down.
 * It only verifies:
 * 1. auth-token cookie exists and has a valid JWT signature + not expired
 * 2. user-data cookie exists and is decodable
 * 3. Both cookies reference the same user ID
 *
 * Returns:
 * - 200 with user data if authenticated
 * - 401 if not authenticated or invalid token
 */
export async function GET(request: Request): Promise<NextResponse<AuthMeResponse>> {
  try {
    const cookieStore = await cookies();

    // Debug: Log all cookies received
    if (isDev) {
      const allCookies = cookieStore.getAll();
      console.log("[Auth/Me] All cookies received:", allCookies.map(c => c.name));
      // Also check raw cookie header
      const rawCookieHeader = request.headers.get("cookie");
      console.log("[Auth/Me] Raw cookie header:", rawCookieHeader ? rawCookieHeader.substring(0, 100) : "(none)");
    }

    // Step 1: Check for auth-token cookie
    const authToken = cookieStore.get("auth-token")?.value;

    if (!authToken) {
      if (isDev) console.log("[Auth/Me] No auth-token cookie in store");
      return NextResponse.json({ ok: false, error: "No auth token" }, { status: 401 });
    }

    // Step 2: Verify JWT token (signature + expiry)
    const payload = await verifyToken(authToken);

    if (!payload) {
      if (isDev) console.log("[Auth/Me] Invalid or expired JWT");
      return NextResponse.json(
        { ok: false, error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    // Step 3: Try to get user data from cookie first, otherwise fetch from DB
    const rawUserData = cookieStore.get("user-data")?.value;
    let userData: CookieUserData | null = null;

    if (rawUserData) {
      try {
        userData = parseUserDataCookie(rawUserData);
      } catch {
        if (isDev) console.log("[Auth/Me] Failed to parse user-data cookie");
      }
    }

    // If no user-data cookie or invalid, fetch from database
    if (!userData) {
      if (isDev) console.log("[Auth/Me] No user-data cookie, fetching from DB...");
      try {
        const dbUser = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, email: true, name: true, role: true, status: true },
        });

        if (!dbUser) {
          if (isDev) console.log("[Auth/Me] User not found in DB");
          return NextResponse.json(
            { ok: false, error: "User not found" },
            { status: 401 }
          );
        }

        // Check if user is still active
        if (dbUser.status !== "ACTIVE") {
          if (isDev) console.log("[Auth/Me] User status is not ACTIVE:", dbUser.status);
          return NextResponse.json(
            { ok: false, error: "Account is not active" },
            { status: 401 }
          );
        }

        userData = {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
        };

        // Set the missing user-data cookie for future requests
        const response = NextResponse.json({
          ok: true,
          data: {
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            authenticated: true,
          },
        });

        response.cookies.set("user-data", encodeUserData(userData), {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 7, // 7 days
          path: "/",
        });

        if (isDev) console.log("[Auth/Me] Set missing user-data cookie from DB");
        return response;
      } catch (dbError) {
        if (isDev) console.log("[Auth/Me] DB error:", dbError);
        return NextResponse.json(
          { ok: false, error: "Database error" },
          { status: 500 }
        );
      }
    }

    // At this point, userData is guaranteed non-null (we return early if fetch failed)
    // TypeScript doesn't track this control flow perfectly, so we assert
    if (!userData) {
      return NextResponse.json({ ok: false, error: "User data unavailable" }, { status: 401 });
    }

    // Step 4: Verify user IDs match between JWT and user-data cookie
    if (userData.id !== payload.userId) {
      if (isDev) {
        console.log("[Auth/Me] User ID mismatch:", {
          jwtUserId: payload.userId,
          cookieUserId: userData.id,
        });
      }
      return NextResponse.json(
        { ok: false, error: "Token user mismatch" },
        { status: 401 }
      );
    }

    // Step 5: Verify role matches
    if (userData.role !== payload.role) {
      if (isDev) {
        console.log("[Auth/Me] Role mismatch:", {
          jwtRole: payload.role,
          cookieRole: userData.role,
        });
      }
      return NextResponse.json(
        { ok: false, error: "Token role mismatch" },
        { status: 401 }
      );
    }

    // Success - return user data from cookie (no DB hit)
    if (isDev) {
      console.log("[Auth/Me] Success:", {
        userId: userData.id,
        email: userData.email,
        role: userData.role,
      });
    }

    return NextResponse.json({
      ok: true,
      data: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        authenticated: true,
      },
    });
  } catch (error) {
    console.error("[Auth/Me] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Authentication check failed" },
      { status: 500 }
    );
  }
}
