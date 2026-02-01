/**
 * API Authentication Utilities
 * Server-side auth guards for API routes
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/db";

export type UserRole = "ADMIN" | "INSTRUCTOR" | "STUDENT" | "MEMBER" | "GUEST";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/**
 * Get authenticated user from request
 * Verifies JWT token and fetches fresh user data from DB
 */
async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return null;
  }

  // Verify JWT
  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  // Fetch fresh user data from database
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
    };
  } catch (error) {
    console.error("[API Auth] Failed to fetch user:", error);
    return null;
  }
}

/**
 * Require authenticated user for API route
 * Returns user if authenticated, or 401 error response
 */
export async function requireUser(
  request: NextRequest
): Promise<AuthenticatedUser | NextResponse> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  return user;
}

/**
 * Require specific role for API route
 * Returns user if authorized, or 403 error response
 */
export async function requireRole(
  request: NextRequest,
  role: UserRole
): Promise<AuthenticatedUser | NextResponse> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  if (user.role !== role && user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  return user;
}

/**
 * Require admin role for API route
 * Returns user if admin, or 403 error response
 */
export async function requireAdmin(
  request: NextRequest
): Promise<AuthenticatedUser | NextResponse> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  if (user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "Admin access required" },
      { status: 403 }
    );
  }

  return user;
}

/**
 * Get authenticated admin user from request (non-blocking)
 * Returns user if admin, or null
 */
export async function getAdminFromRequest(
  _request: NextRequest
): Promise<AuthenticatedUser | null> {
  const user = await getAuthenticatedUser();
  if (!user || user.role !== "ADMIN") {
    return null;
  }
  return user;
}

/**
 * Get authenticated user from request (non-blocking)
 * Returns user if authenticated, or null
 */
export async function getUserFromRequest(
  _request: NextRequest
): Promise<AuthenticatedUser | null> {
  return getAuthenticatedUser();
}
