"use client";

import { Box, IconButton, Icon } from "@chakra-ui/react";
import { useRouter, usePathname } from "next/navigation";
import { LuSparkles } from "react-icons/lu";
import { useTranslations } from "next-intl";

export default function AiAgentFab() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("fab");
  
  // Extract locale from pathname (e.g., /ar or /en or root /)
  const locale = pathname.split("/")[1] || "ar";

  return (
    <Box
      position="fixed"
      bottom="160px"
      right="24px"
      zIndex={1400}
      css={{
        "@keyframes neonFlash": {
          "0%, 90%, 100%": { 
            boxShadow: "0 0 15px rgba(0, 255, 42, 0.3), 0 0 30px rgba(0, 255, 42, 0.15)",
            borderColor: "rgba(0, 255, 42, 0.5)"
          },
          "93%, 97%": { 
            boxShadow: "0 0 25px rgba(0, 255, 42, 0.9), 0 0 50px rgba(0, 255, 42, 0.6), 0 0 80px rgba(0, 255, 42, 0.4)",
            borderColor: "#00FF2A"
          },
          "95%": { 
            boxShadow: "0 0 10px rgba(0, 255, 42, 0.2), 0 0 20px rgba(0, 255, 42, 0.1)",
            borderColor: "rgba(0, 255, 42, 0.3)"
          },
        },
      }}
    >
      <IconButton
        aria-label={t("aiAssistant")}
        onClick={() => router.push(`/${locale}/ai`)}
        size="lg"
        w={{ base: "56px", md: "64px" }}
        h={{ base: "56px", md: "64px" }}
        borderRadius="full"
        bg="#0A0A0A"
        color="#00FF2A"
        border="2px solid"
        borderColor="rgba(0, 255, 42, 0.5)"
        boxShadow="0 0 15px rgba(0, 255, 42, 0.3), 0 0 30px rgba(0, 255, 42, 0.15)"
        _hover={{ 
          bg: "#0A0A0A",
          transform: "scale(1.1)",
          boxShadow: "0 0 30px rgba(0, 255, 42, 0.6), 0 0 60px rgba(0, 255, 42, 0.3)",
          borderColor: "#00FF2A"
        }}
        css={{
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          animation: "neonFlash 3s ease-in-out infinite",
        }}
      >
        <Icon asChild boxSize={8}>
          <LuSparkles />
        </Icon>
      </IconButton>
    </Box>
  );
}

