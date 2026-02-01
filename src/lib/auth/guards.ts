import { prisma } from "@/lib/db";
import { getRoleRedirect } from "@/lib/auth/roleRedirect";
import type { User } from "@/lib/auth";

/**
 * Portal access rules (Option 1):
 * - Student Portal (/student): enrolled learner experience. Requires role=STUDENT + emailVerified.
 * - Member Portal (/member): community/club membership experience. Requires role=MEMBER.
 *   Email verification for MEMBER is optional by policy (can browse member portal without verification).
 */

export type RoleAccessResult =
  | { ok: true }
  | {
      ok: false;
      status: 401 | 403;
      error: string;
      code: "UNAUTHENTICATED" | "WRONG_PORTAL" | "EMAIL_NOT_VERIFIED";
      nextAction: { type: string; url?: string };
      redirectTo: string;
    };

export async function assertRoleAccess({
  requiredRole,
  user,
  requireEmailVerified = false,
}: {
  requiredRole: "MEMBER" | "STUDENT" | "INSTRUCTOR" | "ADMIN";
  user: User | null;
  requireEmailVerified?: boolean;
}): Promise<RoleAccessResult> {
  if (!user) {
    const loginRedirect = `/auth/login?redirect=${getRoleRedirect(requiredRole)}`;
    return {
      ok: false,
      status: 401,
      error: "Authentication required",
      code: "UNAUTHENTICATED",
      nextAction: { type: "LOGIN", url: loginRedirect },
      redirectTo: loginRedirect,
    };
  }

  if (user.role !== requiredRole) {
    if (requiredRole === "MEMBER" && user.role === "STUDENT") {
      return {
        ok: false,
        status: 403,
        error: "هذا الحساب طالب وليس عضوية.",
        code: "WRONG_PORTAL",
        nextAction: { type: "GO_TO_MEMBER_SIGNUP", url: "/auth/member-signup" },
        redirectTo: "/auth/member-signup",
      };
    }

    const roleRedirect = getRoleRedirect(user.role);
    return {
      ok: false,
      status: 403,
      error: "هذا الحساب غير مخصص لهذه البوابة.",
      code: "WRONG_PORTAL",
      nextAction: { type: "GO_TO_ROLE_PORTAL", url: roleRedirect },
      redirectTo: roleRedirect,
    };
  }

  if (requireEmailVerified) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true, emailVerified: true },
    });

    if (!dbUser) {
      const loginRedirect = `/auth/login?redirect=${getRoleRedirect(requiredRole)}`;
      return {
        ok: false,
        status: 401,
        error: "Authentication required",
        code: "UNAUTHENTICATED",
        nextAction: { type: "LOGIN", url: loginRedirect },
        redirectTo: loginRedirect,
      };
    }

    if (dbUser.emailVerified === false) {
      const verifyRedirect = `/auth/verify-pending?email=${encodeURIComponent(dbUser.email)}`;
      return {
        ok: false,
        status: 403,
        error: "يرجى تأكيد بريدك الإلكتروني أولاً",
        code: "EMAIL_NOT_VERIFIED",
        nextAction: { type: "VERIFY_EMAIL" },
        redirectTo: verifyRedirect,
      };
    }
  }

  return { ok: true };
}