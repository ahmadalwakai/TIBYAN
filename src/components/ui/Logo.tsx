"use client";

import { Box } from "@chakra-ui/react";
import Image from "next/image";
import { useState } from "react";

interface LogoProps {
  size?: number;
  showText?: boolean;
}

export default function Logo({ size = 392, showText = true }: LogoProps) {
  const [imageError, setImageError] = useState(false);
  // Calculate height maintaining aspect ratio (logo is roughly square with text below)
  const _imageHeight = showText ? size * 1.4 : size;

  // Fallback text logo when image is not available
  if (imageError) {
    return (
      <Box display="flex" alignItems="center" gap={2}>
        <Box
          width={`${size}px`}
          height={`${size}px`}
          borderRadius="lg"
          bg="linear-gradient(135deg, #C8A24A 0%, #D4B45E 50%, #B08C3A 100%)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          fontWeight="900"
          fontSize={size > 30 ? "lg" : "sm"}
          color="#0B1F3A"
        >
          ت
        </Box>
        {showText && (
          <Box>
            <Box
              fontSize="xl"
              fontWeight="900"
              lineHeight="1.2"
              color="#C8A24A"
            >
              تبيان
            </Box>
            <Box
              fontSize="xs"
              fontWeight="700"
              letterSpacing="wider"
              color="#0B1F3A"
            >
              TIBYAN
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <Box display="flex" alignItems="center" gap={2}>
      <Image
        src="/logo.jpeg"
        alt="تبيان - Tibyan Academy"
        width={size}
        height={size}
        style={{
          objectFit: "cover",
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
        }}
        priority
        onError={() => setImageError(true)}
      />
    </Box>
  );
}
