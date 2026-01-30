import { cookies } from "next/headers";

export type UserRole = "admin" | "instructor" | "student" | "guest";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

/**
 * Get the current authenticated user from cookies (server-side)
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;
  const userDataStr = cookieStore.get("user-data")?.value;

  if (!token || !userDataStr) {
    return null;
  }

  try {
    const userData = JSON.parse(userDataStr);
    return userData as User;
  } catch {
    return null;
  }
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "admin";
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
  
  if (user.role !== "admin") {
    throw new Error("Admin access required");
  }
  
  return user;
}
