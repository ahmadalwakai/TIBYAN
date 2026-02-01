"use client";

/**
 * Client-side authentication utilities
 * These run in the browser and should be used in Client Components
 */

import { useRouter } from "next/navigation";
import { useCallback } from "react";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name: string;
}

/**
 * Logout the current user by clearing all auth cookies and notifying server
 */
export async function logout(): Promise<void> {
  try {
    // Notify server to clear session
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Ignore errors, still clear locally
  }

  // Clear auth cookies locally
  document.cookie = "auth-token=; path=/; max-age=0; samesite=lax";
  document.cookie = "user-data=; path=/; max-age=0; samesite=lax";
  
  // Full page reload to ensure all auth state is cleared
  window.location.href = "/auth/login";
}

/**
 * Hook to handle logout with redirect
 */
export function useLogout() {
  const router = useRouter();

  return useCallback(async () => {
    await logout();
    router.push("/auth/login");
    router.refresh();
  }, [router]);
}

/**
 * User data structure from cookie
 */
export interface CookieUserData {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "INSTRUCTOR" | "STUDENT" | "MEMBER" | "GUEST";
}

/**
 * Get current user from cookies (client-side)
 * Handles URI-encoded cookie values
 */
export function getCurrentUserClient(): CookieUserData | null {
  if (typeof window === "undefined") return null;

  const cookies = document.cookie.split("; ");
  const userDataCookie = cookies.find((c) => c.startsWith("user-data="));

  if (!userDataCookie) return null;

  try {
    // Get the value after "user-data="
    const encoded = userDataCookie.substring("user-data=".length);
    // Decode URI encoding, then parse JSON
    const decoded = decodeURIComponent(encoded);
    const userData = JSON.parse(decoded) as unknown;

    // Validate structure
    if (
      typeof userData === "object" &&
      userData !== null &&
      "id" in userData &&
      "email" in userData &&
      "name" in userData &&
      "role" in userData
    ) {
      return userData as CookieUserData;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Check if user is authenticated (client-side)
 * Note: This only checks if cookies exist, not if they're valid
 */
export function isAuthenticatedClient(): boolean {
  if (typeof window === "undefined") return false;

  const cookies = document.cookie;
  const hasAuthToken = cookies.includes("auth-token=");
  const hasUserData = cookies.includes("user-data=");

  return hasAuthToken && hasUserData;
}
