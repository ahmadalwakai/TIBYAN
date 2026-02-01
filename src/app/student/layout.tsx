import { Box, Container, Flex } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import StudentSidebar from "@/components/layout/StudentSidebar";
import { getCurrentUser } from "@/lib/auth";
import { assertRoleAccess } from "@/lib/auth/guards";

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

  return (
    <Box as="section" bg="background" minH="100vh">
      <Container maxW="6xl" py={{ base: 8, md: 12 }} px={{ base: 6, md: 8 }}>
        <Flex direction={{ base: "column", lg: "row" }} gap={6} align="start">
          <StudentSidebar userName={user.name} />
          <Box flex="1">{children}</Box>
        </Flex>
      </Container>
    </Box>
  );
}
