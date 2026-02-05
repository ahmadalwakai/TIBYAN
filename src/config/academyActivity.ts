/**
 * Academy Activity Configuration
 * 
 * This file contains REAL weekly activity data for the homepage.
 * Update this file weekly to reflect actual academy happenings.
 * 
 * HOW TO UPDATE:
 * 1. Every Sunday (or your chosen day), update the `thisWeekUpdates` array
 * 2. Keep 3-6 bullet items maximum
 * 3. Write like internal updates, not marketing
 * 4. Use simple Arabic
 * 
 * Examples of good updates:
 * - "المستوى الأول تدرّب على حروف (ب، ت، ث)"
 * - "١٨ حصة مباشرة أُقيمت هذا الأسبوع"
 * - "انضم ٣ طلاب جدد"
 * 
 * Examples of BAD updates (avoid):
 * - "تجربة تعليمية استثنائية!" (marketing)
 * - "أفضل معلمين في العالم" (exaggerated)
 */

export interface WeeklyUpdate {
  id: string;
  textAr: string;
  textEn: string;
}

export interface ScheduleSlot {
  day: string;
  dayAr: string;
  time: string;
  level: string;
  levelAr: string;
  spotsLeft: number | null; // null means "full"
}

export interface LessonBreakdown {
  durationMinutes: number;
  steps: {
    minutes: number;
    labelAr: string;
    labelEn: string;
    descriptionAr: string;
    descriptionEn: string;
  }[];
}

export interface TeacherDayItem {
  time: string;
  activityAr: string;
  activityEn: string;
}

// ============================================================
// THIS WEEK'S UPDATES - Update this section weekly
// ============================================================
export const thisWeekUpdates: WeeklyUpdate[] = [
  {
    id: "1",
    textAr: "المستوى الأول تدرّب على حروف (ب، ت، ث)",
    textEn: "Level 1 practiced letters (ب، ت، ث)",
  },
  {
    id: "2",
    textAr: "المستوى الثاني راجع الحركات القصيرة والطويلة",
    textEn: "Level 2 reviewed short and long vowels",
  },
  {
    id: "3",
    textAr: "١٨ حصة مباشرة أُقيمت هذا الأسبوع",
    textEn: "18 live sessions held this week",
  },
  {
    id: "4",
    textAr: "انضم ٣ طلاب جدد إلى برنامج القراءة",
    textEn: "3 new students joined the reading program",
  },
  {
    id: "5",
    textAr: "المستوى الثالث بدأ سورة الفاتحة بالتجويد",
    textEn: "Level 3 started Surah Al-Fatiha with tajweed",
  },
];

// Last updated date (for display)
export const lastUpdated = "2026-02-05";

// ============================================================
// CURRENT SCHEDULE - Update when schedule changes
// ============================================================
export const currentSchedule: ScheduleSlot[] = [
  {
    day: "Sunday",
    dayAr: "الأحد",
    time: "09:00",
    level: "Level 1",
    levelAr: "المستوى الأول",
    spotsLeft: 3,
  },
  {
    day: "Sunday",
    dayAr: "الأحد",
    time: "10:30",
    level: "Level 2",
    levelAr: "المستوى الثاني",
    spotsLeft: null, // Full
  },
  {
    day: "Monday",
    dayAr: "الاثنين",
    time: "16:00",
    level: "Level 3",
    levelAr: "المستوى الثالث",
    spotsLeft: 2,
  },
  {
    day: "Tuesday",
    dayAr: "الثلاثاء",
    time: "17:00",
    level: "Level 1",
    levelAr: "المستوى الأول",
    spotsLeft: 5,
  },
  {
    day: "Wednesday",
    dayAr: "الأربعاء",
    time: "18:00",
    level: "Level 2",
    levelAr: "المستوى الثاني",
    spotsLeft: 1,
  },
  {
    day: "Thursday",
    dayAr: "الخميس",
    time: "10:00",
    level: "Tajweed Review",
    levelAr: "مراجعة التجويد",
    spotsLeft: 4,
  },
];

// ============================================================
// HOW A REAL LESSON WORKS - Rarely changes
// ============================================================
export const lessonBreakdown: LessonBreakdown = {
  durationMinutes: 45,
  steps: [
    {
      minutes: 5,
      labelAr: "المراجعة",
      labelEn: "Review",
      descriptionAr: "مراجعة سريعة لما تعلمناه في الحصة السابقة",
      descriptionEn: "Quick review of what we learned last session",
    },
    {
      minutes: 20,
      labelAr: "المادة الجديدة",
      labelEn: "New Material",
      descriptionAr: "شرح الدرس الجديد مع أمثلة وتطبيقات",
      descriptionEn: "Explanation of new lesson with examples",
    },
    {
      minutes: 15,
      labelAr: "التطبيق والتصحيح",
      labelEn: "Practice & Correction",
      descriptionAr: "الطالب يقرأ ويطبق، والمعلم يصحح",
      descriptionEn: "Student reads and practices, teacher corrects",
    },
    {
      minutes: 5,
      labelAr: "التكليف",
      labelEn: "Assignment",
      descriptionAr: "تحديد ما يجب مراجعته قبل الحصة القادمة",
      descriptionEn: "What to review before next session",
    },
  ],
};

// ============================================================
// A REAL TEACHER'S DAY - Rarely changes
// ============================================================
export const teacherDayTimeline: TeacherDayItem[] = [
  {
    time: "08:00",
    activityAr: "مراجعة ملاحظات الطلاب من الحصة السابقة",
    activityEn: "Review student notes from previous session",
  },
  {
    time: "09:00",
    activityAr: "الحصة الأولى: المستوى الأول - القراءة",
    activityEn: "First class: Level 1 - Reading",
  },
  {
    time: "10:00",
    activityAr: "استراحة والرد على رسائل أولياء الأمور",
    activityEn: "Break and respond to parent messages",
  },
  {
    time: "10:30",
    activityAr: "الحصة الثانية: المستوى الثاني - التجويد",
    activityEn: "Second class: Level 2 - Tajweed",
  },
  {
    time: "12:00",
    activityAr: "تحضير مادة الحصص القادمة",
    activityEn: "Prepare material for upcoming sessions",
  },
  {
    time: "14:00",
    activityAr: "إرسال تقارير موجزة للأهالي",
    activityEn: "Send brief progress updates to parents",
  },
];

// ============================================================
// TRUST STATEMENT - One real statement, not testimonials
// ============================================================
export const trustStatement = {
  ar: "يتلقى أولياء الأمور تقريراً موجزاً بعد كل حصة يوضح ما تمت دراسته.",
  en: "Parents receive a brief report after each class explaining what was covered.",
};
