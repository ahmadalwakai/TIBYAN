/**
 * Zyphon PDF Generation Module
 * 
 * Server-side PDF generation using pdf-lib.
 */

export type {
  PdfTemplateType,
  TeacherReportData,
  CertificateData,
  PdfGenerationRequest,
  PdfGenerationResult,
} from "./types";

export { VALID_PDF_TYPES, MAX_PAYLOAD_SIZE } from "./types";

export { generateTeacherReport } from "./templates/teacher-report";
export { generateCertificate } from "./templates/certificate";

import type { PdfGenerationRequest, PdfGenerationResult } from "./types";
import { generateTeacherReport } from "./templates/teacher-report";
import { generateCertificate } from "./templates/certificate";
import type { TeacherReportData, CertificateData } from "./types";

/**
 * Generate a PDF based on template type and data
 */
export async function generatePdf(
  request: PdfGenerationRequest
): Promise<PdfGenerationResult> {
  switch (request.type) {
    case "teacher-report":
      return generateTeacherReport(request.data as TeacherReportData);
    case "certificate":
      return generateCertificate(request.data as CertificateData);
    default:
      return {
        success: false,
        error: `Unknown template type: ${request.type}`,
      };
  }
}
