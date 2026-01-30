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
 * Mock login function - replace with real API call
 */
export async function login(credentials: LoginCredentials): Promise<{ ok: boolean; error?: string }> {
  try {
    // TODO: Replace with actual API call to your backend
    // For now, this is a mock implementation
    
    // Mock: Accept admin@tibyan.academy with password "admin123"
    if (credentials.email === "admin@tibyan.academy" && credentials.password === "admin123") {
      // Set auth cookies
      document.cookie = `auth-token=mock-token-${Date.now()}; path=/; max-age=86400; samesite=strict`;
      document.cookie = `user-role=admin; path=/; max-age=86400; samesite=strict`;
      document.cookie = `user-data=${JSON.stringify({
        id: "1",
        name: "Admin User",
        email: "admin@tibyan.academy",
        role: "admin"
      })}; path=/; max-age=86400; samesite=strict`;
      
      return { ok: true };
    }
    
    // Mock: Accept any other email as a student
    if (credentials.email && credentials.password) {
      document.cookie = `auth-token=mock-token-${Date.now()}; path=/; max-age=86400; samesite=strict`;
      document.cookie = `user-role=student; path=/; max-age=86400; samesite=strict`;
      document.cookie = `user-data=${JSON.stringify({
        id: "2",
        name: credentials.email.split("@")[0],
        email: credentials.email,
        role: "student"
      })}; path=/; max-age=86400; samesite=strict`;
      
      return { ok: true };
    }
    
    return { ok: false, error: "Invalid credentials" };
  } catch (error) {
    return { ok: false, error: "Login failed" };
  }
}

/**
 * Logout the current user
 */
export async function logout(): Promise<void> {
  // Clear auth cookies
  document.cookie = "auth-token=; path=/; max-age=0";
  document.cookie = "user-role=; path=/; max-age=0";
  document.cookie = "user-data=; path=/; max-age=0";
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
 * Get current user from cookies (client-side)
 */
export function getCurrentUserClient() {
  if (typeof window === "undefined") return null;
  
  const cookies = document.cookie.split("; ");
  const userDataCookie = cookies.find(c => c.startsWith("user-data="));
  
  if (!userDataCookie) return null;
  
  try {
    const userData = JSON.parse(decodeURIComponent(userDataCookie.split("=")[1]));
    return userData;
  } catch {
    return null;
  }
}
