"use client";

import { useEffect, useState } from "react";
import { Box, Button, Container, Flex, Text } from "@chakra-ui/react";
import { usePathname } from "next/navigation";
import StudentSidebar from "@/components/layout/StudentSidebar";
import PortalDrawer from "@/components/layout/PortalDrawer";

interface StudentShellProps {
  userName: string;
  children: React.ReactNode;
}

export default function StudentShell({ userName, children }: StudentShellProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Close menu on route change - legitimate setState in effect
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsOpen(false);
  }, [pathname]);

  return (
    <Box as="section" bg="background" minH="100vh">
      <Container maxW="6xl" py={{ base: 6, md: 10 }} px={{ base: 4, md: 8 }}>
        <Flex
          display={{ base: "flex", lg: "none" }}
          align="center"
          justify="space-between"
          mb={4}
          position="sticky"
          top={0}
          zIndex={1200}
          bg="rgba(0,0,0,0.2)"
          backdropFilter="blur(8px)"
          pt="env(safe-area-inset-top)"
        >
          <Text fontWeight="700">بوابة الطالب</Text>
          <Button onClick={() => setIsOpen(true)} variant="ghost" size="sm">
            ☰
          </Button>
        </Flex>

        <PortalDrawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="قائمة الطالب"
          placement="right"
        >
          <StudentSidebar userName={userName} onNavigate={() => setIsOpen(false)} />
        </PortalDrawer>

        <Flex direction={{ base: "column", lg: "row" }} gap={6} align="start">
          <Box display={{ base: "none", lg: "block" }} w={{ lg: "260px" }}>
            <StudentSidebar userName={userName} />
          </Box>
          <Box flex="1">{children}</Box>
        </Flex>
      </Container>
    </Box>
  );
}
