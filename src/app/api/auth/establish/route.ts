import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyToken } from "@/lib/jwt";
import { encodeUserData } from "@/lib/auth/cookie-encoding";

const EstablishSchema = z.object({
  token: z.string().min(1),
  user: z.object({
    id: z.string().min(1),
    email: z.string().email(),
    name: z.string().min(1),
    role: z.enum(["ADMIN", "INSTRUCTOR", "STUDENT", "GUEST"]),
  }),
  redirect: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    if (process.env.NODE_ENV === "development") {
      console.log("[Auth/Establish] Request received");
    }
    const contentType = request.headers.get("content-type") || "";
    let body: unknown;

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const form = await request.formData();
      body = {
        token: form.get("token"),
        user: form.get("user") ? JSON.parse(String(form.get("user"))) : null,
        redirect: form.get("redirect") ? String(form.get("redirect")) : undefined,
      };
    }

    const result = EstablishSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: result.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { token, user, redirect } = result.data;

    // Verify token
    const payload = await verifyToken(token);
    if (!payload || payload.userId !== user.id || payload.role !== user.role) {
      return NextResponse.json(
        { ok: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    const isProduction = process.env.NODE_ENV === "production";
    const cookieMaxAge = 60 * 60 * 24 * 7; // 7 days

    const safeRedirect = redirect && redirect.startsWith("/") ? redirect : "/admin";

    const response = NextResponse.redirect(
      new URL(safeRedirect, request.url),
      303
    );
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      maxAge: cookieMaxAge,
      path: "/",
    });
    response.cookies.set("user-data", encodeUserData(user), {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      maxAge: cookieMaxAge,
      path: "/",
    });

    if (process.env.NODE_ENV === "development") {
      console.log("[Auth/Establish] Cookies set, redirecting to:", safeRedirect);
    }

    return response;
  } catch (error) {
    console.error("[Auth/Establish] Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to establish session" },
      { status: 500 }
    );
  }
}