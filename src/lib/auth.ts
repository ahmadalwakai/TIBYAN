import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/db";

export type UserRole = "ADMIN" | "INSTRUCTOR" | "STUDENT" | "MEMBER" | "GUEST";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/**
 * Get the current authenticated user from cookies (server-side)
 * Verifies JWT token and fetches fresh user data from DB
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
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
    console.error("[Auth] Failed to fetch user:", error);
    return null;
  }
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return user !== null;
}

/**
 * Require admin access - throws if not admin
 * Use this in admin page components
 */
export async function requireAdmin(): Promise<User> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error("Authentication required");
  }
  
  if (user.role !== "ADMIN") {
    throw new Error("Admin access required");
  }
  
  return user;
}
