"use client";

/**
 * Edit Panel - Video trimming, rotation, speed, crop
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Slider,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  FaSyncAlt,
  FaArrowsAltH,
  FaArrowsAltV,
} from "react-icons/fa";
import { useEditorStore, selectActiveMedia, selectIsVideoMode } from "@/lib/editor/store";
import { formatTime } from "@/lib/editor/utils";

const MotionBox = motion.create(Box);

export function EditPanel() {
  const activeMedia = useEditorStore(selectActiveMedia);
  const isVideoMode = useEditorStore(selectIsVideoMode);
  const videoSettings = useEditorStore((s) => s.videoSettings);
  const setVideoSettings = useEditorStore((s) => s.setVideoSettings);
  const updateMediaAsset = useEditorStore((s) => s.updateMediaAsset);

  if (!activeMedia) {
    return (
      <Box p={6} textAlign="center">
        <Text color="gray.500">اختر وسائط أولاً</Text>
      </Box>
    );
  }

  const handleTrimStart = (details: { value: number[] }) => {
    if (activeMedia) {
      updateMediaAsset(activeMedia.id, { trimStart: details.value[0] });
    }
  };

  const handleTrimEnd = (details: { value: number[] }) => {
    if (activeMedia) {
      updateMediaAsset(activeMedia.id, { trimEnd: details.value[0] });
    }
  };

  const handleSpeedChange = (details: { value: number[] }) => {
    setVideoSettings({ speed: details.value[0] });
  };

  const handleRotate = () => {
    const newRotation = ((videoSettings.rotation || 0) + 90) % 360;
    setVideoSettings({ rotation: newRotation });
  };

  const handleFlipH = () => {
    setVideoSettings({ flipHorizontal: !videoSettings.flipHorizontal });
  };

  const handleFlipV = () => {
    setVideoSettings({ flipVertical: !videoSettings.flipVertical });
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
          تحرير
        </Text>

        {/* Trim Section - Video Only */}
        {isVideoMode && activeMedia.duration && (
          <Box>
            <Text fontSize="sm" fontWeight="600" mb={3} color="gray.700">
              قص الفيديو
            </Text>
            
            <VStack gap={4}>
              <Box w="100%">
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="xs" color="gray.500">البداية</Text>
                  <Text fontSize="xs" color="gray.600">
                    {formatTime(activeMedia.trimStart || 0)}
                  </Text>
                </HStack>
                <Slider.Root
                  min={0}
                  max={activeMedia.duration}
                  step={0.1}
                  value={[activeMedia.trimStart || 0]}
                  onValueChange={handleTrimStart}
                >
                  <Slider.Control>
                    <Slider.Track bg="gray.200" h="6px" borderRadius="full">
                      <Slider.Range bg="brand.500" />
                    </Slider.Track>
                    <Slider.Thumb index={0} bg="brand.500" boxSize="18px" borderRadius="full" />
                  </Slider.Control>
                </Slider.Root>
              </Box>

              <Box w="100%">
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="xs" color="gray.500">النهاية</Text>
                  <Text fontSize="xs" color="gray.600">
                    {formatTime(activeMedia.trimEnd || activeMedia.duration)}
                  </Text>
                </HStack>
                <Slider.Root
                  min={0}
                  max={activeMedia.duration}
                  step={0.1}
                  value={[activeMedia.trimEnd || activeMedia.duration]}
                  onValueChange={handleTrimEnd}
                >
                  <Slider.Control>
                    <Slider.Track bg="gray.200" h="6px" borderRadius="full">
                      <Slider.Range bg="brand.500" />
                    </Slider.Track>
                    <Slider.Thumb index={0} bg="brand.500" boxSize="18px" borderRadius="full" />
                  </Slider.Control>
                </Slider.Root>
              </Box>
            </VStack>
          </Box>
        )}

        {/* Speed Section - Video Only */}
        {isVideoMode && (
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" fontWeight="600" color="gray.700">
                السرعة
              </Text>
              <Text fontSize="sm" color="brand.600" fontWeight="600">
                {videoSettings.speed}x
              </Text>
            </HStack>
            <Slider.Root
              min={0.25}
              max={4}
              step={0.25}
              value={[videoSettings.speed]}
              onValueChange={handleSpeedChange}
            >
              <Slider.Control>
                <Slider.Track bg="gray.200" h="6px" borderRadius="full">
                  <Slider.Range bg="brand.500" />
                </Slider.Track>
                <Slider.Thumb index={0} bg="brand.500" boxSize="18px" borderRadius="full" />
              </Slider.Control>
            </Slider.Root>
            <HStack justify="space-between" mt={1}>
              <Text fontSize="xs" color="gray.400">0.25x</Text>
              <Text fontSize="xs" color="gray.400">4x</Text>
            </HStack>
          </Box>
        )}

        {/* Transform Controls */}
        <Box>
          <Text fontSize="sm" fontWeight="600" mb={3} color="gray.700">
            التحويل
          </Text>
          <HStack gap={2} justify="center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRotate}
              borderRadius="xl"
              gap={2}
            >
              <FaSyncAlt />
              <Text>تدوير</Text>
            </Button>
            
            <IconButton
              aria-label="قلب أفقي"
              variant={videoSettings.flipHorizontal ? "solid" : "outline"}
              colorPalette={videoSettings.flipHorizontal ? "brand" : "gray"}
              size="sm"
              onClick={handleFlipH}
              borderRadius="xl"
            >
              <FaArrowsAltH />
            </IconButton>

            <IconButton
              aria-label="قلب رأسي"
              variant={videoSettings.flipVertical ? "solid" : "outline"}
              colorPalette={videoSettings.flipVertical ? "brand" : "gray"}
              size="sm"
              onClick={handleFlipV}
              borderRadius="xl"
            >
              <FaArrowsAltV />
            </IconButton>
          </HStack>
        </Box>

        {/* Rotation Display */}
        <Box textAlign="center">
          <Text fontSize="xs" color="gray.500">
            الدوران: {videoSettings.rotation}°
          </Text>
        </Box>
      </VStack>
    </MotionBox>
  );
}

export default EditPanel;
