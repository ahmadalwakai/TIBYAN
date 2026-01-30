"use client";

import { Box, BoxProps } from "@chakra-ui/react";
import { ReactNode } from "react";

interface FeatureCardProps extends BoxProps {
  children: ReactNode;
  icon?: ReactNode;
}

export default function FeatureCard({
  children,
  icon,
  ...props
}: FeatureCardProps) {
  return (
    <Box
      bg="surface"
      borderRadius="card"
      border="1px solid"
      borderColor="border"
      boxShadow="card"
      position="relative"
      overflow="hidden"
      transition="all 0.4s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        boxShadow: "cardHover",
        transform: "translateY(-6px)",
        borderColor: "brand.400",
        _before: {
          opacity: 1,
        },
      }}
      _before={{
        content: '""',
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        bg: "backgroundAlt",
        opacity: 0,
        transition: "opacity 0.4s ease",
        pointerEvents: "none",
      }}
      {...props}
    >
      {icon && (
        <Box
          position="absolute"
          top={4}
          right={4}
          fontSize="2xl"
          opacity={0.1}
          transition="all 0.3s ease"
          className="feature-icon"
          css={{
            ".feature-card:hover .feature-icon": {
              opacity: 0.2,
              transform: "scale(1.1)",
            },
          }}
        >
          {icon}
        </Box>
      )}
      {children}
    </Box>
  );
}
