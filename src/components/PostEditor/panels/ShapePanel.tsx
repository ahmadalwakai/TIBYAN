"use client";

/**
 * Shape Panel - Apply shape masks
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Slider,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useEditorStore } from "@/lib/editor/store";
import type { ShapeMaskType } from "@/lib/editor/types";

const MotionBox = motion.create(Box);

const SHAPE_OPTIONS: { type: ShapeMaskType; label: string; icon: string }[] = [
  { type: "none", label: "بدون", icon: "⬜" },
  { type: "rectangle", label: "مستطيل", icon: "▭" },
  { type: "rounded-rectangle", label: "مستدير", icon: "▢" },
  { type: "circle", label: "دائرة", icon: "○" },
  { type: "pill", label: "كبسولة", icon: "⬭" },
];

export function ShapePanel() {
  const shapeMask = useEditorStore((s) => s.shapeMask);
  const setShapeMask = useEditorStore((s) => s.setShapeMask);

  const handleShapeSelect = (type: ShapeMaskType) => {
    setShapeMask({ type, borderRadius: shapeMask.borderRadius || 20 });
  };

  const handleRadiusChange = (details: { value: number[] }) => {
    setShapeMask({ ...shapeMask, borderRadius: details.value[0] });
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
          شكل القناع
        </Text>

        {/* Shape Options */}
        <SimpleGrid columns={3} gap={3}>
          {SHAPE_OPTIONS.map(({ type, label, icon: _icon }) => (
            <Box
              key={type}
              p={4}
              bg={shapeMask.type === type ? "brand.50" : "gray.50"}
              borderRadius="xl"
              border="2px solid"
              borderColor={shapeMask.type === type ? "brand.500" : "transparent"}
              cursor="pointer"
              onClick={() => handleShapeSelect(type)}
              transition="all 0.2s"
              _hover={{ bg: "gray.100" }}
              textAlign="center"
            >
              <Box mb={2}>
                <ShapePreview type={type} isActive={shapeMask.type === type} />
              </Box>
              <Text fontSize="xs" fontWeight="600" color={shapeMask.type === type ? "brand.600" : "gray.700"}>
                {label}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        {/* Border Radius Slider (for rounded-rectangle) */}
        {shapeMask.type === "rounded-rectangle" && (
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" fontWeight="600" color="gray.700">
                نصف قطر الزوايا
              </Text>
              <Text fontSize="sm" color="brand.600" fontWeight="600">
                {shapeMask.borderRadius || 20}px
              </Text>
            </HStack>
            <Slider.Root
              min={0}
              max={100}
              step={1}
              value={[shapeMask.borderRadius || 20]}
              onValueChange={handleRadiusChange}
            >
              <Slider.Control>
                <Slider.Track bg="gray.200" h="6px" borderRadius="full">
                  <Slider.Range bg="brand.500" />
                </Slider.Track>
                <Slider.Thumb index={0} bg="brand.500" boxSize="18px" borderRadius="full" />
              </Slider.Control>
            </Slider.Root>
          </Box>
        )}

        {/* Preview */}
        <Box>
          <Text fontSize="sm" fontWeight="600" mb={2} color="gray.700">
            معاينة الشكل
          </Text>
          <Box
            w="100%"
            h="120px"
            bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            borderRadius="xl"
            overflow="hidden"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Box
              w="80%"
              h="80%"
              bg="white"
              style={getShapeMaskStyle(shapeMask.type, shapeMask.borderRadius)}
            />
          </Box>
        </Box>

        {/* Info */}
        <Box p={4} bg="blue.50" borderRadius="xl">
          <Text fontSize="sm" color="blue.700">
            القناع يُطبق على الصورة/الفيديو الأساسي. الطبقات الأخرى (النص، الملصقات) لا تتأثر.
          </Text>
        </Box>
      </VStack>
    </MotionBox>
  );
}

// ============== Shape Preview Component ==============

function ShapePreview({ type, isActive }: { type: ShapeMaskType; isActive: boolean }) {
  const baseStyle: React.CSSProperties = {
    width: "40px",
    height: "40px",
    margin: "0 auto",
    backgroundColor: isActive ? "var(--chakra-colors-brand-500)" : "var(--chakra-colors-gray-400)",
    transition: "all 0.2s",
  };

  switch (type) {
    case "none":
      return (
        <Box
          style={{
            ...baseStyle,
            border: "3px dashed",
            backgroundColor: "transparent",
            borderColor: isActive ? "var(--chakra-colors-brand-500)" : "var(--chakra-colors-gray-400)",
          }}
        />
      );
    case "rectangle":
      return <Box style={baseStyle} />;
    case "rounded-rectangle":
      return <Box style={{ ...baseStyle, borderRadius: "8px" }} />;
    case "circle":
      return <Box style={{ ...baseStyle, borderRadius: "50%" }} />;
    case "pill":
      return <Box style={{ ...baseStyle, width: "60px", height: "30px", borderRadius: "15px" }} />;
    default:
      return <Box style={baseStyle} />;
  }
}

function getShapeMaskStyle(type: ShapeMaskType, borderRadius?: number): React.CSSProperties {
  switch (type) {
    case "none":
      return {};
    case "rectangle":
      return {};
    case "rounded-rectangle":
      return { borderRadius: `${borderRadius || 20}px` };
    case "circle":
      return { borderRadius: "50%" };
    case "pill":
      return { borderRadius: "9999px", width: "90%", height: "50%" };
    default:
      return {};
  }
}

export default ShapePanel;
