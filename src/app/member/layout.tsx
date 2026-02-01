import { Box, Container, Flex } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import MemberSidebar from "@/components/layout/MemberSidebar";
import { getCurrentUser } from "@/lib/auth";
import { assertRoleAccess } from "@/lib/auth/guards";

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

  return (
    <Box as="section" bg="background" minH="100vh">
      <Container maxW="6xl" py={{ base: 8, md: 12 }} px={{ base: 6, md: 8 }}>
        <Flex direction={{ base: "column", lg: "row" }} gap={6} align="start">
          <MemberSidebar userName={user.name} />
          <Box flex="1">{children}</Box>
        </Flex>
      </Container>
    </Box>
  );
}
