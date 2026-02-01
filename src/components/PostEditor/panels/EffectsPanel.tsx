"use client";

/**
 * Effects Panel - Apply visual effects
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
import { EFFECT_PRESETS } from "@/lib/editor/utils";

const MotionBox = motion.create(Box);

export function EffectsPanel() {
  const activeEffect = useEditorStore((s) => s.activeEffect);
  const effectIntensity = useEditorStore((s) => s.effectIntensity);
  const setEffect = useEditorStore((s) => s.setEffect);
  const setEffectIntensity = useEditorStore((s) => s.setEffectIntensity);

  const handleEffectSelect = (effectId: string) => {
    if (effectId === "none") {
      setEffect(null);
    } else {
      setEffect(effectId);
    }
  };

  const handleIntensityChange = (details: { value: number[] }) => {
    setEffectIntensity(details.value[0]);
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
          التأثيرات
        </Text>

        {/* Effects Grid */}
        <SimpleGrid columns={3} gap={3}>
          {EFFECT_PRESETS.map((effect) => (
            <Box
              key={effect.id}
              p={3}
              bg={activeEffect === effect.id || (effect.id === "none" && !activeEffect) ? "brand.50" : "gray.50"}
              borderRadius="xl"
              border="2px solid"
              borderColor={activeEffect === effect.id || (effect.id === "none" && !activeEffect) ? "brand.500" : "transparent"}
              cursor="pointer"
              onClick={() => handleEffectSelect(effect.id)}
              transition="all 0.2s"
              _hover={{ bg: "gray.100" }}
              textAlign="center"
            >
              <Box
                w="40px"
                h="40px"
                mx="auto"
                mb={2}
                borderRadius="lg"
                bg="gray.300"
                display="flex"
                alignItems="center"
                justifyContent="center"
                style={getEffectPreviewStyle(effect.id)}
              >
                <Text fontSize="lg">
                  {getEffectIcon(effect.id)}
                </Text>
              </Box>
              <Text fontSize="xs" fontWeight="600" color="gray.700">
                {effect.nameAr}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        {/* Intensity Slider */}
        {activeEffect && (
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" fontWeight="600" color="gray.700">
                شدة التأثير
              </Text>
              <Text fontSize="sm" color="brand.600" fontWeight="600">
                {effectIntensity}%
              </Text>
            </HStack>
            <Slider.Root
              min={0}
              max={100}
              step={1}
              value={[effectIntensity]}
              onValueChange={handleIntensityChange}
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

        {/* Effect Description */}
        {activeEffect && (
          <Box p={4} bg="blue.50" borderRadius="xl">
            <Text fontSize="sm" color="blue.700">
              {getEffectDescription(activeEffect)}
            </Text>
          </Box>
        )}
      </VStack>
    </MotionBox>
  );
}

function getEffectIcon(effectId: string): string {
  const icons: Record<string, string> = {
    none: "❌",
    vignette: "🔲",
    blur: "🌫️",
    glow: "✨",
    grain: "📺",
    sepia: "🟤",
  };
  return icons[effectId] || "🎨";
}

function getEffectPreviewStyle(effectId: string): React.CSSProperties {
  switch (effectId) {
    case "vignette":
      return {
        boxShadow: "inset 0 0 15px rgba(0,0,0,0.8)",
      };
    case "blur":
      return {
        filter: "blur(2px)",
      };
    case "glow":
      return {
        boxShadow: "0 0 15px rgba(255,255,255,0.8)",
      };
    case "grain":
      return {
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        backgroundSize: "cover",
      };
    case "sepia":
      return {
        filter: "sepia(80%)",
      };
    default:
      return {};
  }
}

function getEffectDescription(effectId: string): string {
  const descriptions: Record<string, string> = {
    vignette: "يضيف تأثير الإطار الداكن حول الحواف للتركيز على المركز",
    blur: "يضيف تأثير الضبابية للخلفية",
    glow: "يضيف تأثير التوهج والإضاءة",
    grain: "يضيف تأثير الحبيبات للمظهر السينمائي",
    sepia: "يضيف لمسة بنية دافئة للصورة",
  };
  return descriptions[effectId] || "";
}

export default EffectsPanel;
