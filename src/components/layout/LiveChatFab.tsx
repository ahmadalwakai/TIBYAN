"use client";

import { Box, Button } from "@chakra-ui/react";
import { useRouter, usePathname } from "next/navigation";
import { LuMessageCircle } from "react-icons/lu";

export default function LiveChatFab() {
  const router = useRouter();
  const pathname = usePathname();

  // Extract locale from pathname (e.g., /ar or /en or root /)
  const locale = pathname.split("/")[1] || "ar";
  
  // Don't show if already on AI chat page
  const isAIPage = pathname.includes("/ai");
  if (isAIPage) return null;

  const handleOpenAI = () => {
    router.push(`/${locale}/ai`);
  };

  return (
    <Box position="fixed" bottom="92px" right="24px" zIndex={1400}>
      <Button
        aria-label={locale === "ar" ? "فتح مساعد تبيان" : "Open Tibyan AI"}
        onClick={handleOpenAI}
        w={{ base: "56px", md: "52px" }}
        h={{ base: "56px", md: "52px" }}
        p={0}
        borderRadius="full"
        bg="accent"
        color="white"
        _hover={{ bg: "accent", opacity: 0.9 }}
        boxShadow="lg"
        transition="all 0.2s"
      >
        <LuMessageCircle size={24} />
      </Button>
    </Box>
  );
}

