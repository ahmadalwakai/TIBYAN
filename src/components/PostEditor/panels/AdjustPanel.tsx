"use client";

/**
 * Adjust Panel - Brightness, contrast, saturation, etc.
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Slider,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useEditorStore } from "@/lib/editor/store";
import type { AdjustmentSettings } from "@/lib/editor/types";

const MotionBox = motion.create(Box);

interface AdjustmentSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}

function AdjustmentSlider({ label, value, min, max, onChange }: AdjustmentSliderProps) {
  return (
    <Box>
      <HStack justify="space-between" mb={2}>
        <Text fontSize="sm" fontWeight="600" color="gray.700">
          {label}
        </Text>
        <Text fontSize="sm" color="brand.600" fontWeight="600">
          {value > 0 ? `+${value}` : value}
        </Text>
      </HStack>
      <Slider.Root
        min={min}
        max={max}
        step={1}
        value={[value]}
        onValueChange={(d) => onChange(d.value[0])}
      >
        <Slider.Control>
          <Slider.Track bg="gray.200" h="6px" borderRadius="full">
            <Slider.Range bg="brand.500" />
          </Slider.Track>
          <Slider.Thumb index={0} bg="brand.500" boxSize="18px" borderRadius="full" />
        </Slider.Control>
      </Slider.Root>
    </Box>
  );
}

export function AdjustPanel() {
  const adjustments = useEditorStore((s) => s.adjustments);
  const setAdjustments = useEditorStore((s) => s.setAdjustments);
  const resetAdjustments = useEditorStore((s) => s.resetAdjustments);
  const saveToHistory = useEditorStore((s) => s.saveToHistory);

  const handleChange = (key: keyof AdjustmentSettings, value: number) => {
    setAdjustments({ [key]: value });
  };

  const handleChangeEnd = () => {
    saveToHistory();
  };

  const isModified = Object.values(adjustments).some((v) => v !== 0);

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
            الضبط
          </Text>
          {isModified && (
            <Button
              size="xs"
              variant="ghost"
              colorPalette="red"
              onClick={resetAdjustments}
            >
              إعادة تعيين
            </Button>
          )}
        </HStack>

        {/* Adjustment Sliders */}
        <VStack gap={5} align="stretch">
          <AdjustmentSlider
            label="السطوع"
            value={adjustments.brightness}
            min={-100}
            max={100}
            onChange={(v) => handleChange("brightness", v)}
          />

          <AdjustmentSlider
            label="التباين"
            value={adjustments.contrast}
            min={-100}
            max={100}
            onChange={(v) => handleChange("contrast", v)}
          />

          <AdjustmentSlider
            label="التشبع"
            value={adjustments.saturation}
            min={-100}
            max={100}
            onChange={(v) => handleChange("saturation", v)}
          />

          <AdjustmentSlider
            label="درجة الحرارة"
            value={adjustments.temperature}
            min={-100}
            max={100}
            onChange={(v) => handleChange("temperature", v)}
          />

          <AdjustmentSlider
            label="التعرض"
            value={adjustments.exposure}
            min={-100}
            max={100}
            onChange={(v) => handleChange("exposure", v)}
          />

          <AdjustmentSlider
            label="الإضاءات"
            value={adjustments.highlights}
            min={-100}
            max={100}
            onChange={(v) => handleChange("highlights", v)}
          />

          <AdjustmentSlider
            label="الظلال"
            value={adjustments.shadows}
            min={-100}
            max={100}
            onChange={(v) => handleChange("shadows", v)}
          />

          <AdjustmentSlider
            label="الحدة"
            value={adjustments.sharpen}
            min={0}
            max={100}
            onChange={(v) => handleChange("sharpen", v)}
          />
        </VStack>

        {/* Presets */}
        <Box>
          <Text fontSize="sm" fontWeight="600" mb={3} color="gray.700">
            إعدادات سريعة
          </Text>
          <HStack gap={2} flexWrap="wrap">
            <Button
              size="xs"
              variant="outline"
              borderRadius="full"
              onClick={() => setAdjustments({ brightness: 10, contrast: 10, saturation: 10 })}
            >
              تحسين
            </Button>
            <Button
              size="xs"
              variant="outline"
              borderRadius="full"
              onClick={() => setAdjustments({ brightness: 5, contrast: 20, saturation: -20 })}
            >
              درامي
            </Button>
            <Button
              size="xs"
              variant="outline"
              borderRadius="full"
              onClick={() => setAdjustments({ temperature: 30, saturation: 10 })}
            >
              دافئ
            </Button>
            <Button
              size="xs"
              variant="outline"
              borderRadius="full"
              onClick={() => setAdjustments({ temperature: -30, saturation: -10 })}
            >
              بارد
            </Button>
            <Button
              size="xs"
              variant="outline"
              borderRadius="full"
              onClick={() => setAdjustments({ saturation: -100 })}
            >
              أبيض وأسود
            </Button>
          </HStack>
        </Box>
      </VStack>
    </MotionBox>
  );
}

export default AdjustPanel;
