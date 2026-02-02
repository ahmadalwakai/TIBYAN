"use client";

import {
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  IconButton,
  Image,
  Input,
  NativeSelect,
  Stack,
  Text,
} from "@chakra-ui/react";
import { toaster } from "./toaster";
import { useCallback, useRef, useState } from "react";

export type MediaType = "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "PDF";

export interface MediaStyling {
  borderRadius?: string;
  objectFit?: string;
  aspectRatio?: string;
}

export interface MediaItem {
  id: string;
  type: MediaType;
  url: string;
  filename?: string;
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
  caption?: string;
  altText?: string;
  order: number;
  styling?: MediaStyling;
  file?: File;
  preview?: string;
}

interface MediaUploaderProps {
  media: MediaItem[];
  onChange: (media: MediaItem[]) => void;
  maxItems?: number;
  acceptedTypes?: string;
}

const borderRadiusOptions = [
  { value: "0", label: "حواف حادة" },
  { value: "8px", label: "مستدير قليلاً" },
  { value: "16px", label: "مستدير" },
  { value: "24px", label: "مستدير جداً" },
  { value: "9999px", label: "دائري" },
];

const objectFitOptions = [
  { value: "cover", label: "تغطية" },
  { value: "contain", label: "احتواء" },
  { value: "fill", label: "ملء" },
  { value: "none", label: "بدون" },
];

const aspectRatioOptions = [
  { value: "auto", label: "تلقائي" },
  { value: "1/1", label: "مربع 1:1" },
  { value: "4/3", label: "تقليدي 4:3" },
  { value: "16/9", label: "عريض 16:9" },
  { value: "21/9", label: "سينمائي 21:9" },
];

// File validation constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"];
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"];

function getMediaType(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  if (mimeType === "application/pdf") return "PDF";
  return "DOCUMENT";
}

function getMediaIcon(type: MediaType): string {
  switch (type) {
    case "IMAGE": return "🖼️";
    case "VIDEO": return "🎬";
    case "AUDIO": return "🎵";
    case "PDF": return "📄";
    case "DOCUMENT": return "📁";
  }
}

