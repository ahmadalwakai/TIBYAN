import { Box, Container, Flex } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Server-side authentication check
  const user = await getCurrentUser();
  
  // If not authenticated or not an admin, redirect to login
  if (!user || user.role !== "admin") {
    redirect("/auth/login?error=unauthorized&redirect=/admin");
  }

  return (
    <Box as="section" bg="background" minH="100vh">
      <Container maxW="6xl" py={{ base: 8, md: 12 }} px={{ base: 6, md: 8 }}>
        <Flex direction={{ base: "column", lg: "row" }} gap={6} align="start">
          <AdminSidebar />
          <Box flex="1">{children}</Box>
        </Flex>
      </Container>
    </Box>
  );
}
