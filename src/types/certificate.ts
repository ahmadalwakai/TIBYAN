/**
 * Certificate types and DTO definitions
 */

export interface CertificateDTO {
  id: string;
  certificateNumber: string;
  studentName: string;
  studentNameEn?: string | null;
  courseName: string;
  courseNameEn?: string | null;
  completionDate: string; // ISO date string
  grade?: string | null;
  score?: number | null;
  instructorName?: string | null;
  courseDuration?: string | null;
  templateType: string;
  userId?: string | null;
  courseId?: string | null;
  issuedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    name: string;
    email: string;
  } | null;
  course?: {
    title: string;
  } | null;
}

export interface CertificateListResponse {
  ok: boolean;
  data?: {
    certificates: CertificateDTO[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
}

export interface CertificateDetailResponse {
  ok: boolean;
  data?: CertificateDTO;
  error?: string;
}

export interface CertificateCreateResponse {
  ok: boolean;
  data?: CertificateDTO;
  error?: string;
}

export interface CertificateUpdateResponse {
  ok: boolean;
  data?: CertificateDTO;
  error?: string;
}

export interface CertificateDeleteResponse {
  ok: boolean;
  data?: { deleted: boolean };
  error?: string;
}

export interface ApiErrorResponse {
  ok: false;
  error: string;
}
