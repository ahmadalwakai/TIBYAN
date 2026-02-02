"use client";

import { Box, Icon, IconButton } from "@chakra-ui/react";
import { useState } from "react";
import { LuMessageSquare, LuX } from "react-icons/lu";
import AIChat from "./AIChat";

interface AIFloatingButtonProps {
  lessonId?: string;
  courseId?: string;
  language?: "ar" | "en";
}

export default function AIFloatingButton({
  lessonId,
  courseId,
  language = "ar",
}: AIFloatingButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isRTL = language === "ar";

  return (
    <>
      {/* Floating Button */}
      <Box
        position="fixed"
        bottom="20px"
        left={isRTL ? "20px" : "auto"}
        right={isRTL ? "auto" : "20px"}
        zIndex={999}
      >
        <IconButton
          aria-label={isOpen ? "Close AI Chat" : "Open AI Chat"}
          size="lg"
          borderRadius="full"
          colorPalette="accent"
          boxShadow="lg"
          onClick={() => setIsOpen(!isOpen)}
          css={{
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "scale(1.1)",
              boxShadow: "0 0 20px var(--chakra-colors-accent-500)",
            },
          }}
        >
          <Icon asChild boxSize={6}>
            {isOpen ? <LuX /> : <LuMessageSquare />}
          </Icon>
        </IconButton>
      </Box>

      {/* Chat Panel */}
      {isOpen && (
        <AIChat
          lessonId={lessonId}
          courseId={courseId}
          language={language}
          isFloating={true}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
