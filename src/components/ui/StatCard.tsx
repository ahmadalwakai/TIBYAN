"use client";

import { Box, BoxProps, Flex, Text } from "@chakra-ui/react";
import { ReactNode } from "react";

interface StatCardProps extends BoxProps {
  title?: string;
  value?: string | number;
  icon?: string;
  color?: string;
  children?: ReactNode;
  accentColor?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  color,
  children,
  accentColor,
  ...props
}: StatCardProps) {
  const accent = accentColor || color || "brand.500";
  
  return (
    <Box
      bg="surface"
      border="1px solid"
      borderColor="border"
      borderRadius="xl"
      boxShadow="sm"
      position="relative"
      overflow="hidden"
      p={5}
      transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
      _hover={{
        boxShadow: "md",
        transform: "translateY(-2px)",
        borderColor: accent,
      }}
      _before={{
        content: '""',
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: "4px",
        bg: accent,
        transition: "width 0.3s ease",
      }}
      _after={{
        content: '""',
        position: "absolute",
        top: 0,
        right: 0,
        width: "60px",
        height: "60px",
        bg: accent,
        opacity: 0.05,
        borderRadius: "0 0 0 100%",
      }}
      {...props}
    >
      {title && value !== undefined ? (
        <Flex direction="column" gap={2}>
          <Flex align="center" justify="space-between">
            <Text fontSize="sm" color="gray.500" fontWeight="medium">
              {title}
            </Text>
            {icon && (
              <Text fontSize="xl">{icon}</Text>
            )}
          </Flex>
          <Text fontSize="2xl" fontWeight="bold" color={accent}>
            {value}
          </Text>
        </Flex>
      ) : (
        children
      )}
    </Box>
  );
}
