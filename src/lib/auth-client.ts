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
 * Get a cookie value by name
 */
function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

/**
 * Clear a cookie with various attribute combinations for robustness
 */
function clearCookie(name: string): void {
  const paths = ["/", ""];
  const sameSites = ["lax", "strict", "none"];
  
  for (const path of paths) {
    for (const sameSite of sameSites) {
      document.cookie = `${name}=; path=${path || "/"}; max-age=0; samesite=${sameSite}`;
    }
  }
}

/**
 * Logout the current user by clearing all auth cookies and notifying server
 */
export async function logout(): Promise<void> {
  try {
    // Get CSRF token for authenticated request
    const csrfToken = getCookieValue("csrf-token");
    
    // Build headers with CSRF token if available
    const headers: HeadersInit = {};
    if (csrfToken) {
      headers["x-csrf-token"] = csrfToken;
    }

    // Notify server to clear session
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      headers,
    });
  } catch {
    // Ignore errors, still clear locally
  }

  // Clear all auth cookies locally (robustly)
  clearCookie("auth-token");
  clearCookie("user-data");
  clearCookie("csrf-token");
  
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
export async function isAuthenticatedClient(): Promise<boolean> {
  if (typeof window === "undefined") return false;

  try {
    const response = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
    });

    return response.ok;
  } catch {
    return false;
  }
}
