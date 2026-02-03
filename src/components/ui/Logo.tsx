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
          bg="linear-gradient(135deg, #00FF2A 0%, #D4B45E 50%, #B08C3A 100%)"
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
              color="#00FF2A"
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
    <Box 
      display="flex" 
      alignItems="center" 
      gap={2}
      css={{
        "@keyframes neonFlash": {
          "0%, 90%, 100%": { opacity: 0.3, filter: "blur(6px)" },
          "93%, 97%": { opacity: 1, filter: "blur(8px)" },
          "95%": { opacity: 0.5, filter: "blur(4px)" },
        },
        "@keyframes borderFlash": {
          "0%, 90%, 100%": { boxShadow: "0 0 15px rgba(0, 255, 42, 0.3), 0 0 30px rgba(0, 255, 42, 0.15)" },
          "93%, 97%": { boxShadow: "0 0 25px rgba(0, 255, 42, 0.8), 0 0 50px rgba(0, 255, 42, 0.5), 0 0 80px rgba(0, 255, 42, 0.3)" },
          "95%": { boxShadow: "0 0 10px rgba(0, 255, 42, 0.2), 0 0 20px rgba(0, 255, 42, 0.1)" },
        },
      }}
    >
      <Box
        position="relative"
        display="inline-block"
      >
        {/* Neon glow effect */}
        <Box
          position="absolute"
          inset="-3px"
          borderRadius="full"
          background="linear-gradient(135deg, #00FF2A, #4DFF6A)"
          opacity={0.3}
          filter="blur(6px)"
          css={{ animation: "neonFlash 3s ease-in-out infinite" }}
        />
        {/* Border ring */}
        <Box
          position="absolute"
          inset="-2px"
          borderRadius="full"
          border="2px solid"
          borderColor="#00FF2A"
          boxShadow="0 0 15px rgba(0, 255, 42, 0.3), 0 0 30px rgba(0, 255, 42, 0.15)"
          css={{ animation: "borderFlash 3s ease-in-out infinite" }}
        />
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
            position: "relative",
          }}
          priority
          onError={() => setImageError(true)}
        />
      </Box>
    </Box>
  );
}
