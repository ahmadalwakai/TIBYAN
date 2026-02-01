"use client";

/**
 * Overlay Panel - Add image overlay layers
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Input,
  Slider,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useRef, useCallback } from "react";
import {
  FaPlus,
  FaTrash,
  FaImage,
} from "react-icons/fa";
import { useEditorStore, selectOverlayLayers, selectActiveLayer } from "@/lib/editor/store";
import { createObjectUrl, getImageDimensions } from "@/lib/editor/utils";
import type { OverlayLayer, BlendMode } from "@/lib/editor/types";

const MotionBox = motion.create(Box);

const BLEND_MODES: { value: BlendMode; label: string; labelAr: string }[] = [
  { value: "normal", label: "Normal", labelAr: "عادي" },
  { value: "multiply", label: "Multiply", labelAr: "مضاعفة" },
  { value: "screen", label: "Screen", labelAr: "شاشة" },
  { value: "overlay", label: "Overlay", labelAr: "تراكب" },
  { value: "darken", label: "Darken", labelAr: "تعتيم" },
  { value: "lighten", label: "Lighten", labelAr: "تفتيح" },
];

export function OverlayPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const layers = useEditorStore(selectOverlayLayers);
  const activeLayer = useEditorStore(selectActiveLayer);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const addLayer = useEditorStore((s) => s.addLayer);
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const removeLayer = useEditorStore((s) => s.removeLayer);
  const setActiveLayer = useEditorStore((s) => s.setActiveLayer);

  const activeOverlayLayer = activeLayer?.type === "overlay" ? activeLayer as OverlayLayer : null;

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;

      const url = createObjectUrl(file);
      const dimensions = await getImageDimensions(url);

      // Scale to fit canvas
      const scale = Math.min(
        (canvasWidth * 0.5) / dimensions.width,
        (canvasHeight * 0.5) / dimensions.height
      );

      const overlayLayer: Omit<OverlayLayer, "id" | "zIndex"> = {
        type: "overlay",
        imageUrl: url,
        x: canvasWidth / 2 - (dimensions.width * scale) / 2,
        y: canvasHeight / 2 - (dimensions.height * scale) / 2,
        width: dimensions.width * scale,
        height: dimensions.height * scale,
        rotation: 0,
        opacity: 0.8,
        visible: true,
        locked: false,
        blendMode: "normal",
      };

      addLayer(overlayLayer);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [canvasWidth, canvasHeight, addLayer]
  );

  const handleUpdateOverlay = useCallback(
    (updates: Partial<OverlayLayer>) => {
      if (activeOverlayLayer) {
        updateLayer(activeOverlayLayer.id, updates);
      }
    },
    [activeOverlayLayer, updateLayer]
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
            طبقات الصور
          </Text>
          <Button
            size="sm"
            variant="solid"
            colorPalette="brand"
            onClick={() => fileInputRef.current?.click()}
            borderRadius="xl"
          >
            <FaPlus />
            <Text mr={2}>إضافة صورة</Text>
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            display="none"
            onChange={handleFileSelect}
          />
        </HStack>

        {/* Overlay Layers List */}
        {layers.length > 0 ? (
          <VStack gap={3} align="stretch">
            {layers.map((layer) => (
              <Box
                key={layer.id}
                p={3}
                bg={activeOverlayLayer?.id === layer.id ? "brand.50" : "gray.50"}
                borderRadius="xl"
                border="2px solid"
                borderColor={activeOverlayLayer?.id === layer.id ? "brand.500" : "transparent"}
                cursor="pointer"
                onClick={() => setActiveLayer(layer.id)}
                transition="all 0.2s"
                _hover={{ bg: "gray.100" }}
              >
                <HStack justify="space-between">
                  <HStack gap={3}>
                    <Box
                      w="40px"
                      h="40px"
                      borderRadius="lg"
                      overflow="hidden"
                      bg="gray.200"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={layer.imageUrl}
                        alt="overlay"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </Box>
                    <Box>
                      <Text fontSize="sm" fontWeight="600" color="gray.700">
                        طبقة صورة
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {BLEND_MODES.find((b) => b.value === layer.blendMode)?.labelAr}
                      </Text>
                    </Box>
                  </HStack>
                  <IconButton
                    aria-label="حذف"
                    variant="ghost"
                    size="sm"
                    colorPalette="red"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLayer(layer.id);
                    }}
                  >
                    <FaTrash />
                  </IconButton>
                </HStack>
              </Box>
            ))}
          </VStack>
        ) : (
          <Box
            p={6}
            textAlign="center"
            bg="gray.50"
            borderRadius="xl"
            border="2px dashed"
            borderColor="gray.200"
          >
            <FaImage size={24} color="var(--chakra-colors-gray-400)" style={{ margin: "0 auto 12px" }} />
            <Text color="gray.500" fontSize="sm">
              لم يتم إضافة طبقات صور
            </Text>
            <Text color="gray.400" fontSize="xs" mt={1}>
              أضف صورة PNG شفافة كطبقة فوق الصورة الأساسية
            </Text>
          </Box>
        )}

        {/* Edit Selected Overlay */}
        {activeOverlayLayer && (
          <>
            {/* Blend Mode */}
            <Box>
              <Text fontSize="sm" fontWeight="600" mb={2} color="gray.700">
                وضع المزج
              </Text>
              <HStack gap={2} flexWrap="wrap">
                {BLEND_MODES.map((mode) => (
                  <Button
                    key={mode.value}
                    size="xs"
                    variant={activeOverlayLayer.blendMode === mode.value ? "solid" : "outline"}
                    colorPalette={activeOverlayLayer.blendMode === mode.value ? "brand" : "gray"}
                    onClick={() => handleUpdateOverlay({ blendMode: mode.value })}
                    borderRadius="lg"
                  >
                    {mode.labelAr}
                  </Button>
                ))}
              </HStack>
            </Box>

            {/* Opacity */}
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="sm" fontWeight="600" color="gray.700">
                  الشفافية
                </Text>
                <Text fontSize="sm" color="brand.600" fontWeight="600">
                  {Math.round(activeOverlayLayer.opacity * 100)}%
                </Text>
              </HStack>
              <Slider.Root
                min={0}
                max={1}
                step={0.01}
                value={[activeOverlayLayer.opacity]}
                onValueChange={(d) => handleUpdateOverlay({ opacity: d.value[0] })}
              >
                <Slider.Control>
                  <Slider.Track bg="gray.200" h="6px" borderRadius="full">
                    <Slider.Range bg="brand.500" />
                  </Slider.Track>
                  <Slider.Thumb index={0} bg="brand.500" boxSize="18px" borderRadius="full" />
                </Slider.Control>
              </Slider.Root>
            </Box>

            {/* Position Info */}
            <Box p={3} bg="gray.50" borderRadius="xl">
              <Text fontSize="xs" color="gray.500">
                الموقع: ({Math.round(activeOverlayLayer.x)}, {Math.round(activeOverlayLayer.y)}) |
                الحجم: {Math.round(activeOverlayLayer.width)} × {Math.round(activeOverlayLayer.height)}
              </Text>
            </Box>
          </>
        )}
      </VStack>
    </MotionBox>
  );
}

export default OverlayPanel;
