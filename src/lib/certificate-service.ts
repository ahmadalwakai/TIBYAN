/**
 * Certificate service for API interactions
 * Handles all fetch calls with type safety and error handling
 */

import {
  CertificateListResponse,
  CertificateDetailResponse,
  CertificateCreateResponse,
  CertificateUpdateResponse,
  CertificateDeleteResponse,
} from "@/types/certificate";
import type { CreateCertificateInput, UpdateCertificateInput } from "@/lib/validations";

const API_BASE = "/api/admin/certificates";

/**
 * Fetch list of certificates with pagination and filtering
 */
export async function fetchCertificates(options?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<CertificateListResponse> {
  try {
    const params = new URLSearchParams();
    if (options?.page) params.append("page", options.page.toString());
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.search) params.append("search", options.search);
    if (options?.sortBy) params.append("sortBy", options.sortBy);
    if (options?.sortOrder) params.append("sortOrder", options.sortOrder);

    const res = await fetch(`${API_BASE}?${params}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      return { ok: false, error: "Failed to fetch certificates" };
    }

    const data = (await res.json()) as CertificateListResponse;
    return data;
  } catch (error) {
    console.error("Error fetching certificates:", error);
    return { ok: false, error: "Network error" };
  }
}

/**
 * Fetch single certificate by ID
 */
export async function fetchCertificate(
  id: string
): Promise<CertificateDetailResponse> {
  try {
    const params = new URLSearchParams({ id });
    const res = await fetch(`${API_BASE}?${params}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return { ok: false, error: "الشهادة غير موجودة" };
      }
      return { ok: false, error: "Failed to fetch certificate" };
    }

    const data = (await res.json()) as CertificateDetailResponse;
    return data;
  } catch (error) {
    console.error("Error fetching certificate:", error);
    return { ok: false, error: "Network error" };
  }
}

/**
 * Create a new certificate
 */
export async function createCertificate(
  payload: CreateCertificateInput
): Promise<CertificateCreateResponse> {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = (await res.json()) as { error?: string };
      return {
        ok: false,
        error: data.error || "Failed to create certificate",
      };
    }

    const data = (await res.json()) as CertificateCreateResponse;
    return data;
  } catch (error) {
    console.error("Error creating certificate:", error);
    return { ok: false, error: "Network error" };
  }
}

/**
 * Update an existing certificate
 */
export async function updateCertificate(
  id: string,
  payload: UpdateCertificateInput
): Promise<CertificateUpdateResponse> {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      if (res.status === 404) {
        return { ok: false, error: "الشهادة غير موجودة" };
      }
      const data = (await res.json()) as { error?: string };
      return {
        ok: false,
        error: data.error || "Failed to update certificate",
      };
    }

    const data = (await res.json()) as CertificateUpdateResponse;
    return data;
  } catch (error) {
    console.error("Error updating certificate:", error);
    return { ok: false, error: "Network error" };
  }
}

/**
 * Delete a certificate
 */
export async function deleteCertificate(
  id: string
): Promise<CertificateDeleteResponse> {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      if (res.status === 404) {
        return { ok: false, error: "الشهادة غير موجودة" };
      }
      const data = (await res.json()) as { error?: string };
      return {
        ok: false,
        error: data.error || "Failed to delete certificate",
      };
    }

    const data = (await res.json()) as CertificateDeleteResponse;
    return data;
  } catch (error) {
    console.error("Error deleting certificate:", error);
    return { ok: false, error: "Network error" };
  }
}
