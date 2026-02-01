export const ROLE_REDIRECTS = {
  ADMIN: "/admin",
  INSTRUCTOR: "/teacher",
  MEMBER: "/member",
  STUDENT: "/student",
} as const;

export type AppRole = keyof typeof ROLE_REDIRECTS;

export function getRoleRedirect(role?: string | null): string {
  if (role && role in ROLE_REDIRECTS) {
    return ROLE_REDIRECTS[role as AppRole];
  }
  return ROLE_REDIRECTS.MEMBER;
}
