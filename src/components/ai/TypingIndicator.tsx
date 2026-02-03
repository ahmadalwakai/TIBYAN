"use client";

import { Box, Flex } from "@chakra-ui/react";

const bounceAnimation = `
  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-4px); }
  }
`;

export function TypingIndicator() {
  return (
    <Flex gap="1" align="center" h="20px" bg="gray.700" px={4} py={3} borderRadius="xl">
      <style>{bounceAnimation}</style>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          w="6px"
          h="6px"
          bg="gray.400"
          borderRadius="full"
          css={{
            animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </Flex>
  );
}
