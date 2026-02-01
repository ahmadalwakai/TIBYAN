import { db } from "@/lib/db";

export type AuditAction =
  | "USER_CREATE"
  | "USER_UPDATE"
  | "USER_DELETE"
  | "USER_STATUS_CHANGE"
  | "USER_ROLE_CHANGE"
  | "COURSE_CREATE"
  | "COURSE_UPDATE"
  | "COURSE_DELETE"
  | "COURSE_PUBLISH"
  | "COURSE_UNPUBLISH"
  | "PAYMENT_UPDATE"
  | "PAYMENT_REFUND"
  | "APPLICATION_REVIEW"
  | "APPLICATION_APPROVE"
  | "APPLICATION_REJECT"
  | "SETTINGS_UPDATE"
  | "ADMIN_LOGIN"
  | "ADMIN_LOGOUT"
  | "ADMIN_ADD"
  | "ADMIN_REMOVE"
  | "ENROLLMENT_CREATE"
  | "ENROLLMENT_CANCEL"
  | "NOTIFICATION_CREATE"
  | "NOTIFICATION_UPDATE"
  | "NOTIFICATION_DELETE"
  | "NOTIFICATION_SEND"
  | "ROLE_CREATE"
  | "ROLE_UPDATE"
  | "ROLE_DELETE"
  | "REVIEW_APPROVE"
  | "REVIEW_REJECT"
  | "REVIEW_FLAG"
  | "REVIEW_DELETE"
  | "FILE_DELETE"
  | "INTEGRATION_TEST"
  | "CERTIFICATE_CREATE"
  | "CERTIFICATE_DELETE"
  | "CREATE_BLOG_POST"
  | "UPDATE_BLOG_POST"
  | "DELETE_BLOG_POST";

export type EntityType =
  | "USER"
  | "COURSE"
  | "PAYMENT"
  | "APPLICATION"
  | "ENROLLMENT"
  | "SETTINGS"
  | "SESSION"
  | "NOTIFICATION"
  | "ROLE"
  | "REVIEW"
  | "FILE"
  | "INTEGRATION"
  | "CERTIFICATE"
  | "BLOG_POST";

interface LogAuditParams {
  actorUserId?: string;
  action: AuditAction;
  entityType?: EntityType;
  entityId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log an admin action to the audit log
 */
export async function logAudit({
  actorUserId,
  action,
  entityType,
  entityId,
  metadata,
}: LogAuditParams): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorUserId,
        action,
        entityType,
        entityId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  } catch (error) {
    // Don't throw - audit logging should not break the main flow
    console.error("[Audit] Failed to log action:", error);
  }
}

/**
 * Get action label in Arabic
 */
export function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    USER_CREATE: "إنشاء مستخدم",
    USER_UPDATE: "تحديث مستخدم",
    USER_DELETE: "حذف مستخدم",
    USER_STATUS_CHANGE: "تغيير حالة مستخدم",
    USER_ROLE_CHANGE: "تغيير صلاحية مستخدم",
    COURSE_CREATE: "إنشاء دورة",
    COURSE_UPDATE: "تحديث دورة",
    COURSE_DELETE: "حذف دورة",
    COURSE_PUBLISH: "نشر دورة",
    COURSE_UNPUBLISH: "إلغاء نشر دورة",
    PAYMENT_UPDATE: "تحديث دفعة",
    PAYMENT_REFUND: "استرداد دفعة",
    APPLICATION_REVIEW: "مراجعة طلب",
    APPLICATION_APPROVE: "قبول طلب",
    APPLICATION_REJECT: "رفض طلب",
    SETTINGS_UPDATE: "تحديث الإعدادات",
    ADMIN_LOGIN: "تسجيل دخول مسؤول",
    ADMIN_LOGOUT: "تسجيل خروج مسؤول",
    ENROLLMENT_CREATE: "تسجيل في دورة",
    ENROLLMENT_CANCEL: "إلغاء تسجيل",
    NOTIFICATION_CREATE: "إنشاء إشعار",
    NOTIFICATION_UPDATE: "تحديث إشعار",
    NOTIFICATION_DELETE: "حذف إشعار",
    NOTIFICATION_SEND: "إرسال إشعار",
    ROLE_CREATE: "إنشاء صلاحية",
    ROLE_UPDATE: "تحديث صلاحية",
    ROLE_DELETE: "حذف صلاحية",
    REVIEW_APPROVE: "قبول مراجعة",
    REVIEW_REJECT: "رفض مراجعة",
    REVIEW_FLAG: "تعليم مراجعة",
    REVIEW_DELETE: "حذف مراجعة",
    FILE_DELETE: "حذف ملف",
    INTEGRATION_TEST: "اختبار تكامل",
    CERTIFICATE_CREATE: "إنشاء شهادة",
    CERTIFICATE_DELETE: "حذف شهادة",
  };
  return labels[action] || action;
}

/**
 * Get entity type label in Arabic
 */
export function getEntityLabel(entityType: string): string {
  const labels: Record<string, string> = {
    USER: "مستخدم",
    COURSE: "دورة",
    PAYMENT: "دفعة",
    APPLICATION: "طلب توظيف",
    ENROLLMENT: "تسجيل",
    SETTINGS: "إعدادات",
    SESSION: "جلسة",
    NOTIFICATION: "إشعار",
    ROLE: "صلاحية",
    REVIEW: "مراجعة",
    FILE: "ملف",
    INTEGRATION: "تكامل",
    CERTIFICATE: "شهادة",
  };
  return labels[entityType] || entityType;
}
