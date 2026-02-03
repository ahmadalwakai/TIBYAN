"use client";

import { Box, IconButton, Icon } from "@chakra-ui/react";
import { useRouter, usePathname } from "next/navigation";
import { LuSparkles } from "react-icons/lu";

export default function AiAgentFab() {
  const router = useRouter();
  const pathname = usePathname();
  
  // Extract locale from pathname (e.g., /ar or /en or root /)
  const locale = pathname.split("/")[1] || "ar";

  return (
    <Box
      position="fixed"
      bottom="160px"
      right="24px"
      zIndex={1400}
    >
      <IconButton
        aria-label="فتح مساعد تبيان الذكي"
        onClick={() => router.push(`/${locale}/ai`)}
        size="lg"
        w={{ base: "56px", md: "64px" }}
        h={{ base: "56px", md: "64px" }}
        borderRadius="full"
        bg="#0B1F3A"
        color="#D4AF37"
        _hover={{ 
          bg: "#142d4f",
          transform: "scale(1.1)",
          boxShadow: "0 0 30px rgba(212, 175, 55, 0.5)"
        }}
        boxShadow="0 4px 20px rgba(11, 31, 58, 0.4)"
        css={{
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <Icon asChild boxSize={8}>
          <LuSparkles />
        </Icon>
      </IconButton>
    </Box>
  );
}

