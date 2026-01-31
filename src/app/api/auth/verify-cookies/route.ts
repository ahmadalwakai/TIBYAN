import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * GET /api/auth/verify-cookies
 * 
 * DEV ONLY: Server-side verification endpoint to test cookie encoding/decoding
 * without needing browser DevTools.
 * 
 * Returns detailed info about cookie state for automated testing.
 */
export async function GET() {
  // Only available in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Not available in production" }, { status: 404 });
  }

  const cookieStore = await cookies();
  const authToken = cookieStore.get("auth-token")?.value;
  const rawUserData = cookieStore.get("user-data")?.value;

  const result: {
    authToken: { present: boolean; preview: string };
    userData: {
      present: boolean;
      raw: string;
      decoded: string | null;
      parsed: unknown;
      valid: boolean;
      error: string | null;
    };
    wouldPassMiddleware: boolean;
    reason: string;
  } = {
    authToken: {
      present: !!authToken,
      preview: authToken ? authToken.substring(0, 30) + "..." : "",
    },
    userData: {
      present: !!rawUserData,
      raw: rawUserData ?? "",
      decoded: null,
      parsed: null,
      valid: false,
      error: null,
    },
    wouldPassMiddleware: false,
    reason: "",
  };

  // Check auth token
  if (!authToken) {
    result.reason = "missing-auth-token";
    return NextResponse.json(result);
  }

  // Check user data
  if (!rawUserData) {
    result.reason = "missing-user-data";
    return NextResponse.json(result);
  }

  // Try to decode and parse user data
  try {
    const decoded = decodeURIComponent(rawUserData);
    result.userData.decoded = decoded;

    const parsed = JSON.parse(decoded);
    result.userData.parsed = parsed;

    // Validate structure
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.id === "string" &&
      typeof parsed.email === "string" &&
      typeof parsed.name === "string" &&
      typeof parsed.role === "string" &&
      ["ADMIN", "INSTRUCTOR", "STUDENT", "GUEST"].includes(parsed.role)
    ) {
      result.userData.valid = true;

      if (parsed.role === "ADMIN") {
        result.wouldPassMiddleware = true;
        result.reason = "ok";
      } else {
        result.reason = "not-admin-role";
      }
    } else {
      result.userData.error = "Invalid structure";
      result.reason = "invalid-userdata-structure";
    }
  } catch (e) {
    result.userData.error = e instanceof Error ? e.message : "Parse error";
    result.reason = "decode-parse-error";
  }

  return NextResponse.json(result);
}
