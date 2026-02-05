import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/jwt";
import { encodeUserData, type CookieUserData } from "@/lib/auth/cookie-encoding";
import { createCsrfToken, CSRF_COOKIE_NAME, CSRF_MAX_AGE } from "@/lib/csrf";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs";

// Force Node.js runtime for Prisma
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Zod schema for request validation
const GoogleAuthSchema = z.object({
  credential: z.string().min(1, "Google credential is required"),
});

// Initialize OAuth2Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const result = GoogleAuthSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { credential } = result.data;

    // Verify Google ID token
    let ticket;
    try {
      ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (error) {
      console.error("[Google Auth] Token verification failed:", error);
      return NextResponse.json(
        { ok: false, error: "رمز Google غير صالح" },
        { status: 401 }
      );
    }

    const payload = ticket.getPayload();
    if (!payload) {
      return NextResponse.json(
        { ok: false, error: "لم يتم العثور على بيانات المستخدم" },
        { status: 401 }
      );
    }

    // Extract user info from Google token
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || payload.email?.split("@")[0] || "مستخدم";
    const picture = payload.picture;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "البريد الإلكتروني مطلوب من حساب Google" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Upsert user: find by googleId first, then by email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email: { equals: normalizedEmail, mode: "insensitive" } },
        ],
      },
    });

    if (user) {
      // User exists - link googleId if missing
      if (!user.googleId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId,
            emailVerified: true,
            avatar: user.avatar || picture,
            lastActiveAt: new Date(),
          },
        });
      } else {
        // Just update last active
        user = await prisma.user.update({
          where: { id: user.id },
          data: { lastActiveAt: new Date() },
        });
      }

      // Check if user is suspended
      if (user.status === "SUSPENDED") {
        return NextResponse.json(
          { ok: false, error: "تم تعليق حسابك. يرجى التواصل مع الدعم." },
          { status: 403 }
        );
      }

      // Check if user is pending
      if (user.status === "PENDING") {
        return NextResponse.json(
          { ok: false, error: "حسابك قيد المراجعة" },
          { status: 403 }
        );
      }
    } else {
      // Create new user
      // Generate a random password for Google-only users (they won't use it)
      const randomPassword = randomBytes(32).toString("hex");
      const hashedPassword = await hash(randomPassword, 12);

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name,
          password: hashedPassword,
          googleId,
          emailVerified: true, // Google email is verified
          avatar: picture,
          role: "STUDENT",
          status: "ACTIVE",
        },
      });
    }

    // Sign JWT token
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

    // Cookie options: production uses SameSite=None; Secure, dev uses SameSite=Lax
    const isDev = process.env.NODE_ENV !== "production";
    const sameSiteValue = isDev ? "Lax" : "None";
    const secureAttr = isDev ? "" : "; Secure";

    const authTokenCookie = `auth-token=${authToken}; Path=/; Max-Age=604800; SameSite=${sameSiteValue}${secureAttr}; HttpOnly`;
    const userDataCookie = `user-data=${encodeUserData(cookieUserData)}; Path=/; Max-Age=604800; SameSite=${sameSiteValue}${secureAttr}`;
    const csrfTokenCookie = `${CSRF_COOKIE_NAME}=${createCsrfToken()}; Path=/; Max-Age=${CSRF_MAX_AGE}; SameSite=${sameSiteValue}${secureAttr}`;

    const response = NextResponse.json({ ok: true });

    // Set cookies with proper headers
    response.headers.append("Set-Cookie", authTokenCookie);
    response.headers.append("Set-Cookie", userDataCookie);
    response.headers.append("Set-Cookie", csrfTokenCookie);

    if (process.env.NODE_ENV === "development") {
      console.log("[Google Auth] ✅ Login successful for:", {
        userId: user.id,
        email: user.email,
        role: user.role,
        isNewUser: !user.googleId,
      });
    }

    return response;
  } catch (error) {
    console.error("[Google Auth] Error:", error);
    return NextResponse.json(
      { ok: false, error: "حدث خطأ في تسجيل الدخول بـ Google" },
      { status: 500 }
    );
  }
}
