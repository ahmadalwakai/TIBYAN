import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/db";
import { LoginSchema } from "@/lib/validations";
import { RATE_LIMITS, checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { encodeUserData, type CookieUserData } from "@/lib/auth/cookie-encoding";

// Force Node.js runtime for Prisma
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Validate redirect URL to prevent open redirects
 */
function isSafeRedirect(url: string | null, defaultPath: string = "/member"): string {
  if (!url) return defaultPath;

  try {
    // Only allow relative URLs starting with /
    if (!url.startsWith("/")) return defaultPath;

    // Whitelist of allowed redirect paths
    const allowedPrefixes = ["/member", "/teacher", "/admin", "/courses", "/"];
    const isAllowed = allowedPrefixes.some((prefix) => url === prefix || url.startsWith(prefix + "/"));

    return isAllowed ? url : defaultPath;
  } catch {
    return defaultPath;
  }
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  try {
    let body: { email?: string; password?: string } = {};
    let redirectParam: string | null = null;

    if (isJson) {
      const jsonBody = (await request.json()) as { email?: string; password?: string; redirect?: string };
      body = { email: jsonBody.email, password: jsonBody.password };
      redirectParam = jsonBody.redirect ?? null;
    } else {
      const form = await request.formData();
      body = {
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      };
      const rawRedirect = form.get("redirect");
      redirectParam = rawRedirect ? String(rawRedirect) : null;
    }

    // Validate and sanitize redirect
    const safeRedirect = isSafeRedirect(redirectParam);

    // Check rate limiting
    const { limited, remaining, resetTime } = checkRateLimit(
      getClientIp(request),
      RATE_LIMITS.auth
    );

    if (limited) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      if (isJson) {
        return NextResponse.json(
          { ok: false, error: "عدد المحاولات كثير جداً. يرجى المحاولة لاحقاً." },
          {
            status: 429,
            headers: {
              "Retry-After": retryAfter.toString(),
              "X-RateLimit-Limit": RATE_LIMITS.auth.maxRequests.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": resetTime.toString(),
            },
          }
        );
      }

      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("error", "rate-limited");
      loginUrl.searchParams.set("redirect", safeRedirect);
      return NextResponse.redirect(loginUrl, 303);
    }

    // Validate input with strict schema
    const result = LoginSchema.safeParse(body);
    if (!result.success) {
      if (isJson) {
        return NextResponse.json(
          { ok: false, error: result.error.issues[0].message },
          { status: 400 }
        );
      }

      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("error", "validation");
      loginUrl.searchParams.set("redirect", safeRedirect);
      return NextResponse.redirect(loginUrl, 303);
    }

    const { email, password } = result.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      if (isJson) {
        return NextResponse.json(
          { ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
          { status: 401 }
        );
      }

      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("error", "invalid-credentials");
      loginUrl.searchParams.set("redirect", safeRedirect);
      return NextResponse.redirect(loginUrl, 303);
    }

    // Check if email is verified
    // MEMBER role can skip this (community members)
    // STUDENT, INSTRUCTOR, ADMIN must verify
    const emailVerified = (user as { emailVerified?: boolean }).emailVerified;
    if (emailVerified === false && user.role !== "MEMBER") {
      if (isJson) {
        return NextResponse.json(
          { ok: false, error: "يرجى تأكيد بريدك الإلكتروني أولاً" },
          { status: 403 }
        );
      }

      const verifyUrl = new URL("/auth/verify-pending", request.url);
      verifyUrl.searchParams.set("email", email);
      return NextResponse.redirect(verifyUrl, 303);
    }

    // Check if user is suspended
    if (user.status === "SUSPENDED") {
      if (isJson) {
        return NextResponse.json(
          { ok: false, error: "تم تعليق حسابك. يرجى التواصل مع الدعم." },
          { status: 403 }
        );
      }

      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("error", "suspended");
      loginUrl.searchParams.set("redirect", safeRedirect);
      return NextResponse.redirect(loginUrl, 303);
    }

    // Check if user is pending
    if (user.status === "PENDING") {
      if (isJson) {
        return NextResponse.json(
          { ok: false, error: "حسابك قيد المراجعة" },
          { status: 403 }
        );
      }

      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("error", "pending");
      loginUrl.searchParams.set("redirect", safeRedirect);
      return NextResponse.redirect(loginUrl, 303);
    }

    // Verify password
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      if (isJson) {
        return NextResponse.json(
          { ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
          { status: 401 }
        );
      }

      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("error", "invalid-credentials");
      loginUrl.searchParams.set("redirect", safeRedirect);
      return NextResponse.redirect(loginUrl, 303);
    }

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    });

    // Sign JWT token
    const { signToken } = await import("@/lib/jwt");
    const authToken = await signToken({
      userId: user.id,
      role: user.role,
    });

    // Minimal user data for cookie
    const cookieUserData: CookieUserData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const isProduction = process.env.NODE_ENV === "production";
    const cookieMaxAge = 60 * 60 * 24 * 7; // 7 days

    // Cookie options
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction, // HTTPS only in production
      sameSite: "lax" as const, // Works with HTTP on localhost
      maxAge: cookieMaxAge,
      path: "/",
    };

    const defaultRedirect =
      user.role === "ADMIN" ? "/admin" : user.role === "INSTRUCTOR" ? "/teacher" : user.role === "MEMBER" ? "/member" : "/courses";
    const requestedRedirect = isSafeRedirect(redirectParam);
    const successRedirect =
      requestedRedirect.startsWith("/admin") && user.role !== "ADMIN"
        ? "/courses"
        : requestedRedirect;

    // ALWAYS use redirect for login success, not JSON
    // This ensures Set-Cookie headers are processed by browser before page loads
    const response = NextResponse.redirect(new URL(successRedirect, request.url), 303);

    // Set cookies with proper headers
    // Use Set-Cookie headers directly for reliability
    const authTokenCookie = `auth-token=${authToken}; Path=/; Max-Age=${cookieOptions.maxAge}; SameSite=Lax${isProduction ? "; Secure" : ""}; HttpOnly`;
    const userDataCookie = `user-data=${encodeUserData(cookieUserData)}; Path=/; Max-Age=${cookieOptions.maxAge}; SameSite=Lax${isProduction ? "; Secure" : ""}`;
    
    response.headers.append("Set-Cookie", authTokenCookie);
    response.headers.append("Set-Cookie", userDataCookie);

    if (process.env.NODE_ENV === "development") {
      console.log("[Login] ✅ Login successful for:", {
        userId: user.id,
        email: user.email,
        role: user.role,
        redirectTo: successRedirect,
      });
    }

    response.headers.set("X-RateLimit-Limit", RATE_LIMITS.auth.maxRequests.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", resetTime.toString());

    return response;
  } catch (error) {
    console.error("[Login] Error:", error);
    if (isJson) {
      return NextResponse.json(
        { ok: false, error: "حدث خطأ في تسجيل الدخول" },
        { status: 500 }
      );
    }

    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("error", "server");
    loginUrl.searchParams.set("redirect", "/member");
    return NextResponse.redirect(loginUrl, 303);
  }
}

