"use client";

/**
 * Text Panel - Add and edit text layers
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Input,
  Textarea,
  Slider,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import {
  FaPlus,
  FaAlignLeft,
  FaAlignCenter,
  FaAlignRight,
  FaBold,
  FaItalic,
} from "react-icons/fa";
import { useEditorStore, selectActiveLayer, selectTextLayers } from "@/lib/editor/store";
import { FONT_OPTIONS, getContrastColor } from "@/lib/editor/utils";
import type { TextLayer } from "@/lib/editor/types";

const MotionBox = motion.create(Box);

const PRESET_COLORS = [
  "#ffffff", "#000000", "#ff4444", "#44ff44", "#4444ff",
  "#ffff44", "#ff44ff", "#44ffff", "#ff8800", "#0088ff",
];

export function TextPanel() {
  const layers = useEditorStore(selectTextLayers);
  const activeLayer = useEditorStore(selectActiveLayer);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const addLayer = useEditorStore((s) => s.addLayer);
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const setActiveLayer = useEditorStore((s) => s.setActiveLayer);

  const [newText, setNewText] = useState("نص جديد");

  const activeTextLayer = activeLayer?.type === "text" ? activeLayer as TextLayer : null;

  const handleAddText = useCallback(() => {
    const textLayer: Omit<TextLayer, "id" | "zIndex"> = {
      type: "text",
      text: newText || "نص جديد",
      x: canvasWidth / 2 - 100,
      y: canvasHeight / 2 - 20,
      width: 200,
      height: 40,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      fontFamily: "IBM Plex Sans Arabic",
      fontSize: 32,
      fontWeight: 600,
      fontStyle: "normal",
      textAlign: "center",
      color: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.5)",
      backgroundPadding: 12,
      borderRadius: 8,
    };
    addLayer(textLayer);
    setNewText("نص جديد");
  }, [newText, canvasWidth, canvasHeight, addLayer]);

  const handleUpdateText = useCallback(
    (updates: Partial<TextLayer>) => {
      if (activeTextLayer) {
        updateLayer(activeTextLayer.id, updates);
      }
    },
    [activeTextLayer, updateLayer]
  );

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
            النص
          </Text>
          <Button
            size="sm"
            variant="solid"
            colorPalette="brand"
            onClick={handleAddText}
            borderRadius="xl"
          >
            <FaPlus />
            <Text mr={2}>إضافة نص</Text>
          </Button>
        </HStack>

        {/* New Text Input */}
        <Box>
          <Text fontSize="sm" fontWeight="600" mb={2} color="gray.700">
            نص جديد
          </Text>
          <Textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="اكتب النص هنا..."
            rows={2}
            borderRadius="xl"
          />
        </Box>

        {/* Text Layers List */}
        {layers.length > 0 && (
          <Box>
            <Text fontSize="sm" fontWeight="600" mb={2} color="gray.700">
              النصوص ({layers.length})
            </Text>
            <VStack gap={2} align="stretch">
              {layers.map((layer) => (
                <Box
                  key={layer.id}
                  p={3}
                  bg={activeTextLayer?.id === layer.id ? "brand.50" : "gray.50"}
                  borderRadius="xl"
                  border="2px solid"
                  borderColor={activeTextLayer?.id === layer.id ? "brand.500" : "transparent"}
                  cursor="pointer"
                  onClick={() => setActiveLayer(layer.id)}
                  transition="all 0.2s"
                  _hover={{ bg: "gray.100" }}
                >
                  <Text fontSize="sm" fontWeight="600" truncate maxW="200px">
                    {layer.text}
                  </Text>
                </Box>
              ))}
            </VStack>
          </Box>
        )}

        {/* Edit Selected Text */}
        {activeTextLayer && (
          <>
            {/* Text Content */}
            <Box>
              <Text fontSize="sm" fontWeight="600" mb={2} color="gray.700">
                تعديل النص
              </Text>
              <Textarea
                value={activeTextLayer.text}
                onChange={(e) => handleUpdateText({ text: e.target.value })}
                rows={3}
                borderRadius="xl"
              />
            </Box>

            {/* Font Family */}
            <Box>
              <Text fontSize="sm" fontWeight="600" mb={2} color="gray.700">
                الخط
              </Text>
              <HStack gap={2} flexWrap="wrap">
                {FONT_OPTIONS.map((font) => (
                  <Button
                    key={font.value}
                    size="xs"
                    variant={activeTextLayer.fontFamily === font.value ? "solid" : "outline"}
                    colorPalette={activeTextLayer.fontFamily === font.value ? "brand" : "gray"}
                    onClick={() => handleUpdateText({ fontFamily: font.value })}
                    borderRadius="lg"
                    fontFamily={font.value}
                  >
                    {font.labelAr}
                  </Button>
                ))}
              </HStack>
            </Box>

            {/* Font Size */}
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" fontWeight="600" color="gray.700">
                  حجم الخط
                </Text>
                <Text fontSize="sm" color="brand.600" fontWeight="600">
                  {activeTextLayer.fontSize}px
                </Text>
              </HStack>
              <Slider.Root
                min={12}
                max={120}
                step={1}
                value={[activeTextLayer.fontSize]}
                onValueChange={(d) => handleUpdateText({ fontSize: d.value[0] })}
              >
                <Slider.Control>
                  <Slider.Track bg="gray.200" h="6px" borderRadius="full">
                    <Slider.Range bg="brand.500" />
                  </Slider.Track>
                  <Slider.Thumb index={0} bg="brand.500" boxSize="18px" borderRadius="full" />
                </Slider.Control>
              </Slider.Root>
            </Box>

            {/* Font Weight & Style */}
            <HStack gap={2}>
              <IconButton
                aria-label="عريض"
                variant={activeTextLayer.fontWeight >= 600 ? "solid" : "outline"}
                colorPalette={activeTextLayer.fontWeight >= 600 ? "brand" : "gray"}
                onClick={() => handleUpdateText({ fontWeight: activeTextLayer.fontWeight >= 600 ? 400 : 700 })}
                borderRadius="xl"
              >
                <FaBold />
              </IconButton>
              <IconButton
                aria-label="مائل"
                variant={activeTextLayer.fontStyle === "italic" ? "solid" : "outline"}
                colorPalette={activeTextLayer.fontStyle === "italic" ? "brand" : "gray"}
                onClick={() => handleUpdateText({ fontStyle: activeTextLayer.fontStyle === "italic" ? "normal" : "italic" })}
                borderRadius="xl"
              >
                <FaItalic />
              </IconButton>
            </HStack>

            {/* Text Alignment */}
            <Box>
              <Text fontSize="sm" fontWeight="600" mb={2} color="gray.700">
                المحاذاة
              </Text>
              <HStack gap={2}>
                <IconButton
                  aria-label="يمين"
                  variant={activeTextLayer.textAlign === "right" ? "solid" : "outline"}
                  colorPalette={activeTextLayer.textAlign === "right" ? "brand" : "gray"}
                  onClick={() => handleUpdateText({ textAlign: "right" })}
                  borderRadius="xl"
                >
                  <FaAlignRight />
                </IconButton>
                <IconButton
                  aria-label="وسط"
                  variant={activeTextLayer.textAlign === "center" ? "solid" : "outline"}
                  colorPalette={activeTextLayer.textAlign === "center" ? "brand" : "gray"}
                  onClick={() => handleUpdateText({ textAlign: "center" })}
                  borderRadius="xl"
                >
                  <FaAlignCenter />
                </IconButton>
                <IconButton
                  aria-label="يسار"
                  variant={activeTextLayer.textAlign === "left" ? "solid" : "outline"}
                  colorPalette={activeTextLayer.textAlign === "left" ? "brand" : "gray"}
                  onClick={() => handleUpdateText({ textAlign: "left" })}
                  borderRadius="xl"
                >
                  <FaAlignLeft />
                </IconButton>
              </HStack>
            </Box>

            {/* Text Color */}
            <Box>
              <Text fontSize="sm" fontWeight="600" mb={2} color="gray.700">
                لون النص
              </Text>
              <HStack gap={2} flexWrap="wrap">
                {PRESET_COLORS.map((color) => (
                  <Box
                    key={color}
                    w="32px"
                    h="32px"
                    borderRadius="full"
                    bg={color}
                    border="3px solid"
                    borderColor={activeTextLayer.color === color ? "brand.500" : "gray.200"}
                    cursor="pointer"
                    onClick={() => handleUpdateText({ color })}
                    transition="all 0.2s"
                    _hover={{ transform: "scale(1.1)" }}
                  />
                ))}
                <Input
                  type="color"
                  value={activeTextLayer.color}
                  onChange={(e) => handleUpdateText({ color: e.target.value })}
                  w="32px"
                  h="32px"
                  p={0}
                  border="none"
                  borderRadius="full"
                  cursor="pointer"
                />
              </HStack>
            </Box>

            {/* Background Color */}
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" fontWeight="600" color="gray.700">
                  خلفية النص
                </Text>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => handleUpdateText({ backgroundColor: activeTextLayer.backgroundColor ? undefined : "rgba(0,0,0,0.5)" })}
                >
                  {activeTextLayer.backgroundColor ? "إزالة" : "إضافة"}
                </Button>
              </HStack>
              {activeTextLayer.backgroundColor && (
                <HStack gap={2} flexWrap="wrap">
                  {["rgba(0,0,0,0.5)", "rgba(0,0,0,0.8)", "rgba(255,255,255,0.5)", "rgba(255,255,255,0.8)", ...PRESET_COLORS.slice(2)].map((color) => (
                    <Box
                      key={color}
                      w="32px"
                      h="32px"
                      borderRadius="lg"
                      bg={color}
                      border="3px solid"
                      borderColor={activeTextLayer.backgroundColor === color ? "brand.500" : "gray.200"}
                      cursor="pointer"
                      onClick={() => handleUpdateText({ backgroundColor: color })}
                      transition="all 0.2s"
                      _hover={{ transform: "scale(1.1)" }}
                    />
                  ))}
                </HStack>
              )}
            </Box>

            {/* Opacity */}
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" fontWeight="600" color="gray.700">
                  الشفافية
                </Text>
                <Text fontSize="sm" color="brand.600" fontWeight="600">
                  {Math.round(activeTextLayer.opacity * 100)}%
                </Text>
              </HStack>
              <Slider.Root
                min={0}
                max={1}
                step={0.01}
                value={[activeTextLayer.opacity]}
                onValueChange={(d) => handleUpdateText({ opacity: d.value[0] })}
              >
                <Slider.Control>
                  <Slider.Track bg="gray.200" h="6px" borderRadius="full">
                    <Slider.Range bg="brand.500" />
                  </Slider.Track>
                  <Slider.Thumb index={0} bg="brand.500" boxSize="18px" borderRadius="full" />
                </Slider.Control>
              </Slider.Root>
            </Box>
          </>
        )}

        {/* Empty State */}
        {layers.length === 0 && (
          <Box
            p={6}
            textAlign="center"
            bg="gray.50"
            borderRadius="xl"
            border="2px dashed"
            borderColor="gray.200"
          >
            <Text color="gray.500" fontSize="sm">
              لم يتم إضافة نصوص بعد
            </Text>
            <Text color="gray.400" fontSize="xs" mt={1}>
              اضغط على "إضافة نص" لإضافة طبقة نص
            </Text>
          </Box>
        )}
      </VStack>
    </MotionBox>
  );
}

export default TextPanel;
