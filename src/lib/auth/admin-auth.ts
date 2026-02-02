/**
 * Admin Auth Client Hook
 * Utilities for client-side admin authentication
 */

import { useState } from "react";

export interface AdminAuthResponse {
  ok: boolean;
  data?: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
    token: string;
  };
  error?: string;
}

export function useAdminAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCode = async (email: string) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      const data = await response.json();

      if (!data.ok) {
        setError(data.error || "Failed to request code");
        return null;
      }

      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (email: string, code: string) => {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
        credentials: "include",
      });

      const data: AdminAuthResponse = await response.json();

      if (!data.ok) {
        setError(data.error || "Verification failed");
        return null;
      }

      // Token is set in httpOnly cookie automatically
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Network error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear auth cookie via API
    fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    // Full page reload to ensure cookies are cleared
    window.location.href = "/auth/admin-login";
  };

  return {
    requestCode,
    verifyCode,
    logout,
    loading,
    error,
    setError,
  };
}
