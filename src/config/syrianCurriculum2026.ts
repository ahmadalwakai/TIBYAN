/**
 * Syrian Curriculum 2025–2026 Resource Configuration
 * 
 * This file contains metadata and links to Syrian national curriculum PDFs.
 * Sources can be:
 *   - "official": Links to the Syrian Ministry of Education portal
 *   - "local": Links to PDFs stored in /public/curriculum/syrian/2025-2026/
 * 
 * If PDFs are placed locally, update the URL to:
 *   "/curriculum/syrian/2025-2026/Grade-XX/subject.pdf"
 */

export type CurriculumSource = "official" | "local";

export interface CurriculumSubject {
  /** Arabic subject name */
  titleAr: string;
  /** English subject name */
  titleEn: string;
  /** Source type: official link or local file */
  source: CurriculumSource;
  /** URL to the PDF (official portal or local path) */
  url: string;
  /** Optional Arabic notes */
  notesAr?: string;
  /** Optional English notes */
  notesEn?: string;
}

export interface CurriculumGrade {
  /** Grade number (1-12) */
  gradeNumber: number;
  /** Arabic grade label e.g. "الصف الأول" */
  labelAr: string;
  /** English grade label e.g. "Grade 1" */
  labelEn: string;
  /** Subjects available for this grade */
  subjects: CurriculumSubject[];
}

export interface SyrianCurriculumConfig {
  /** Academic year label */
  yearLabel: string;
  /** Last updated date (ISO string or display string) */
  lastUpdated: string;
  /** Official source URL for reference */
  officialSourceUrl: string;
  /** Array of grades with their subjects */
  grades: CurriculumGrade[];
}

/**
 * Syrian Curriculum 2025–2026 Configuration
 * 
 * TODO: Expand with all grades (1-12) and all subjects.
 * TODO: Verify official URLs are current and accessible.
 * TODO: Add local PDF paths once files are legally obtained and placed.
 */
export const syrianCurriculum2026: SyrianCurriculumConfig = {
  yearLabel: "2025/2026",
  lastUpdated: "2026-02-05",
  officialSourceUrl: "https://moed.gov.sy",
  
  grades: [
    // ─────────────────────────────────────────────────────────────
    // Grade 1 - الصف الأول
    // ─────────────────────────────────────────────────────────────
    {
      gradeNumber: 1,
      labelAr: "الصف الأول",
      labelEn: "Grade 1",
      subjects: [
        {
          titleAr: "اللغة العربية",
          titleEn: "Arabic Language",
          source: "official",
          url: "https://moed.gov.sy/moed/ar/curriculum",
          notesAr: "الفصل الدراسي الأول والثاني",
          notesEn: "First and second semester",
        },
        {
          titleAr: "الرياضيات",
          titleEn: "Mathematics",
          source: "official",
          url: "https://moed.gov.sy/moed/ar/curriculum",
        },
        {
          titleAr: "التربية الدينية الإسلامية",
          titleEn: "Islamic Education",
          source: "official",
          url: "https://moed.gov.sy/moed/ar/curriculum",
        },
        // TODO: Add more Grade 1 subjects (Science, English, etc.)
      ],
    },
    
    // ─────────────────────────────────────────────────────────────
    // Grade 2 - الصف الثاني
    // ─────────────────────────────────────────────────────────────
    {
      gradeNumber: 2,
      labelAr: "الصف الثاني",
      labelEn: "Grade 2",
      subjects: [
        {
          titleAr: "اللغة العربية",
          titleEn: "Arabic Language",
          source: "official",
          url: "https://moed.gov.sy/moed/ar/curriculum",
        },
        {
          titleAr: "الرياضيات",
          titleEn: "Mathematics",
          source: "official",
          url: "https://moed.gov.sy/moed/ar/curriculum",
        },
        // TODO: Add more Grade 2 subjects
      ],
    },
    
    // ─────────────────────────────────────────────────────────────
    // Grade 3 - الصف الثالث
    // ─────────────────────────────────────────────────────────────
    {
      gradeNumber: 3,
      labelAr: "الصف الثالث",
      labelEn: "Grade 3",
      subjects: [
        {
          titleAr: "اللغة العربية",
          titleEn: "Arabic Language",
          source: "official",
          url: "https://moed.gov.sy/moed/ar/curriculum",
        },
        // TODO: Add more Grade 3 subjects
      ],
    },
    
    // ─────────────────────────────────────────────────────────────
    // TODO: Add Grades 4-12
    // Each grade should include subjects like:
    // - اللغة العربية (Arabic)
    // - الرياضيات (Mathematics)
    // - العلوم (Science)
    // - اللغة الإنجليزية (English)
    // - التربية الدينية (Religious Education)
    // - الاجتماعيات (Social Studies)
    // - التربية الفنية (Art)
    // - التربية الموسيقية (Music)
    // ─────────────────────────────────────────────────────────────
  ],
};

export default syrianCurriculum2026;