export default function MediaUploader({
  media,
  onChange,
  maxItems = 10,
  acceptedTypes = "image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx",
}: MediaUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const newMedia: MediaItem[] = [];

      for (let i = 0; i < files.length && media.length + newMedia.length < maxItems; i++) {
        const file = files[i];
        const type = getMediaType(file.type);
        
        // Validate file type
        const isValidType = (
          ALLOWED_IMAGE_TYPES.includes(file.type) ||
          ALLOWED_VIDEO_TYPES.includes(file.type) ||
          ALLOWED_AUDIO_TYPES.includes(file.type)
        );

        if (!isValidType) {
          toaster.error({
            title: `نوع غير مدعوم: ${file.name}`,
            description: "الأنواع المدعومة: صور (JPEG, PNG, GIF, WebP)، فيديوهات (MP4, WebM)، صوت (MP3, WAV)",
          });
          continue;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          toaster.error({
            title: `ملف كبير جداً: ${file.name}`,
            description: `الحد الأقصى 50MB`,
          });
          continue;
        }
        
        // Create preview URL for images and videos
        let preview: string | undefined;
        if (type === "IMAGE" || type === "VIDEO") {
          preview = URL.createObjectURL(file);
        }

        // Get dimensions for images and videos
        let width: number | undefined;
        let height: number | undefined;
        let duration: number | undefined;

        if (type === "IMAGE") {
          const img = document.createElement("img");
          img.src = preview || "";
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => resolve(), 5000);
            img.onload = () => {
              clearTimeout(timeout);
              width = img.naturalWidth;
              height = img.naturalHeight;
              resolve();
            };
            img.onerror = () => {
              clearTimeout(timeout);
              resolve();
            };
          });
        } else if (type === "VIDEO") {
          const video = document.createElement("video");
          video.src = preview || "";
          await new Promise<void>((resolve) => {
            const timeout = setTimeout(() => resolve(), 5000);
            video.onloadedmetadata = () => {
              clearTimeout(timeout);
              width = video.videoWidth;
              height = video.videoHeight;
              duration = video.duration;
              resolve();
            };
            video.onerror = () => {
              clearTimeout(timeout);
              resolve();
            };
          });
        }

        newMedia.push({
          id: `temp-${Date.now()}-${i}`,
          type,
          url: "", // Will be set after upload
          filename: file.name,
          mimeType: file.type,
          fileSize: file.size,
          width,
          height,
          duration,
          order: media.length + i,
          file,
          preview,
          styling: {
            borderRadius: "8px",
            objectFit: "cover",
            aspectRatio: "auto",
          },
        });
      }

      onChange([...media, ...newMedia]);
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [media, maxItems, onChange]
  );

  const handleRemove = useCallback(
    (index: number) => {
      const item = media[index];
      if (item.preview) {
        URL.revokeObjectURL(item.preview);
      }
      const newMedia = media.filter((_, i) => i !== index);
      onChange(newMedia.map((m, i) => ({ ...m, order: i })));
      setSelectedIndex(null);
    },
    [media, onChange]
  );

  const handleStylingChange = useCallback(
    (index: number, key: keyof MediaStyling, value: string) => {
      const newMedia = [...media];
      newMedia[index] = {
        ...newMedia[index],
        styling: {
          ...newMedia[index].styling,
          [key]: value,
        },
      };
      onChange(newMedia);
    },
    [media, onChange]
  );

  const handleCaptionChange = useCallback(
    (index: number, caption: string) => {
      const newMedia = [...media];
      newMedia[index] = { ...newMedia[index], caption };
      onChange(newMedia);
    },
    [media, onChange]
  );

  const handleMoveUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      const newMedia = [...media];
      [newMedia[index - 1], newMedia[index]] = [newMedia[index], newMedia[index - 1]];
      onChange(newMedia.map((m, i) => ({ ...m, order: i })));
      setSelectedIndex(index - 1);
    },
    [media, onChange]
  );

  const handleMoveDown = useCallback(
    (index: number) => {
      if (index === media.length - 1) return;
      const newMedia = [...media];
      [newMedia[index], newMedia[index + 1]] = [newMedia[index + 1], newMedia[index]];
      onChange(newMedia.map((m, i) => ({ ...m, order: i })));
      setSelectedIndex(index + 1);
    },
    [media, onChange]
  );

  const selectedItem = selectedIndex !== null ? media[selectedIndex] : null;

  return (
    <Stack gap={4}>
      {/* Upload Area */}
      <Box
        p={6}
        borderRadius="card"
        border="2px dashed"
        borderColor="border"
        bg="surface"
        textAlign="center"
        cursor="pointer"
        transition="all 0.2s"
        _hover={{ borderColor: "brand.500", bg: "brand.50" }}
        onClick={() => fileInputRef.current?.click()}
      >
        <Text fontSize="3xl" mb={2}>📎</Text>
        <Text fontWeight="600" mb={1}>
          اضغط لإضافة ملفات
        </Text>
        <Text fontSize="sm" color="muted">
          صور، فيديو، صوت، PDF، مستندات
        </Text>
        <Text fontSize="xs" color="muted" mt={2}>
          {media.length}/{maxItems} ملفات
        </Text>
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes}
          onChange={handleFileSelect}
          display="none"
        />
      </Box>

      {/* Media Grid */}
      {media.length > 0 && (
        <Grid templateColumns="repeat(auto-fill, minmax(120px, 1fr))" gap={3}>
          {media.map((item, index) => (
            <Box
              key={item.id}
              position="relative"
              aspectRatio={1}
              borderRadius="card"
              overflow="hidden"
              border={selectedIndex === index ? "2px solid" : "1px solid"}
              borderColor={selectedIndex === index ? "brand.500" : "border"}
              cursor="pointer"
              onClick={() => setSelectedIndex(index)}
            >
              {item.type === "IMAGE" && (
                <Image
                  src={item.preview || item.url}
                  alt={item.altText || item.filename}
                  w="100%"
                  h="100%"
                  objectFit="cover"
                />
              )}
              {item.type === "VIDEO" && (
                <video
                  src={item.preview || item.url}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              )}
              {(item.type === "AUDIO" || item.type === "PDF" || item.type === "DOCUMENT") && (
                <Flex
                  w="100%"
                  h="100%"
                  bg="surface"
                  align="center"
                  justify="center"
                  direction="column"
                >
                  <Text fontSize="2xl">{getMediaIcon(item.type)}</Text>
                  <Text fontSize="xs" color="muted" mt={1} px={2} textAlign="center" lineClamp={2}>
                    {item.filename}
                  </Text>
                </Flex>
              )}
              
              {/* Remove button */}
              <IconButton
                aria-label="إزالة"
                size="xs"
                position="absolute"
                top={1}
                left={1}
                borderRadius="full"
                colorScheme="red"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(index);
                }}
              >
                ✕
              </IconButton>

              {/* Order badge */}
              <Box
                position="absolute"
                bottom={1}
                right={1}
                bg="blackAlpha.700"
                color="white"
                px={2}
                py={0.5}
                borderRadius="full"
                fontSize="xs"
              >
                {index + 1}
              </Box>
            </Box>
          ))}
        </Grid>
      )}

      {/* Selected Item Options */}
      {selectedItem && selectedIndex !== null && (
        <Box
          p={4}
          borderRadius="card"
          border="1px solid"
          borderColor="border"
          bg="surface"
        >
          <Text fontWeight="600" mb={3}>
            تنسيق: {selectedItem.filename}
          </Text>
          
          <Stack gap={3}>
            {/* Reorder */}
            <HStack>
              <Text fontSize="sm" minW="80px">الترتيب:</Text>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMoveUp(selectedIndex)}
                disabled={selectedIndex === 0}
              >
                ⬆️ لأعلى
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleMoveDown(selectedIndex)}
                disabled={selectedIndex === media.length - 1}
              >
                ⬇️ لأسفل
              </Button>
            </HStack>

            {/* Caption */}
            <HStack align="start">
              <Text fontSize="sm" minW="80px" pt={2}>الوصف:</Text>
              <Input
                size="sm"
                value={selectedItem.caption || ""}
                onChange={(e) => handleCaptionChange(selectedIndex, e.target.value)}
                placeholder="أضف وصفاً للملف..."
              />
            </HStack>

            {/* Styling for images/videos */}
            {(selectedItem.type === "IMAGE" || selectedItem.type === "VIDEO") && (
              <>
                <HStack>
                  <Text fontSize="sm" minW="80px">الحواف:</Text>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      flex={1}
                      value={selectedItem.styling?.borderRadius || "8px"}
                      onChange={(e) => handleStylingChange(selectedIndex, "borderRadius", e.target.value)}
                    >
                      {borderRadiusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </HStack>

                <HStack>
                  <Text fontSize="sm" minW="80px">الملاءمة:</Text>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      flex={1}
                      value={selectedItem.styling?.objectFit || "cover"}
                      onChange={(e) => handleStylingChange(selectedIndex, "objectFit", e.target.value)}
                    >
                      {objectFitOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </HStack>

                <HStack>
                  <Text fontSize="sm" minW="80px">النسبة:</Text>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      flex={1}
                      value={selectedItem.styling?.aspectRatio || "auto"}
                      onChange={(e) => handleStylingChange(selectedIndex, "aspectRatio", e.target.value)}
                    >
                      {aspectRatioOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </HStack>

                {/* Preview with styling */}
                <Box>
                  <Text fontSize="sm" mb={2}>معاينة:</Text>
                  <Box
                    maxW="200px"
                    overflow="hidden"
                    borderRadius={selectedItem.styling?.borderRadius || "8px"}
                    style={{
                      aspectRatio: selectedItem.styling?.aspectRatio === "auto" 
                        ? undefined 
                        : selectedItem.styling?.aspectRatio,
                    }}
                  >
                    {selectedItem.type === "IMAGE" ? (
                      <Image
                        src={selectedItem.preview || selectedItem.url}
                        alt=""
                        w="100%"
                        h="100%"
                        objectFit={selectedItem.styling?.objectFit as "cover" | "contain" | "fill" | "none" || "cover"}
                      />
                    ) : (
                      <video
                        src={selectedItem.preview || selectedItem.url}
                        controls
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: (selectedItem.styling?.objectFit || "cover") as React.CSSProperties["objectFit"],
                        }}
                      />
                    )}
                  </Box>
                </Box>
              </>
            )}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
