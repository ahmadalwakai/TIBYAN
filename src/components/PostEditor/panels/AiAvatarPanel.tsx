"use client";

/**
 * AI Avatar Panel - Placeholder for AI avatar generation
 * Does NOT call external AI APIs - just a UI placeholder
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Spinner,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useState } from "react";

const MotionBox = motion.create(Box);

const AVATAR_STYLES = [
  { id: "realistic", label: "واقعي", preview: "🧑" },
  { id: "cartoon", label: "كرتوني", preview: "🎭" },
  { id: "anime", label: "أنمي", preview: "👤" },
  { id: "pixel", label: "بكسل آرت", preview: "👾" },
  { id: "3d", label: "ثلاثي الأبعاد", preview: "🤖" },
  { id: "sketch", label: "رسم", preview: "✏️" },
];

export function AiAvatarPanel() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!selectedStyle) return;
    
    // Simulate generation (no actual AI call)
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      // In a real implementation, this would call an AI API
      // and add the result as an overlay/sticker layer
      alert("ميزة إنشاء الأفاتار بالذكاء الاصطناعي قيد التطوير");
    }, 2000);
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      p={4}
    >
      <VStack gap={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Text fontSize="lg" fontWeight="700" color="gray.800">
            أفاتار بالذكاء الاصطناعي
          </Text>
          <Badge colorScheme="purple" fontSize="xs" px={2} py={1} borderRadius="full">
            قريبًا
          </Badge>
        </HStack>

        {/* Styles Grid */}
        <Box>
          <Text fontSize="sm" fontWeight="600" mb={3} color="gray.700">
            اختر الأسلوب
          </Text>
          <Box
            display="grid"
            gridTemplateColumns="repeat(3, 1fr)"
            gap={3}
          >
            {AVATAR_STYLES.map(({ id, label, preview }) => (
              <Box
                key={id}
                p={4}
                bg={selectedStyle === id ? "purple.50" : "gray.50"}
                borderRadius="xl"
                border="2px solid"
                borderColor={selectedStyle === id ? "purple.500" : "transparent"}
                cursor="pointer"
                onClick={() => setSelectedStyle(id)}
                transition="all 0.2s"
                _hover={{ bg: "gray.100" }}
                textAlign="center"
              >
                <Text fontSize="2xl" mb={2}>
                  {preview}
                </Text>
                <Text fontSize="xs" fontWeight="600" color={selectedStyle === id ? "purple.600" : "gray.700"}>
                  {label}
                </Text>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Preview Area */}
        <Box>
          <Text fontSize="sm" fontWeight="600" mb={3} color="gray.700">
            معاينة
          </Text>
          <Box
            w="100%"
            h="200px"
            bg="gray.100"
            borderRadius="xl"
            display="flex"
            alignItems="center"
            justifyContent="center"
            border="2px dashed"
            borderColor="gray.300"
          >
            {isGenerating ? (
              <VStack gap={3}>
                <Spinner size="xl" color="purple.500" />
                <Text fontSize="sm" color="gray.600">
                  جاري الإنشاء...
                </Text>
              </VStack>
            ) : (
              <VStack gap={2}>
                <Text fontSize="4xl">🤖</Text>
                <Text fontSize="sm" color="gray.500" textAlign="center">
                  اختر أسلوبًا ثم اضغط &quot;إنشاء&quot;
                </Text>
              </VStack>
            )}
          </Box>
        </Box>

        {/* Generate Button */}
        <Button
          size="lg"
          colorScheme="purple"
          borderRadius="xl"
          fontWeight="700"
          disabled={!selectedStyle || isGenerating}
          onClick={handleGenerate}
        >
          {isGenerating ? "جاري الإنشاء..." : "إنشاء أفاتار"}
        </Button>

        {/* Info Box */}
        <Box p={4} bg="purple.50" borderRadius="xl">
          <VStack gap={2} align="stretch">
            <HStack>
              <Text fontSize="lg">✨</Text>
              <Text fontSize="sm" fontWeight="600" color="purple.700">
                قريبًا
              </Text>
            </HStack>
            <Text fontSize="xs" color="purple.600">
              ستتمكن قريبًا من إنشاء أفاتار شخصي باستخدام الذكاء الاصطناعي.
              يمكنك استخدامه في منشوراتك وملفك الشخصي.
            </Text>
          </VStack>
        </Box>

        {/* Features List */}
        <Box>
          <Text fontSize="sm" fontWeight="600" mb={3} color="gray.700">
            الميزات القادمة
          </Text>
          <VStack gap={2} align="stretch">
            {[
              "إنشاء أفاتار من صورتك الشخصية",
              "تخصيص ملامح الوجه والشعر",
              "اختيار الخلفيات والإكسسوارات",
              "تصدير بأحجام متعددة",
              "رسوم متحركة للأفاتار",
            ].map((feature, i) => (
              <HStack key={i} gap={2}>
                <Box w="6px" h="6px" borderRadius="full" bg="purple.400" />
                <Text fontSize="xs" color="gray.600">
                  {feature}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      </VStack>
    </MotionBox>
  );
}

export default AiAvatarPanel;
