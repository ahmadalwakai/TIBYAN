/**
 * Zyphon PDF Generation Types
 * 
 * Type definitions for PDF generation templates.
 */

export type PdfTemplateType = "teacher-report" | "certificate";

export interface TeacherReportData {
  teacherName: string;
  teacherNameEn?: string;
  reportDate: string;
  courseName: string;
  courseNameEn?: string;
  totalStudents: number;
  completedStudents: number;
  averageScore?: number;
  notes?: string;
}

export interface CertificateData {
  studentName: string;
  studentNameEn?: string;
  courseName: string;
  courseNameEn?: string;
  completionDate: string;
  grade?: string;
  score?: number;
  certificateNumber: string;
  instructorName?: string;
  courseDuration?: string;
}

export interface PdfGenerationRequest {
  type: PdfTemplateType;
  data: TeacherReportData | CertificateData;
}

export interface PdfGenerationResult {
  success: boolean;
  pdfBuffer?: Uint8Array;
  filename?: string;
  error?: string;
}

export const VALID_PDF_TYPES: PdfTemplateType[] = ["teacher-report", "certificate"];
export const MAX_PAYLOAD_SIZE = 100 * 1024; // 100KB
