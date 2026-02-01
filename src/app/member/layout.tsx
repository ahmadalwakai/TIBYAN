import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { assertRoleAccess } from "@/lib/auth/guards";
import MemberShell from "@/app/member/MemberShell.client";

export default async function MemberLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  // Member Portal: community/club membership experience. Requires role=MEMBER.
  const access = await assertRoleAccess({ requiredRole: "MEMBER", user });
  if (!access.ok) {
    redirect(access.redirectTo);
  }
  if (!user) {
    redirect("/auth/login?redirect=/member");
  }

  return <MemberShell userName={user.name}>{children}</MemberShell>;
}
