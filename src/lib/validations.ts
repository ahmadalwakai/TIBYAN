import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]).default("STUDENT"),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"]).default("ACTIVE"),
  bio: z.string().optional(),
});

export const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]).optional(),
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
  paymentMethod: z.enum(["stripe", "paypal", "bank_transfer", "tap"]).optional(),
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
