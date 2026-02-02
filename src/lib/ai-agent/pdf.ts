/**
 * AI Agent - PDF Module
 * Full PDF support: read, create, edit, merge, split
 * Uses pdf-lib for manipulation
 */

import { PDFDocument, rgb, StandardFonts, PageSizes, degrees } from "pdf-lib";
import type { ToolContext, ToolResult } from "./types";

// ============================================
// Types
// ============================================

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export interface PDFPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
}

export interface PDFReadResult {
  text: string;
  pages: PDFPageInfo[];
  metadata: PDFMetadata;
  pageCount: number;
  isEncrypted: boolean;
}

export interface PDFCreateOptions {
  title?: string;
  author?: string;
  pageSize?: "A4" | "LETTER" | "LEGAL";
  margins?: { top: number; right: number; bottom: number; left: number };
}

export interface TextContent {
  text: string;
  fontSize?: number;
  fontColor?: { r: number; g: number; b: number };
  bold?: boolean;
  alignment?: "left" | "center" | "right";
}

export interface PDFPage {
  content: TextContent[];
  images?: Array<{
    base64: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

// ============================================
// PDF Service
// ============================================

class PDFService {
  private defaultMargins = { top: 50, right: 50, bottom: 50, left: 50 };

  /**
   * Read PDF content and extract text
   * Note: pdf-lib doesn't support text extraction, so we use basic info
   * For full text extraction, consider using pdfjs-dist in the future
   */
  async readPDF(
    input: Buffer | string,
    context?: ToolContext
  ): Promise<ToolResult<PDFReadResult>> {
    const startTime = Date.now();

    try {
      // Get buffer from input
      let pdfBuffer: Buffer;
      
      if (typeof input === "string") {
        // Check if it's base64
        if (input.startsWith("data:application/pdf;base64,")) {
          pdfBuffer = Buffer.from(input.replace("data:application/pdf;base64,", ""), "base64");
        } else if (input.match(/^[A-Za-z0-9+/]+=*$/)) {
          pdfBuffer = Buffer.from(input, "base64");
        } else {
          // Assume it's a file path
          const fs = await import("fs/promises");
          pdfBuffer = await fs.readFile(input);
        }
      } else {
        pdfBuffer = input;
      }

      // Use pdf-lib for metadata and page info
      const pdfDoc = await PDFDocument.load(pdfBuffer, {
        ignoreEncryption: true,
      });

      const pages = pdfDoc.getPages();
      const pageInfos: PDFPageInfo[] = pages.map((page, index) => ({
        pageNumber: index + 1,
        width: page.getWidth(),
        height: page.getHeight(),
        rotation: page.getRotation().angle,
      }));

      // Basic text extraction attempt using form fields if available
      const form = pdfDoc.getForm();
      const formFields = form.getFields();
      const formText = formFields
        .map((field) => {
          try {
            const name = field.getName();
            // @ts-expect-error - accessing internal text value
            const value = field.getText?.() ?? "";
            return value ? `${name}: ${value}` : "";
          } catch {
            return "";
          }
        })
        .filter(Boolean)
        .join("\n");

      const result: PDFReadResult = {
        text: formText || "(Text extraction requires vision module for scanned PDFs)",
        pages: pageInfos,
        metadata: {
          title: pdfDoc.getTitle() ?? undefined,
          author: pdfDoc.getAuthor() ?? undefined,
          subject: pdfDoc.getSubject() ?? undefined,
          keywords: pdfDoc.getKeywords()?.split(",").map((k) => k.trim()),
          creator: pdfDoc.getCreator() ?? undefined,
          producer: pdfDoc.getProducer() ?? undefined,
          creationDate: pdfDoc.getCreationDate() ?? undefined,
          modificationDate: pdfDoc.getModificationDate() ?? undefined,
        },
        pageCount: pdfDoc.getPageCount(),
        isEncrypted: false,
      };

      console.log(
        `[PDF] Read ${result.pageCount} pages for user ${context?.userId} in ${Date.now() - startTime}ms`
      );

      return {
        ok: true,
        data: result,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error("[PDF] Read error:", error);
      return {
        ok: false,
        error: "فشل في قراءة ملف PDF",
        errorCode: "PDF_READ_ERROR",
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Create a new PDF document
   */
  async createPDF(
    pages: PDFPage[],
    options: PDFCreateOptions = {},
    context?: ToolContext
  ): Promise<ToolResult<{ base64: string; pageCount: number }>> {
    const startTime = Date.now();

    try {
      const pdfDoc = await PDFDocument.create();

      // Set metadata
      if (options.title) pdfDoc.setTitle(options.title);
      if (options.author) pdfDoc.setAuthor(options.author);
      pdfDoc.setCreator("Tibyan AI Agent");
      pdfDoc.setProducer("Tibyan LMS");
      pdfDoc.setCreationDate(new Date());

      // Get page size
      const pageSize = this.getPageSize(options.pageSize);
      const margins = options.margins ?? this.defaultMargins;

      // Embed fonts
      const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Create pages
      for (const pageContent of pages) {
        const page = pdfDoc.addPage(pageSize);
        const { width, height } = page.getSize();

        let yPosition = height - margins.top;
        const contentWidth = width - margins.left - margins.right;

        // Add text content
        for (const content of pageContent.content) {
          const font = content.bold ? boldFont : regularFont;
          const fontSize = content.fontSize ?? 12;
          const color = content.fontColor
            ? rgb(content.fontColor.r / 255, content.fontColor.g / 255, content.fontColor.b / 255)
            : rgb(0, 0, 0);

          // Word wrap
          const lines = this.wrapText(content.text, font, fontSize, contentWidth);

          for (const line of lines) {
            if (yPosition < margins.bottom + fontSize) {
              // Need new page
              const newPage = pdfDoc.addPage(pageSize);
              yPosition = newPage.getHeight() - margins.top;
            }

            // Calculate x position based on alignment
            let xPosition = margins.left;
            if (content.alignment === "center") {
              const textWidth = font.widthOfTextAtSize(line, fontSize);
              xPosition = (width - textWidth) / 2;
            } else if (content.alignment === "right") {
              const textWidth = font.widthOfTextAtSize(line, fontSize);
              xPosition = width - margins.right - textWidth;
            }

            page.drawText(line, {
              x: xPosition,
              y: yPosition,
              size: fontSize,
              font,
              color,
            });

            yPosition -= fontSize * 1.5;
          }

          yPosition -= fontSize; // Paragraph spacing
        }

        // Add images
        if (pageContent.images) {
          for (const img of pageContent.images) {
            try {
              const imageBytes = Buffer.from(img.base64, "base64");
              let image;
              
              // Try PNG first, then JPEG
              try {
                image = await pdfDoc.embedPng(imageBytes);
              } catch {
                image = await pdfDoc.embedJpg(imageBytes);
              }

              page.drawImage(image, {
                x: img.x,
                y: img.y,
                width: img.width,
                height: img.height,
              });
            } catch (imgError) {
              console.error("[PDF] Failed to embed image:", imgError);
            }
          }
        }
      }

      const pdfBytes = await pdfDoc.save();
      const base64 = Buffer.from(pdfBytes).toString("base64");

      console.log(
        `[PDF] Created ${pdfDoc.getPageCount()} page PDF for user ${context?.userId} in ${Date.now() - startTime}ms`
      );

      return {
        ok: true,
        data: {
          base64,
          pageCount: pdfDoc.getPageCount(),
        },
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error("[PDF] Create error:", error);
      return {
        ok: false,
        error: "فشل في إنشاء ملف PDF",
        errorCode: "PDF_CREATE_ERROR",
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Edit an existing PDF (add text, pages, etc.)
   */
  async editPDF(
    pdfInput: Buffer | string,
    edits: {
      addText?: Array<{
        pageNumber: number;
        text: string;
        x: number;
        y: number;
        fontSize?: number;
        color?: { r: number; g: number; b: number };
      }>;
      addPages?: Array<{
        position: "start" | "end" | number;
        content: PDFPage;
      }>;
      deletePages?: number[];
      rotatePages?: Array<{ pageNumber: number; degrees: 90 | 180 | 270 }>;
      metadata?: PDFMetadata;
    },
    context?: ToolContext
  ): Promise<ToolResult<{ base64: string; pageCount: number }>> {
    const startTime = Date.now();

    try {
      // Load PDF
      let pdfBuffer: Buffer;
      if (typeof pdfInput === "string") {
        if (pdfInput.match(/^[A-Za-z0-9+/]+=*$/)) {
          pdfBuffer = Buffer.from(pdfInput, "base64");
        } else {
          const fs = await import("fs/promises");
          pdfBuffer = await fs.readFile(pdfInput);
        }
      } else {
        pdfBuffer = pdfInput;
      }

      const pdfDoc = await PDFDocument.load(pdfBuffer);

      // Embed font for text additions
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Delete pages (in reverse order to maintain indices)
      if (edits.deletePages && edits.deletePages.length > 0) {
        const sortedPages = [...edits.deletePages].sort((a, b) => b - a);
        for (const pageNum of sortedPages) {
          if (pageNum >= 1 && pageNum <= pdfDoc.getPageCount()) {
            pdfDoc.removePage(pageNum - 1);
          }
        }
      }

      // Rotate pages
      if (edits.rotatePages) {
        for (const rotation of edits.rotatePages) {
          const pageIndex = rotation.pageNumber - 1;
          if (pageIndex >= 0 && pageIndex < pdfDoc.getPageCount()) {
            const page = pdfDoc.getPage(pageIndex);
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees((currentRotation + rotation.degrees) % 360));
          }
        }
      }

      // Add text to pages
      if (edits.addText) {
        for (const textEdit of edits.addText) {
          const pageIndex = textEdit.pageNumber - 1;
          if (pageIndex >= 0 && pageIndex < pdfDoc.getPageCount()) {
            const page = pdfDoc.getPage(pageIndex);
            const color = textEdit.color
              ? rgb(textEdit.color.r / 255, textEdit.color.g / 255, textEdit.color.b / 255)
              : rgb(0, 0, 0);

            page.drawText(textEdit.text, {
              x: textEdit.x,
              y: textEdit.y,
              size: textEdit.fontSize ?? 12,
              font,
              color,
            });
          }
        }
      }

      // Update metadata
      if (edits.metadata) {
        if (edits.metadata.title) pdfDoc.setTitle(edits.metadata.title);
        if (edits.metadata.author) pdfDoc.setAuthor(edits.metadata.author);
        if (edits.metadata.subject) pdfDoc.setSubject(edits.metadata.subject);
        if (edits.metadata.keywords) pdfDoc.setKeywords(edits.metadata.keywords);
        pdfDoc.setModificationDate(new Date());
      }

      const pdfBytes = await pdfDoc.save();
      const base64 = Buffer.from(pdfBytes).toString("base64");

      console.log(
        `[PDF] Edited PDF (${pdfDoc.getPageCount()} pages) for user ${context?.userId} in ${Date.now() - startTime}ms`
      );

      return {
        ok: true,
        data: {
          base64,
          pageCount: pdfDoc.getPageCount(),
        },
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error("[PDF] Edit error:", error);
      return {
        ok: false,
        error: "فشل في تعديل ملف PDF",
        errorCode: "PDF_EDIT_ERROR",
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Merge multiple PDFs into one
   */
  async mergePDFs(
    pdfs: Array<Buffer | string>,
    metadata?: PDFMetadata,
    context?: ToolContext
  ): Promise<ToolResult<{ base64: string; pageCount: number }>> {
    const startTime = Date.now();

    try {
      const mergedPdf = await PDFDocument.create();

      for (const pdfInput of pdfs) {
        let pdfBuffer: Buffer;
        if (typeof pdfInput === "string") {
          if (pdfInput.match(/^[A-Za-z0-9+/]+=*$/)) {
            pdfBuffer = Buffer.from(pdfInput, "base64");
          } else {
            const fs = await import("fs/promises");
            pdfBuffer = await fs.readFile(pdfInput);
          }
        } else {
          pdfBuffer = pdfInput;
        }

        const pdfDoc = await PDFDocument.load(pdfBuffer);
        const copiedPages = await mergedPdf.copyPages(
          pdfDoc,
          pdfDoc.getPageIndices()
        );

        for (const page of copiedPages) {
          mergedPdf.addPage(page);
        }
      }

      // Set metadata
      if (metadata) {
        if (metadata.title) mergedPdf.setTitle(metadata.title);
        if (metadata.author) mergedPdf.setAuthor(metadata.author);
        if (metadata.subject) mergedPdf.setSubject(metadata.subject);
      }
      mergedPdf.setCreator("Tibyan AI Agent");
      mergedPdf.setCreationDate(new Date());

      const pdfBytes = await mergedPdf.save();
      const base64 = Buffer.from(pdfBytes).toString("base64");

      console.log(
        `[PDF] Merged ${pdfs.length} PDFs (${mergedPdf.getPageCount()} total pages) for user ${context?.userId} in ${Date.now() - startTime}ms`
      );

      return {
        ok: true,
        data: {
          base64,
          pageCount: mergedPdf.getPageCount(),
        },
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error("[PDF] Merge error:", error);
      return {
        ok: false,
        error: "فشل في دمج ملفات PDF",
        errorCode: "PDF_MERGE_ERROR",
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Split PDF into separate documents
   */
  async splitPDF(
    pdfInput: Buffer | string,
    ranges: Array<{ start: number; end: number }>,
    context?: ToolContext
  ): Promise<ToolResult<Array<{ base64: string; pageCount: number; range: string }>>> {
    const startTime = Date.now();

    try {
      let pdfBuffer: Buffer;
      if (typeof pdfInput === "string") {
        if (pdfInput.match(/^[A-Za-z0-9+/]+=*$/)) {
          pdfBuffer = Buffer.from(pdfInput, "base64");
        } else {
          const fs = await import("fs/promises");
          pdfBuffer = await fs.readFile(pdfInput);
        }
      } else {
        pdfBuffer = pdfInput;
      }

      const sourcePdf = await PDFDocument.load(pdfBuffer);
      const totalPages = sourcePdf.getPageCount();
      const results: Array<{ base64: string; pageCount: number; range: string }> = [];

      for (const range of ranges) {
        const start = Math.max(1, range.start);
        const end = Math.min(totalPages, range.end);

        if (start > end || start > totalPages) continue;

        const newPdf = await PDFDocument.create();
        const pageIndices = Array.from(
          { length: end - start + 1 },
          (_, i) => start - 1 + i
        );

        const copiedPages = await newPdf.copyPages(sourcePdf, pageIndices);
        for (const page of copiedPages) {
          newPdf.addPage(page);
        }

        newPdf.setCreator("Tibyan AI Agent");
        newPdf.setCreationDate(new Date());

        const pdfBytes = await newPdf.save();
        results.push({
          base64: Buffer.from(pdfBytes).toString("base64"),
          pageCount: newPdf.getPageCount(),
          range: `${start}-${end}`,
        });
      }

      console.log(
        `[PDF] Split PDF into ${results.length} documents for user ${context?.userId} in ${Date.now() - startTime}ms`
      );

      return {
        ok: true,
        data: results,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error("[PDF] Split error:", error);
      return {
        ok: false,
        error: "فشل في تقسيم ملف PDF",
        errorCode: "PDF_SPLIT_ERROR",
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Add watermark to PDF
   */
  async addWatermark(
    pdfInput: Buffer | string,
    watermark: {
      text: string;
      fontSize?: number;
      opacity?: number;
      rotation?: number;
      color?: { r: number; g: number; b: number };
    },
    context?: ToolContext
  ): Promise<ToolResult<{ base64: string; pageCount: number }>> {
    const startTime = Date.now();

    try {
      let pdfBuffer: Buffer;
      if (typeof pdfInput === "string") {
        if (pdfInput.match(/^[A-Za-z0-9+/]+=*$/)) {
          pdfBuffer = Buffer.from(pdfInput, "base64");
        } else {
          const fs = await import("fs/promises");
          pdfBuffer = await fs.readFile(pdfInput);
        }
      } else {
        pdfBuffer = pdfInput;
      }

      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();

      const fontSize = watermark.fontSize ?? 50;
      const opacity = watermark.opacity ?? 0.3;
      const rotation = watermark.rotation ?? 45;
      const color = watermark.color
        ? rgb(watermark.color.r / 255, watermark.color.g / 255, watermark.color.b / 255)
        : rgb(0.5, 0.5, 0.5);

      for (const page of pages) {
        const { width, height } = page.getSize();
        const textWidth = font.widthOfTextAtSize(watermark.text, fontSize);

        page.drawText(watermark.text, {
          x: (width - textWidth) / 2,
          y: height / 2,
          size: fontSize,
          font,
          color,
          opacity,
          rotate: degrees(rotation),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const base64 = Buffer.from(pdfBytes).toString("base64");

      console.log(
        `[PDF] Added watermark to ${pages.length} pages for user ${context?.userId} in ${Date.now() - startTime}ms`
      );

      return {
        ok: true,
        data: {
          base64,
          pageCount: pdfDoc.getPageCount(),
        },
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error("[PDF] Watermark error:", error);
      return {
        ok: false,
        error: "فشل في إضافة العلامة المائية",
        errorCode: "PDF_WATERMARK_ERROR",
        durationMs: Date.now() - startTime,
      };
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private getPageSize(size?: string): [number, number] {
    switch (size) {
      case "LETTER":
        return PageSizes.Letter;
      case "LEGAL":
        return PageSizes.Legal;
      case "A4":
      default:
        return PageSizes.A4;
    }
  }

  private wrapText(
    text: string,
    font: { widthOfTextAtSize: (text: string, size: number) => number },
    fontSize: number,
    maxWidth: number
  ): string[] {
    const lines: string[] = [];
    const paragraphs = text.split("\n");

    for (const paragraph of paragraphs) {
      const words = paragraph.split(" ");
      let currentLine = "";

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = font.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        lines.push(currentLine);
      }
    }

    return lines;
  }
}

// ============================================
// Singleton Instance
// ============================================

export const pdf = new PDFService();

// ============================================
// Tool Handlers
// ============================================

export interface ReadPDFParams {
  pdf_base64?: string;
  pdf_url?: string;
}

export async function handleReadPDF(
  params: ReadPDFParams,
  context: ToolContext
): Promise<ToolResult<PDFReadResult>> {
  if (params.pdf_base64) {
    return pdf.readPDF(params.pdf_base64, context);
  }
  
  if (params.pdf_url) {
    try {
      const response = await fetch(params.pdf_url);
      const buffer = Buffer.from(await response.arrayBuffer());
      return pdf.readPDF(buffer, context);
    } catch {
      return {
        ok: false,
        error: "فشل في تحميل ملف PDF من الرابط",
        errorCode: "PDF_FETCH_ERROR",
        durationMs: 0,
      };
    }
  }

  return {
    ok: false,
    error: "يجب توفير ملف PDF",
    errorCode: "MISSING_PDF",
    durationMs: 0,
  };
}

export interface CreatePDFParams {
  title?: string;
  author?: string;
  content: Array<{
    text: string;
    fontSize?: number;
    bold?: boolean;
    alignment?: "left" | "center" | "right";
  }>;
  page_size?: "A4" | "LETTER" | "LEGAL";
}

export async function handleCreatePDF(
  params: CreatePDFParams,
  context: ToolContext
): Promise<ToolResult<{ base64: string; pageCount: number }>> {
  const pages: PDFPage[] = [
    {
      content: params.content.map((c) => ({
        text: c.text,
        fontSize: c.fontSize,
        bold: c.bold,
        alignment: c.alignment,
      })),
    },
  ];

  return pdf.createPDF(
    pages,
    {
      title: params.title,
      author: params.author,
      pageSize: params.page_size,
    },
    context
  );
}

export interface EditPDFParams {
  pdf_base64: string;
  add_text?: Array<{
    page: number;
    text: string;
    x: number;
    y: number;
    fontSize?: number;
  }>;
  delete_pages?: number[];
  rotate_pages?: Array<{ page: number; degrees: 90 | 180 | 270 }>;
  new_title?: string;
  new_author?: string;
}

export async function handleEditPDF(
  params: EditPDFParams,
  context: ToolContext
): Promise<ToolResult<{ base64: string; pageCount: number }>> {
  return pdf.editPDF(
    params.pdf_base64,
    {
      addText: params.add_text?.map((t) => ({
        pageNumber: t.page,
        text: t.text,
        x: t.x,
        y: t.y,
        fontSize: t.fontSize,
      })),
      deletePages: params.delete_pages,
      rotatePages: params.rotate_pages?.map((r) => ({
        pageNumber: r.page,
        degrees: r.degrees,
      })),
      metadata: {
        title: params.new_title,
        author: params.new_author,
      },
    },
    context
  );
}

export interface MergePDFsParams {
  pdfs: string[]; // Array of base64 encoded PDFs
  title?: string;
}

export async function handleMergePDFs(
  params: MergePDFsParams,
  context: ToolContext
): Promise<ToolResult<{ base64: string; pageCount: number }>> {
  return pdf.mergePDFs(params.pdfs, { title: params.title }, context);
}

export { PDFService };
