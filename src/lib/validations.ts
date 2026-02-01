import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN", "MEMBER"]).default("STUDENT"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"]).default("ACTIVE"),
  bio: z.string().optional(),
});

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN", "MEMBER"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"]).optional(),
  bio: z.string().optional(),
});

export const CreateCourseSchema = z.object({
  title: z.string().min(3),
  slug: z.string().min(3),
  description: z.string(),
  thumbnail: z.string().url().optional(),
  price: z.number().min(0).default(0),
  duration: z.number().optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  instructorId: z.string(),
});

export const UpdateCourseSchema = z.object({
  title: z.string().min(3).optional(),
  slug: z.string().min(3).optional(),
  description: z.string().optional(),
  thumbnail: z.string().url().optional(),
  price: z.number().min(0).optional(),
  duration: z.number().optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).optional(),
  status: z.enum(["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]).optional(),
  instructorId: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;

// Teacher Application Schemas
export const TeacherApplicationSchema = z.object({
  fullName: z.string().min(2, "الاسم مطلوب"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  phone: z.string().min(8, "رقم الهاتف مطلوب"),
  dateOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  gender: z.string().optional(),
  degree: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  university: z.string().optional(),
  graduationYear: z.string().optional(),
  yearsExperience: z.string().optional(),
  subjectsToTeach: z.string().min(1, "يرجى تحديد المواد التي ترغب في تدريسها"),
  quranMemorization: z.string().optional(),
  tajweedLevel: z.string().optional(),
  onlineExperience: z.string().optional(),
  availableDays: z.string().optional(),
  hoursPerWeek: z.string().optional(),
  startDate: z.string().optional(),
  motivation: z.string().optional(),
  expectedSalary: z.string().optional(),
  agreeTerms: z.literal(true, { message: "يجب الموافقة على الشروط والأحكام" }),
});

export const UpdateApplicationStatusSchema = z.object({
  status: z.enum(["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED"]),
  reviewNotes: z.string().optional(),
});

export type TeacherApplicationInput = z.infer<typeof TeacherApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof UpdateApplicationStatusSchema>;

// Payment Schemas
export const CreatePaymentSchema = z.object({
  courseId: z.string().min(1, "معرف الدورة مطلوب"),
  paymentMethod: z.enum(["cash"]).optional(),
  couponCode: z.string().optional(),
  customerName: z.string().min(2, "الاسم مطلوب"),
  customerEmail: z.string().email("البريد الإلكتروني غير صحيح"),
  customerPhone: z.string().min(8, "رقم الهاتف مطلوب"),
});

export const UpdatePaymentStatusSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REFUNDED", "CANCELLED"]),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

export type CreatePaymentInput = z.infer<typeof CreatePaymentSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof UpdatePaymentStatusSchema>;

// Auth Schemas
export const RegisterSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

export const LoginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "الرمز مطلوب"),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, "الرمز مطلوب"),
});

export const AdminLoginRequestSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
});

export const AdminVerifyCodeSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  code: z.string().length(6, "الرمز يجب أن يكون 6 أرقام"),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;
export type AdminLoginRequestInput = z.infer<typeof AdminLoginRequestSchema>;
export type AdminVerifyCodeInput = z.infer<typeof AdminVerifyCodeSchema>;

// Certificate Schemas
export const CreateCertificateSchema = z.object({
  studentName: z.string().min(2, "اسم الطالب مطلوب").max(150, "اسم الطالب طويل جداً"),
  studentNameEn: z.string().max(150, "Student name too long").optional().nullable(),
  courseName: z.string().min(2, "اسم الدورة مطلوب").max(150, "اسم الدورة طويل جداً"),
  courseNameEn: z.string().max(150, "Course name too long").optional().nullable(),
  completionDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  grade: z.string().max(50, "التقدير طويل جداً").optional().nullable(),
  score: z.number().min(0).max(100).optional().nullable(),
  instructorName: z.string().max(150, "Instructor name too long").optional().nullable(),
  courseDuration: z.string().max(100, "Duration too long").optional().nullable(),
  certificateNumber: z.string().max(100, "Certificate number too long").optional().nullable(),
  templateType: z.enum([
    "template1", "template2", "template3", "template4", "template5",
    "template6", "template7", "template8", "template9", "template10",
    "template11", "template12", "template13", "template14", "template15",
    "template16", "template17", "template18", "template19", "template20",
  ]).default("template1"),
  userId: z.string().cuid().optional().nullable(),
  courseId: z.string().cuid().optional().nullable(),
});

export const UpdateCertificateSchema = z.object({
  studentName: z.string().min(2, "اسم الطالب مطلوب").max(150, "اسم الطالب طويل جداً").optional(),
  studentNameEn: z.string().max(150, "Student name too long").optional().nullable(),
  courseName: z.string().min(2, "اسم الدورة مطلوب").max(150, "اسم الدورة طويل جداً").optional(),
  courseNameEn: z.string().max(150, "Course name too long").optional().nullable(),
  completionDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  grade: z.string().max(50, "التقدير طويل جداً").optional().nullable(),
  score: z.number().min(0).max(100).optional().nullable(),
  instructorName: z.string().max(150, "Instructor name too long").optional().nullable(),
  courseDuration: z.string().max(100, "Duration too long").optional().nullable(),
  templateType: z.enum([
    "template1", "template2", "template3", "template4", "template5",
    "template6", "template7", "template8", "template9", "template10",
    "template11", "template12", "template13", "template14", "template15",
    "template16", "template17", "template18", "template19", "template20",
  ]).optional(),
});

export const CertificateFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(200).optional(),
  sortBy: z.enum(["createdAt", "studentName", "courseName", "completionDate"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateCertificateInput = z.infer<typeof CreateCertificateSchema>;
export type UpdateCertificateInput = z.infer<typeof UpdateCertificateSchema>;
export type CertificateFilterInput = z.infer<typeof CertificateFilterSchema>;
