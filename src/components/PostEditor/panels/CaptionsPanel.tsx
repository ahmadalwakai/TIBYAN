"use client";

/**
 * Captions Panel - Add timed captions for video
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
  FaTrash,
  FaClosedCaptioning,
} from "react-icons/fa";
import { useEditorStore, selectActiveMedia, selectCaptionLayers, selectActiveLayer } from "@/lib/editor/store";
import { formatTime, parseTime } from "@/lib/editor/utils";
import type { CaptionLayer } from "@/lib/editor/types";

const MotionBox = motion.create(Box);

const PRESET_COLORS = [
  "#ffffff", "#000000", "#ffff00", "#00ff00", "#ff0000",
];

export function CaptionsPanel() {
  const activeMedia = useEditorStore(selectActiveMedia);
  const layers = useEditorStore(selectCaptionLayers);
  const activeLayer = useEditorStore(selectActiveLayer);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const currentTime = useEditorStore((s) => s.currentTime);
  const addLayer = useEditorStore((s) => s.addLayer);
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const removeLayer = useEditorStore((s) => s.removeLayer);
  const setActiveLayer = useEditorStore((s) => s.setActiveLayer);

  const [newCaption, setNewCaption] = useState("");

  const activeCaptionLayer = activeLayer?.type === "caption" ? activeLayer as CaptionLayer : null;

  if (!activeMedia || activeMedia.type !== "video") {
    return (
      <Box p={6} textAlign="center">
        <Text color="gray.500">الترجمة متاحة للفيديو فقط</Text>
      </Box>
    );
  }

  const duration = activeMedia.duration || 60;

  const handleAddCaption = () => {
    const captionLayer: Omit<CaptionLayer, "id" | "zIndex"> = {
      type: "caption",
      text: newCaption || "نص الترجمة",
      x: canvasWidth / 2,
      y: canvasHeight - 100,
      width: canvasWidth * 0.8,
      height: 60,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      startTime: currentTime,
      endTime: Math.min(currentTime + 3, duration),
      fontFamily: "IBM Plex Sans Arabic",
      fontSize: 24,
      fontWeight: 600,
      color: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.7)",
      backgroundPadding: 12,
      position: "bottom",
    };
    addLayer(captionLayer);
    setNewCaption("");
  };

  const handleUpdateCaption = useCallback(
    (updates: Partial<CaptionLayer>) => {
      if (activeCaptionLayer) {
        updateLayer(activeCaptionLayer.id, updates);
      }
    },
    [activeCaptionLayer, updateLayer]
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
            الترجمة
          </Text>
          <Button
            size="sm"
            variant="solid"
            colorPalette="brand"
            onClick={handleAddCaption}
            borderRadius="xl"
          >
            <FaPlus />
            <Text mr={2}>إضافة</Text>
          </Button>
        </HStack>

        {/* New Caption Input */}
        <Box>
          <Text fontSize="sm" fontWeight="600" mb={2} color="gray.700">
            نص الترجمة الجديدة
          </Text>
          <Textarea
            value={newCaption}
            onChange={(e) => setNewCaption(e.target.value)}
            placeholder="اكتب نص الترجمة..."
            rows={2}
            borderRadius="xl"
          />
          <Text fontSize="xs" color="gray.500" mt={1}>
            سيتم إضافة الترجمة عند الوقت الحالي: {formatTime(currentTime)}
          </Text>
        </Box>

        {/* Captions List */}
        {layers.length > 0 ? (
          <VStack gap={3} align="stretch">
            <Text fontSize="sm" fontWeight="600" color="gray.700">
              الترجمات ({layers.length})
            </Text>
            {layers
              .sort((a, b) => a.startTime - b.startTime)
              .map((layer) => (
                <Box
                  key={layer.id}
                  p={3}
                  bg={activeCaptionLayer?.id === layer.id ? "brand.50" : "gray.50"}
                  borderRadius="xl"
                  border="2px solid"
                  borderColor={activeCaptionLayer?.id === layer.id ? "brand.500" : "transparent"}
                  cursor="pointer"
                  onClick={() => setActiveLayer(layer.id)}
                  transition="all 0.2s"
                  _hover={{ bg: "gray.100" }}
                >
                  <HStack justify="space-between">
                    <Box flex={1}>
                      <Text fontSize="sm" fontWeight="600" color="gray.700" truncate maxW="150px">
                        {layer.text}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {formatTime(layer.startTime)} - {formatTime(layer.endTime)}
                      </Text>
                    </Box>
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
            <FaClosedCaptioning size={24} color="var(--chakra-colors-gray-400)" style={{ margin: "0 auto 12px" }} />
            <Text color="gray.500" fontSize="sm">
              لم يتم إضافة ترجمات
            </Text>
            <Text color="gray.400" fontSize="xs" mt={1}>
              أضف ترجمات مؤقتة تظهر في أوقات محددة
            </Text>
          </Box>
        )}

        {/* Edit Selected Caption */}
        {activeCaptionLayer && (
          <>
            {/* Caption Text */}
            <Box>
              <Text fontSize="sm" fontWeight="600" mb={2} color="gray.700">
                تعديل النص
              </Text>
              <Textarea
                value={activeCaptionLayer.text}
                onChange={(e) => handleUpdateCaption({ text: e.target.value })}
                rows={2}
                borderRadius="xl"
              />
            </Box>

            {/* Timing */}
            <Box>
              <Text fontSize="sm" fontWeight="600" mb={3} color="gray.700">
                التوقيت
              </Text>
              
              <VStack gap={4}>
                <Box w="100%">
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="xs" color="gray.500">البداية</Text>
                    <Text fontSize="xs" color="gray.600">
                      {formatTime(activeCaptionLayer.startTime)}
                    </Text>
                  </HStack>
                  <Slider.Root
                    min={0}
                    max={duration}
                    step={0.1}
                    value={[activeCaptionLayer.startTime]}
                    onValueChange={(d) => handleUpdateCaption({ startTime: d.value[0] })}
                  >
                    <Slider.Control>
                      <Slider.Track bg="gray.200" h="6px" borderRadius="full">
                        <Slider.Range bg="green.500" />
                      </Slider.Track>
                      <Slider.Thumb index={0} bg="green.500" boxSize="18px" borderRadius="full" />
                    </Slider.Control>
                  </Slider.Root>
                </Box>

                <Box w="100%">
                  <HStack justify="space-between" mb={2}>
                    <Text fontSize="xs" color="gray.500">النهاية</Text>
                    <Text fontSize="xs" color="gray.600">
                      {formatTime(activeCaptionLayer.endTime)}
                    </Text>
                  </HStack>
                  <Slider.Root
                    min={0}
                    max={duration}
                    step={0.1}
                    value={[activeCaptionLayer.endTime]}
                    onValueChange={(d) => handleUpdateCaption({ endTime: d.value[0] })}
                  >
                    <Slider.Control>
                      <Slider.Track bg="gray.200" h="6px" borderRadius="full">
                        <Slider.Range bg="red.500" />
                      </Slider.Track>
                      <Slider.Thumb index={0} bg="red.500" boxSize="18px" borderRadius="full" />
                    </Slider.Control>
                  </Slider.Root>
                </Box>
              </VStack>
            </Box>

            {/* Position */}
            <Box>
              <Text fontSize="sm" fontWeight="600" mb={2} color="gray.700">
                الموضع
              </Text>
              <HStack gap={2}>
                {(["top", "center", "bottom"] as const).map((pos) => (
                  <Button
                    key={pos}
                    size="sm"
                    flex={1}
                    variant={activeCaptionLayer.position === pos ? "solid" : "outline"}
                    colorPalette={activeCaptionLayer.position === pos ? "brand" : "gray"}
                    onClick={() => handleUpdateCaption({ position: pos })}
                    borderRadius="xl"
                  >
                    {pos === "top" ? "أعلى" : pos === "center" ? "وسط" : "أسفل"}
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
                  {activeCaptionLayer.fontSize}px
                </Text>
              </HStack>
              <Slider.Root
                min={14}
                max={48}
                step={1}
                value={[activeCaptionLayer.fontSize]}
                onValueChange={(d) => handleUpdateCaption({ fontSize: d.value[0] })}
              >
                <Slider.Control>
                  <Slider.Track bg="gray.200" h="6px" borderRadius="full">
                    <Slider.Range bg="brand.500" />
                  </Slider.Track>
                  <Slider.Thumb index={0} bg="brand.500" boxSize="18px" borderRadius="full" />
                </Slider.Control>
              </Slider.Root>
            </Box>

            {/* Text Color */}
            <Box>
              <Text fontSize="sm" fontWeight="600" mb={2} color="gray.700">
                لون النص
              </Text>
              <HStack gap={2}>
                {PRESET_COLORS.map((color) => (
                  <Box
                    key={color}
                    w="32px"
                    h="32px"
                    borderRadius="full"
                    bg={color}
                    border="3px solid"
                    borderColor={activeCaptionLayer.color === color ? "brand.500" : "gray.200"}
                    cursor="pointer"
                    onClick={() => handleUpdateCaption({ color })}
                    transition="all 0.2s"
                    _hover={{ transform: "scale(1.1)" }}
                  />
                ))}
              </HStack>
            </Box>
          </>
        )}
      </VStack>
    </MotionBox>
  );
}

export default CaptionsPanel;
