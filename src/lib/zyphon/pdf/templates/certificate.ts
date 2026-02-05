/**
 * Certificate PDF Template
 * 
 * Generates a professional completion certificate PDF.
 */

import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { CertificateData, PdfGenerationResult } from "../types";

export async function generateCertificate(
  data: CertificateData
): Promise<PdfGenerationResult> {
  try {
    const pdfDoc = await PDFDocument.create();
    // Landscape A4 for certificate
    const page = pdfDoc.addPage([842, 595]);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const { width, height } = page.getSize();

    // Decorative border
    const borderMargin = 30;
    page.drawRectangle({
      x: borderMargin,
      y: borderMargin,
      width: width - 2 * borderMargin,
      height: height - 2 * borderMargin,
      borderColor: rgb(0.6, 0.5, 0.2),
      borderWidth: 3,
    });

    // Inner border
    page.drawRectangle({
      x: borderMargin + 10,
      y: borderMargin + 10,
      width: width - 2 * borderMargin - 20,
      height: height - 2 * borderMargin - 20,
      borderColor: rgb(0.6, 0.5, 0.2),
      borderWidth: 1,
    });

    // Header - Academy name
    const headerText = "Tibyan Academy";
    const headerWidth = fontBold.widthOfTextAtSize(headerText, 32);
    page.drawText(headerText, {
      x: (width - headerWidth) / 2,
      y: height - 80,
      size: 32,
      font: fontBold,
      color: rgb(0.1, 0.3, 0.6),
    });

    // Arabic name
    const arabicName = "معهد تبيان";
    const arabicWidth = font.widthOfTextAtSize(arabicName, 18);
    page.drawText(arabicName, {
      x: (width - arabicWidth) / 2,
      y: height - 105,
      size: 18,
      font,
      color: rgb(0.3, 0.3, 0.3),
    });

    // Certificate title
    const titleText = "Certificate of Completion";
    const titleWidth = fontBold.widthOfTextAtSize(titleText, 28);
    page.drawText(titleText, {
      x: (width - titleWidth) / 2,
      y: height - 160,
      size: 28,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });

    // "This is to certify that"
    const certifyText = "This is to certify that";
    const certifyWidth = fontItalic.widthOfTextAtSize(certifyText, 14);
    page.drawText(certifyText, {
      x: (width - certifyWidth) / 2,
      y: height - 210,
      size: 14,
      font: fontItalic,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Student name
    const nameWidth = fontBold.widthOfTextAtSize(data.studentName, 26);
    page.drawText(data.studentName, {
      x: (width - nameWidth) / 2,
      y: height - 250,
      size: 26,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    // English name if different
    if (data.studentNameEn && data.studentNameEn !== data.studentName) {
      const enNameWidth = font.widthOfTextAtSize(data.studentNameEn, 16);
      page.drawText(data.studentNameEn, {
        x: (width - enNameWidth) / 2,
        y: height - 275,
        size: 16,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }

    // "has successfully completed"
    const completedText = "has successfully completed the course";
    const completedWidth = fontItalic.widthOfTextAtSize(completedText, 14);
    page.drawText(completedText, {
      x: (width - completedWidth) / 2,
      y: height - 310,
      size: 14,
      font: fontItalic,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Course name
    const courseWidth = fontBold.widthOfTextAtSize(data.courseName, 22);
    page.drawText(data.courseName, {
      x: (width - courseWidth) / 2,
      y: height - 345,
      size: 22,
      font: fontBold,
      color: rgb(0.1, 0.3, 0.6),
    });

    // English course name if different
    if (data.courseNameEn && data.courseNameEn !== data.courseName) {
      const enCourseWidth = font.widthOfTextAtSize(data.courseNameEn, 14);
      page.drawText(data.courseNameEn, {
        x: (width - enCourseWidth) / 2,
        y: height - 368,
        size: 14,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
    }

    // Details line
    let detailsY = height - 410;
    const detailsItems: string[] = [];

    if (data.courseDuration) {
      detailsItems.push(`Duration: ${data.courseDuration}`);
    }
    if (data.grade) {
      detailsItems.push(`Grade: ${data.grade}`);
    }
    if (data.score !== undefined) {
      detailsItems.push(`Score: ${data.score}%`);
    }

    if (detailsItems.length > 0) {
      const detailsText = detailsItems.join("  •  ");
      const detailsWidth = font.widthOfTextAtSize(detailsText, 12);
      page.drawText(detailsText, {
        x: (width - detailsWidth) / 2,
        y: detailsY,
        size: 12,
        font,
        color: rgb(0.4, 0.4, 0.4),
      });
      detailsY -= 30;
    }

    // Date
    const dateText = `Awarded on ${data.completionDate}`;
    const dateWidth = font.widthOfTextAtSize(dateText, 12);
    page.drawText(dateText, {
      x: (width - dateWidth) / 2,
      y: detailsY,
      size: 12,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Instructor signature area (left side)
    if (data.instructorName) {
      page.drawLine({
        start: { x: 150, y: 100 },
        end: { x: 350, y: 100 },
        thickness: 1,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      const instructorWidth = font.widthOfTextAtSize(data.instructorName, 12);
      page.drawText(data.instructorName, {
        x: 250 - instructorWidth / 2,
        y: 85,
        size: 12,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });

      const instructorLabel = "Instructor";
      const labelWidth = font.widthOfTextAtSize(instructorLabel, 10);
      page.drawText(instructorLabel, {
        x: 250 - labelWidth / 2,
        y: 70,
        size: 10,
        font,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    // Certificate number (right side)
    const certNumText = `Certificate No: ${data.certificateNumber}`;
    const certNumWidth = font.widthOfTextAtSize(certNumText, 10);
    page.drawText(certNumText, {
      x: width - 150 - certNumWidth / 2,
      y: 85,
      size: 10,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Footer
    const footerText = "Verified by Tibyan Academy • Zyphon AI";
    const footerWidth = font.widthOfTextAtSize(footerText, 9);
    page.drawText(footerText, {
      x: (width - footerWidth) / 2,
      y: 45,
      size: 9,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });

    const pdfBuffer = await pdfDoc.save();
    const filename = `certificate-${data.certificateNumber || Date.now()}.pdf`;

    return {
      success: true,
      pdfBuffer,
      filename,
    };
  } catch (error) {
    console.error("[PDF] Certificate generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate PDF",
    };
  }
}
