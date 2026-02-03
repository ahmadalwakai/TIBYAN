"use client";

import { Box, VStack, Text } from "@chakra-ui/react";

interface LiveAgentBadgeProps {
  isStreaming: boolean;
  isThinking?: boolean;
  language?: "ar" | "en";
  reduceMotion?: boolean;
}

// Pulsing animation for live indicator
const pulseAnimation = `
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
    }
    50% {
      box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
    }
  }
`;

export function LiveAgentBadge({ 
  isStreaming, 
  isThinking = false, 
  language = "ar",
  reduceMotion = false,
}: LiveAgentBadgeProps) {
  const isRTL = language === "ar";
  const isActive = isStreaming || isThinking;

  // Determine status label
  const getStatusLabel = (): string | null => {
    if (isThinking) {
      return isRTL ? "يفكر…" : "Thinking...";
    }
    if (isStreaming) {
      return isRTL ? "يكتب…" : "Writing...";
    }
    return null;
  };

  const statusLabel = getStatusLabel();

  return (
    <VStack gap={1} align="center">
      {!reduceMotion && <style>{pulseAnimation}</style>}
      {/* Circular Badge - 44px (same as other round icons) */}
      <Box
        w={11}
        h={11}
        borderRadius="full"
        bg={isActive ? "green.500" : "gray.600"}
        border="2px solid"
        borderColor={isActive ? "green.400" : "gray.500"}
        display="flex"
        alignItems="center"
        justifyContent="center"
        transition={reduceMotion ? "none" : "all 0.3s ease-in-out"}
        {...(isActive && !reduceMotion && { animation: "pulse 2s infinite" })}
      >
        {/* Inner dot for visual clarity */}
        <Box
          w={1.5}
          h={1.5}
          borderRadius="full"
          bg="white"
        />
      </Box>

      {/* Status label - only visible while thinking or streaming */}
      {statusLabel && (
        <Text
          fontSize="xs"
          fontWeight="medium"
          color="green.400"
          textAlign="center"
          mt={1}
          dir={isRTL ? "rtl" : "ltr"}
        >
          {statusLabel}
        </Text>
      )}
    </VStack>
  );
}
