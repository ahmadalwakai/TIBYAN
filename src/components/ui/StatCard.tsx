"use client";

import { Box, BoxProps } from "@chakra-ui/react";
import { ReactNode } from "react";

interface StatCardProps extends BoxProps {
  children: ReactNode;
  accentColor?: string;
}

export default function StatCard({
  children,
  accentColor = "brand.500",
  ...props
}: StatCardProps) {
  return (
    <Box
      bg="surface"
      border="1px solid"
      borderColor="border"
      borderRadius="card"
      boxShadow="card"
      position="relative"
      overflow="hidden"
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        boxShadow: "cardHover",
        transform: "translateY(-2px)",
        borderColor: accentColor,
      }}
      _before={{
        content: '""',
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: "4px",
        bg: accentColor,
        transition: "width 0.3s ease",
      }}
      _after={{
        content: '""',
        position: "absolute",
        top: 0,
        right: 0,
        width: "60px",
        height: "60px",
        bg: accentColor,
        opacity: 0.05,
        borderRadius: "0 0 0 100%",
      }}
      {...props}
    >
      {children}
    </Box>
  );
}
