"use client";

/**
 * Background Panel - Set background color, gradient, blur, or image
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Input,
  Slider,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useRef, useCallback } from "react";
import { FaImage } from "react-icons/fa";
import { useEditorStore } from "@/lib/editor/store";
import { createObjectUrl } from "@/lib/editor/utils";
import type { BackgroundType } from "@/lib/editor/types";

const MotionBox = motion.create(Box);

const PRESET_COLORS = [
  "#000000", "#ffffff", "#1a1a2e", "#16213e", "#0f3460",
  "#533483", "#e94560", "#f39c12", "#27ae60", "#3498db",
];

const PRESET_GRADIENTS = [
  { colors: ["#667eea", "#764ba2"], angle: 135 },
  { colors: ["#f093fb", "#f5576c"], angle: 135 },
  { colors: ["#4facfe", "#00f2fe"], angle: 135 },
  { colors: ["#43e97b", "#38f9d7"], angle: 135 },
  { colors: ["#fa709a", "#fee140"], angle: 135 },
  { colors: ["#a8edea", "#fed6e3"], angle: 135 },
  { colors: ["#ff9a9e", "#fecfef"], angle: 135 },
  { colors: ["#667eea", "#764ba2"], angle: 90 },
];

export function BackgroundPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const background = useEditorStore((s) => s.background);
  const setBackground = useEditorStore((s) => s.setBackground);

  const handleTypeSelect = (type: BackgroundType) => {
    setBackground({ type });
  };

  const handleColorSelect = (color: string) => {
    setBackground({ type: "solid", color });
  };

  const handleGradientSelect = (gradient: { colors: string[]; angle: number }) => {
    setBackground({
      type: "gradient",
      gradient: {
        type: "linear",
        colors: gradient.colors,
        angle: gradient.angle,
      },
    });
  };

  const handleBlurChange = (details: { value: number[] }) => {
    setBackground({ type: "blur", blurAmount: details.value[0] });
  };

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;

      const url = createObjectUrl(file);
      setBackground({ type: "image", imageUrl: url });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [setBackground]
  );

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      p={4}
    >
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Text fontSize="lg" fontWeight="700" color="gray.800">
          الخلفية
        </Text>

        {/* Background Type */}
        <Box>
          <Text fontSize="sm" fontWeight="600" mb={2} color="gray.700">
            نوع الخلفية
          </Text>
          <HStack gap={2}>
            {([
              { type: "solid" as BackgroundType, label: "لون" },
              { type: "gradient" as BackgroundType, label: "تدرج" },
              { type: "blur" as BackgroundType, label: "ضبابي" },
              { type: "image" as BackgroundType, label: "صورة" },
            ]).map(({ type, label }) => (
              <Button
                key={type}
                size="sm"
                flex={1}
                variant={background.type === type ? "solid" : "outline"}
                colorPalette={background.type === type ? "brand" : "gray"}
                onClick={() => handleTypeSelect(type)}
                borderRadius="xl"
              >
                {label}
              </Button>
            ))}
          </HStack>
        </Box>

        {/* Solid Color Options */}
        {background.type === "solid" && (
          <Box>
            <Text fontSize="sm" fontWeight="600" mb={2} color="gray.700">
              اختر لوناً
            </Text>
            <HStack gap={2} flexWrap="wrap">
              {PRESET_COLORS.map((color) => (
                <Box
                  key={color}
                  w="36px"
                  h="36px"
                  borderRadius="lg"
                  bg={color}
                  border="3px solid"
                  borderColor={background.color === color ? "brand.500" : "gray.200"}
                  cursor="pointer"
                  onClick={() => handleColorSelect(color)}
                  transition="all 0.2s"
                  _hover={{ transform: "scale(1.1)" }}
                />
              ))}
              <Input
                type="color"
                value={background.color || "#000000"}
                onChange={(e) => handleColorSelect(e.target.value)}
                w="36px"
                h="36px"
                p={0}
                border="none"
                borderRadius="lg"
                cursor="pointer"
              />
            </HStack>
          </Box>
        )}

        {/* Gradient Options */}
        {background.type === "gradient" && (
          <Box>
            <Text fontSize="sm" fontWeight="600" mb={2} color="gray.700">
              اختر تدرجاً
            </Text>
            <HStack gap={2} flexWrap="wrap">
              {PRESET_GRADIENTS.map((gradient, idx) => (
                <Box
                  key={idx}
                  w="36px"
                  h="36px"
                  borderRadius="lg"
                  bg={`linear-gradient(${gradient.angle}deg, ${gradient.colors.join(", ")})`}
                  border="3px solid"
                  borderColor={
                    background.gradient?.colors.join() === gradient.colors.join()
                      ? "brand.500"
                      : "gray.200"
                  }
                  cursor="pointer"
                  onClick={() => handleGradientSelect(gradient)}
                  transition="all 0.2s"
                  _hover={{ transform: "scale(1.1)" }}
                />
              ))}
            </HStack>

            {/* Custom Gradient Colors */}
            <HStack mt={4} gap={3}>
              <Box flex={1}>
                <Text fontSize="xs" color="gray.500" mb={1}>اللون الأول</Text>
                <Input
                  type="color"
                  value={background.gradient?.colors[0] || "#667eea"}
                  onChange={(e) =>
                    setBackground({
                      gradient: {
                        type: "linear",
                        colors: [e.target.value, background.gradient?.colors[1] || "#764ba2"],
                        angle: background.gradient?.angle || 135,
                      },
                    })
                  }
                  h="40px"
                  p={0}
                  border="none"
                  borderRadius="lg"
                />
              </Box>
              <Box flex={1}>
                <Text fontSize="xs" color="gray.500" mb={1}>اللون الثاني</Text>
                <Input
                  type="color"
                  value={background.gradient?.colors[1] || "#764ba2"}
                  onChange={(e) =>
                    setBackground({
                      gradient: {
                        type: "linear",
                        colors: [background.gradient?.colors[0] || "#667eea", e.target.value],
                        angle: background.gradient?.angle || 135,
                      },
                    })
                  }
                  h="40px"
                  p={0}
                  border="none"
                  borderRadius="lg"
                />
              </Box>
            </HStack>
          </Box>
        )}

        {/* Blur Options */}
        {background.type === "blur" && (
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" fontWeight="600" color="gray.700">
                مقدار الضبابية
              </Text>
              <Text fontSize="sm" color="brand.600" fontWeight="600">
                {background.blurAmount || 20}px
              </Text>
            </HStack>
            <Slider.Root
              min={0}
              max={50}
              step={1}
              value={[background.blurAmount || 20]}
              onValueChange={handleBlurChange}
            >
              <Slider.Control>
                <Slider.Track bg="gray.200" h="6px" borderRadius="full">
                  <Slider.Range bg="brand.500" />
                </Slider.Track>
                <Slider.Thumb index={0} bg="brand.500" boxSize="18px" borderRadius="full" />
              </Slider.Control>
            </Slider.Root>
            <Text fontSize="xs" color="gray.500" mt={2}>
              تطبيق ضبابية على الوسائط كخلفية
            </Text>
          </Box>
        )}

        {/* Image Options */}
        {background.type === "image" && (
          <Box>
            <Button
              w="100%"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              borderRadius="xl"
              h="80px"
              flexDirection="column"
              gap={2}
            >
              {background.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={background.imageUrl}
                  alt="background"
                  style={{
                    width: "60px",
                    height: "40px",
                    objectFit: "cover",
                    borderRadius: "6px",
                  }}
                />
              ) : (
                <>
                  <FaImage size={20} />
                  <Text fontSize="sm">اختر صورة للخلفية</Text>
                </>
              )}
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              display="none"
              onChange={handleFileSelect}
            />
          </Box>
        )}

        {/* Preview */}
        <Box>
          <Text fontSize="sm" fontWeight="600" mb={2} color="gray.700">
            معاينة الخلفية
          </Text>
          <Box
            w="100%"
            h="80px"
            borderRadius="xl"
            border="2px solid"
            borderColor="gray.200"
            overflow="hidden"
            style={getBackgroundStyle(background)}
          />
        </Box>
      </VStack>
    </MotionBox>
  );
}

function getBackgroundStyle(background: ReturnType<typeof useEditorStore.getState>["background"]): React.CSSProperties {
  switch (background.type) {
    case "solid":
      return { backgroundColor: background.color };
    case "gradient":
      if (background.gradient) {
        return {
          background: `linear-gradient(${background.gradient.angle || 135}deg, ${background.gradient.colors.join(", ")})`,
        };
      }
      return {};
    case "blur":
      return {
        backgroundColor: "#888",
        filter: `blur(${background.blurAmount || 20}px)`,
      };
    case "image":
      return background.imageUrl
        ? {
            backgroundImage: `url(${background.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }
        : {};
    default:
      return { backgroundColor: "#000000" };
  }
}

export default BackgroundPanel;
