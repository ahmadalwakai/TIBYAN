"use client";

/**
 * Media Panel - Manage imported media assets
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Input,
  SimpleGrid,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useRef, useCallback } from "react";
import {
  FaPlus,
  FaTrash,
  FaImage,
  FaVideo,
  FaArrowUp,
  FaArrowDown,
  FaCheck,
} from "react-icons/fa";
import { useEditorStore, selectActiveMedia } from "@/lib/editor/store";
import { createObjectUrl, getImageDimensions, getVideoDimensions, formatFileSize, formatTime } from "@/lib/editor/utils";

const MotionBox = motion.create(Box);

export function MediaPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaAssets = useEditorStore((s) => s.mediaAssets);
  const activeMedia = useEditorStore(selectActiveMedia);
  const addMediaAsset = useEditorStore((s) => s.addMediaAsset);
  const removeMediaAsset = useEditorStore((s) => s.removeMediaAsset);
  const setActiveMedia = useEditorStore((s) => s.setActiveMedia);
  const reorderMediaAssets = useEditorStore((s) => s.reorderMediaAssets);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      for (const file of Array.from(files)) {
        const isImage = file.type.startsWith("image/");
        const isVideo = file.type.startsWith("video/");

        if (!isImage && !isVideo) continue;

        const url = createObjectUrl(file);

        if (isImage) {
          const dimensions = await getImageDimensions(url);
          addMediaAsset({
            type: "image",
            file,
            url,
            name: file.name,
            width: dimensions.width,
            height: dimensions.height,
          });
        } else {
          const dimensions = await getVideoDimensions(url);
          addMediaAsset({
            type: "video",
            file,
            url,
            name: file.name,
            width: dimensions.width,
            height: dimensions.height,
            duration: dimensions.duration,
            trimStart: 0,
            trimEnd: dimensions.duration,
          });
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [addMediaAsset]
  );

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderMediaAssets(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < mediaAssets.length - 1) {
      reorderMediaAssets(index, index + 1);
    }
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
            الوسائط
          </Text>
          <Button
            size="sm"
            variant="solid"
            colorPalette="brand"
            onClick={() => fileInputRef.current?.click()}
            borderRadius="xl"
          >
            <FaPlus />
            <Text mr={2}>إضافة</Text>
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            display="none"
            onChange={handleFileSelect}
          />
        </HStack>

        {/* Media Assets Grid */}
        {mediaAssets.length > 0 ? (
          <VStack gap={3} align="stretch">
            {mediaAssets.map((asset, index) => (
              <Box
                key={asset.id}
                p={3}
                bg={activeMedia?.id === asset.id ? "brand.50" : "gray.50"}
                borderRadius="xl"
                border="2px solid"
                borderColor={activeMedia?.id === asset.id ? "brand.500" : "transparent"}
                cursor="pointer"
                onClick={() => setActiveMedia(asset.id)}
                transition="all 0.2s"
                _hover={{ bg: "gray.100" }}
              >
                <HStack gap={3}>
                  {/* Thumbnail */}
                  <Box
                    w="60px"
                    h="60px"
                    borderRadius="lg"
                    overflow="hidden"
                    bg="gray.200"
                    flexShrink={0}
                    position="relative"
                  >
                    {asset.type === "image" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.url}
                        alt={asset.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <>
                        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                        <video
                          src={asset.url}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                          muted
                        />
                        <Box
                          position="absolute"
                          bottom={1}
                          right={1}
                          bg="blackAlpha.700"
                          px={1}
                          borderRadius="sm"
                        >
                          <Text fontSize="xs" color="white">
                            {formatTime(asset.duration || 0)}
                          </Text>
                        </Box>
                      </>
                    )}
                    
                    {/* Active indicator */}
                    {activeMedia?.id === asset.id && (
                      <Box
                        position="absolute"
                        top={1}
                        right={1}
                        bg="brand.500"
                        borderRadius="full"
                        p={1}
                      >
                        <FaCheck size={10} color="white" />
                      </Box>
                    )}
                  </Box>

                  {/* Info */}
                  <Box flex={1} minW={0}>
                    <HStack gap={2} mb={1}>
                      {asset.type === "image" ? (
                        <FaImage size={12} color="var(--chakra-colors-brand-500)" />
                      ) : (
                        <FaVideo size={12} color="var(--chakra-colors-brand-500)" />
                      )}
                      <Text fontSize="sm" fontWeight="600" color="gray.700" truncate>
                        {asset.name}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.500">
                      {asset.width} × {asset.height}
                      {asset.type === "video" && ` • ${formatTime(asset.duration || 0)}`}
                    </Text>
                  </Box>

                  {/* Actions */}
                  <VStack gap={1}>
                    <HStack gap={1}>
                      <IconButton
                        aria-label="تحريك لأعلى"
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveUp(index);
                        }}
                        disabled={index === 0}
                      >
                        <FaArrowUp />
                      </IconButton>
                      <IconButton
                        aria-label="تحريك لأسفل"
                        variant="ghost"
                        size="xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveDown(index);
                        }}
                        disabled={index === mediaAssets.length - 1}
                      >
                        <FaArrowDown />
                      </IconButton>
                    </HStack>
                    <IconButton
                      aria-label="حذف"
                      variant="ghost"
                      size="xs"
                      colorPalette="red"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeMediaAsset(asset.id);
                      }}
                    >
                      <FaTrash />
                    </IconButton>
                  </VStack>
                </HStack>
              </Box>
            ))}
          </VStack>
        ) : (
          <Box
            p={8}
            textAlign="center"
            bg="gray.50"
            borderRadius="xl"
            border="2px dashed"
            borderColor="gray.200"
            cursor="pointer"
            onClick={() => fileInputRef.current?.click()}
            _hover={{ borderColor: "brand.300", bg: "brand.50" }}
            transition="all 0.2s"
          >
            <Box mb={3}>
              <FaImage size={32} color="var(--chakra-colors-gray-400)" style={{ margin: "0 auto" }} />
            </Box>
            <Text color="gray.500" fontSize="sm" fontWeight="600">
              اسحب وأفلت أو اضغط للإضافة
            </Text>
            <Text color="gray.400" fontSize="xs" mt={1}>
              صور أو فيديو
            </Text>
          </Box>
        )}

        {/* Summary */}
        {mediaAssets.length > 0 && (
          <Box p={3} bg="gray.50" borderRadius="xl">
            <HStack justify="space-between">
              <Text fontSize="sm" color="gray.600">
                إجمالي الوسائط: <Text as="span" fontWeight="600">{mediaAssets.length}</Text>
              </Text>
              <Text fontSize="sm" color="gray.600">
                صور: {mediaAssets.filter((a) => a.type === "image").length} |
                فيديو: {mediaAssets.filter((a) => a.type === "video").length}
              </Text>
            </HStack>
          </Box>
        )}
      </VStack>
    </MotionBox>
  );
}

export default MediaPanel;
