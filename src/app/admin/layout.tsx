import { Box, Container, Flex } from "@chakra-ui/react";
import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { verifyToken } from "@/lib/jwt";
import { prisma } from "@/lib/db";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Check for auth token
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  // If no token, redirect to login
  if (!token) {
    redirect("/auth/admin-login");
  }

  // Verify JWT token signature and expiration
  const payload = await verifyToken(token);
  if (!payload) {
    // Invalid or expired token - redirect to login
    redirect("/auth/admin-login");
  }

  // Verify user exists, is active, and is an ADMIN
  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, status: true },
    });

    if (!user || user.status !== "ACTIVE" || user.role !== "ADMIN") {
      // User not found, inactive, or not admin - redirect to login
      redirect("/auth/admin-login");
    }
  } catch {
    // Database error - fail secure by redirecting to login
    redirect("/auth/admin-login");
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
