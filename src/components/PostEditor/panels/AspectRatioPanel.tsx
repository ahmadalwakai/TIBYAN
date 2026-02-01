"use client";

/**
 * Aspect Ratio Panel - Choose aspect ratio presets
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  SimpleGrid,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useEditorStore } from "@/lib/editor/store";
import { ASPECT_RATIOS, getAspectRatioDimensions } from "@/lib/editor/utils";
import type { AspectRatioPreset } from "@/lib/editor/types";

const MotionBox = motion.create(Box);

const ASPECT_RATIO_OPTIONS: { preset: AspectRatioPreset; icon: string }[] = [
  { preset: "1:1", icon: "⬜" },
  { preset: "4:5", icon: "📱" },
  { preset: "16:9", icon: "🖥️" },
  { preset: "9:16", icon: "📲" },
  { preset: "4:3", icon: "📺" },
  { preset: "3:4", icon: "🖼️" },
];

export function AspectRatioPanel() {
  const aspectRatio = useEditorStore((s) => s.aspectRatio);
  const setAspectRatio = useEditorStore((s) => s.setAspectRatio);
  const setCanvasDimensions = useEditorStore((s) => s.setCanvasDimensions);

  const handleAspectRatioSelect = (preset: AspectRatioPreset) => {
    const newAspectRatio = getAspectRatioDimensions(preset, 1080);
    setAspectRatio(newAspectRatio);
    setCanvasDimensions(newAspectRatio.width, newAspectRatio.height);
  };

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      p={4}
    >
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Text fontSize="lg" fontWeight="700" color="gray.800">
          نسبة العرض
        </Text>

        {/* Aspect Ratio Grid */}
        <SimpleGrid columns={3} gap={3}>
          {ASPECT_RATIO_OPTIONS.map(({ preset, icon }) => {
            const ratio = ASPECT_RATIOS[preset];
            return (
              <Box
                key={preset}
                p={4}
                bg={aspectRatio.preset === preset ? "brand.50" : "gray.50"}
                borderRadius="xl"
                border="2px solid"
                borderColor={aspectRatio.preset === preset ? "brand.500" : "transparent"}
                cursor="pointer"
                onClick={() => handleAspectRatioSelect(preset)}
                transition="all 0.2s"
                _hover={{ bg: "gray.100" }}
                textAlign="center"
              >
                <Box mb={2}>
                  <AspectRatioPreview preset={preset} isActive={aspectRatio.preset === preset} />
                </Box>
                <Text fontSize="sm" fontWeight="700" color={aspectRatio.preset === preset ? "brand.600" : "gray.700"}>
                  {preset}
                </Text>
                <Text fontSize="xs" color="gray.500">
                  {ratio.labelAr}
                </Text>
              </Box>
            );
          })}
        </SimpleGrid>

        {/* Current Dimensions */}
        <Box p={4} bg="gray.50" borderRadius="xl">
          <Text fontSize="sm" fontWeight="600" color="gray.700" mb={2}>
            الأبعاد الحالية
          </Text>
          <HStack justify="center" gap={2}>
            <Text fontSize="lg" fontWeight="700" color="brand.600">
              {aspectRatio.width}
            </Text>
            <Text fontSize="lg" color="gray.400">×</Text>
            <Text fontSize="lg" fontWeight="700" color="brand.600">
              {aspectRatio.height}
            </Text>
            <Text fontSize="sm" color="gray.500">px</Text>
          </HStack>
        </Box>

        {/* Usage Tips */}
        <Box p={4} bg="blue.50" borderRadius="xl">
          <Text fontSize="sm" fontWeight="600" color="blue.700" mb={2}>
            نصائح
          </Text>
          <VStack gap={1} align="stretch">
            <Text fontSize="xs" color="blue.600">• 1:1 - مثالي لإنستغرام</Text>
            <Text fontSize="xs" color="blue.600">• 4:5 - منشورات إنستغرام المميزة</Text>
            <Text fontSize="xs" color="blue.600">• 16:9 - يوتيوب والعروض التقديمية</Text>
            <Text fontSize="xs" color="blue.600">• 9:16 - قصص وريلز</Text>
          </VStack>
        </Box>
      </VStack>
    </MotionBox>
  );
}

// ============== Aspect Ratio Preview Component ==============

function AspectRatioPreview({ preset, isActive }: { preset: AspectRatioPreset; isActive: boolean }) {
  const ratio = ASPECT_RATIOS[preset];
  const maxSize = 40;
  
  let width: number;
  let height: number;
  
  if (ratio.width >= ratio.height) {
    width = maxSize;
    height = Math.round((maxSize * ratio.height) / ratio.width);
  } else {
    height = maxSize;
    width = Math.round((maxSize * ratio.width) / ratio.height);
  }

  return (
    <Box
      w={`${width}px`}
      h={`${height}px`}
      mx="auto"
      borderRadius="4px"
      bg={isActive ? "brand.500" : "gray.300"}
      border="2px solid"
      borderColor={isActive ? "brand.600" : "gray.400"}
      transition="all 0.2s"
    />
  );
}

export default AspectRatioPanel;
