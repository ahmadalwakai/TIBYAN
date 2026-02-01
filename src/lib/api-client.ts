/**
 * Client-side API utilities
 * Wrapper around fetch to handle authentication and common patterns
 */

export interface ApiResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

/**
 * Make an authenticated API request from the client
 * Automatically includes credentials for cookie-based auth
 */
export async function fetchApi<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include", // Always include cookies
      headers: {
        ...options?.headers,
      },
    });

    const json = await response.json();
    return json as ApiResponse<T>;
  } catch (error) {
    console.error("API request failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "فشل الاتصال بالخادم",
    };
  }
}

/**
 * Make an authenticated GET request
 */
export async function apiGet<T = unknown>(url: string): Promise<ApiResponse<T>> {
  return fetchApi<T>(url, { method: "GET" });
}

/**
 * Make an authenticated POST request with JSON body
 */
export async function apiPost<T = unknown>(
  url: string,
  data: unknown
): Promise<ApiResponse<T>> {
  return fetchApi<T>(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/**
 * Make an authenticated PUT request with JSON body
 */
export async function apiPut<T = unknown>(
  url: string,
  data: unknown
): Promise<ApiResponse<T>> {
  return fetchApi<T>(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

/**
 * Make an authenticated DELETE request
 */
export async function apiDelete<T = unknown>(url: string): Promise<ApiResponse<T>> {
  return fetchApi<T>(url, { method: "DELETE" });
}

/**
 * Upload a file with authentication
 */
export async function apiUpload<T = unknown>(
  url: string,
  formData: FormData
): Promise<ApiResponse<T>> {
  return fetchApi<T>(url, {
    method: "POST",
    body: formData,
    // Don't set Content-Type - browser will set it with boundary
  });
}
