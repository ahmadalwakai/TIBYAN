import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { assertRoleAccess } from "@/lib/auth/guards";
import StudentShell from "@/app/student/StudentShell.client";

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  // Student Portal: enrolled learner experience. Requires role=STUDENT and verified email.
  const access = await assertRoleAccess({
    requiredRole: "STUDENT",
    user,
    requireEmailVerified: true,
  });
  if (!access.ok) {
    redirect(access.redirectTo);
  }
  if (!user) {
    redirect("/auth/login?redirect=/student");
  }

  return <StudentShell userName={user.name}>{children}</StudentShell>;
}
