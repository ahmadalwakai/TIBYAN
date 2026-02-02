"use client";

/**
 * Audio Panel - Upload/select audio, volume, trim
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
  FaMusic,
  FaPlus,
  FaTrash,
  FaVolumeUp,
  FaVolumeMute,
} from "react-icons/fa";
import { useEditorStore, selectActiveMedia } from "@/lib/editor/store";
import { formatTime, createObjectUrl } from "@/lib/editor/utils";
import type { AudioTrack } from "@/lib/editor/types";

const MotionBox = motion.create(Box);

export function AudioPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeMedia = useEditorStore(selectActiveMedia);
  const audioTracks = useEditorStore((s) => s.audioTracks);
  const originalAudioVolume = useEditorStore((s) => s.originalAudioVolume);
  const addAudioTrack = useEditorStore((s) => s.addAudioTrack);
  const removeAudioTrack = useEditorStore((s) => s.removeAudioTrack);
  const updateAudioTrack = useEditorStore((s) => s.updateAudioTrack);
  const setOriginalAudioVolume = useEditorStore((s) => s.setOriginalAudioVolume);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !file.type.startsWith("audio/")) return;

      const url = createObjectUrl(file);
      const audio = new Audio(url);
      
      audio.onloadedmetadata = () => {
        addAudioTrack({
          file,
          url,
          name: file.name,
          duration: audio.duration,
          volume: 1,
          trimStart: 0,
          trimEnd: audio.duration,
        });
      };

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [addAudioTrack]
  );

  const handleVolumeChange = useCallback(
    (trackId: string, details: { value: number[] }) => {
      updateAudioTrack(trackId, { volume: details.value[0] });
    },
    [updateAudioTrack]
  );

  const handleOriginalVolumeChange = useCallback(
    (details: { value: number[] }) => {
      setOriginalAudioVolume(details.value[0]);
    },
    [setOriginalAudioVolume]
  );

  const handleTrimChange = useCallback(
    (trackId: string, field: "trimStart" | "trimEnd", details: { value: number[] }) => {
      updateAudioTrack(trackId, { [field]: details.value[0] });
    },
    [updateAudioTrack]
  );

  if (!activeMedia || activeMedia.type !== "video") {
    return (
      <Box p={6} textAlign="center">
        <Text color="gray.500">الصوت متاح للفيديو فقط</Text>
      </Box>
    );
  }

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
            الصوت
          </Text>
          <Button
            size="sm"
            variant="outline"
            colorPalette="brand"
            onClick={() => fileInputRef.current?.click()}
            borderRadius="xl"
          >
            <FaPlus />
            <Text mr={2}>إضافة صوت</Text>
          </Button>
          <Input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            display="none"
            onChange={handleFileSelect}
          />
        </HStack>

        {/* Original Video Audio */}
        <Box
          p={4}
          bg="gray.50"
          borderRadius="xl"
          border="1px solid"
          borderColor="gray.200"
        >
          <HStack justify="space-between" mb={3}>
            <HStack gap={2}>
              <FaVolumeUp color="var(--chakra-colors-brand-500)" />
              <Text fontSize="sm" fontWeight="600" color="gray.700">
                صوت الفيديو الأصلي
              </Text>
            </HStack>
            <IconButton
              aria-label="كتم"
              variant="ghost"
              size="xs"
              onClick={() => setOriginalAudioVolume(originalAudioVolume === 0 ? 1 : 0)}
            >
              {originalAudioVolume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
            </IconButton>
          </HStack>
          
          <Slider.Root
            min={0}
            max={1}
            step={0.01}
            value={[originalAudioVolume]}
            onValueChange={handleOriginalVolumeChange}
          >
            <Slider.Control>
              <Slider.Track bg="gray.200" h="6px" borderRadius="full">
                <Slider.Range bg="brand.500" />
              </Slider.Track>
              <Slider.Thumb index={0} bg="brand.500" boxSize="16px" borderRadius="full" />
            </Slider.Control>
          </Slider.Root>
          <Text fontSize="xs" color="gray.500" textAlign="left" mt={1}>
            {Math.round(originalAudioVolume * 100)}%
          </Text>
        </Box>

        {/* Audio Tracks */}
        {audioTracks.length === 0 ? (
          <Box
            p={6}
            textAlign="center"
            bg="gray.50"
            borderRadius="xl"
            border="2px dashed"
            borderColor="gray.200"
          >
            <FaMusic size={24} color="var(--chakra-colors-gray-400)" style={{ margin: "0 auto 12px" }} />
            <Text color="gray.500" fontSize="sm">
              لم يتم إضافة مسارات صوتية
            </Text>
            <Text color="gray.400" fontSize="xs" mt={1}>
              اضغط على &quot;إضافة صوت&quot; لإضافة موسيقى أو تعليق صوتي
            </Text>
          </Box>
        ) : (
          <VStack gap={4} align="stretch">
            {audioTracks.map((track) => (
              <AudioTrackItem
                key={track.id}
                track={track}
                onVolumeChange={(details) => handleVolumeChange(track.id, details)}
                onTrimStartChange={(details) => handleTrimChange(track.id, "trimStart", details)}
                onTrimEndChange={(details) => handleTrimChange(track.id, "trimEnd", details)}
                onRemove={() => removeAudioTrack(track.id)}
              />
            ))}
          </VStack>
        )}
      </VStack>
    </MotionBox>
  );
}

// ============== Audio Track Item ==============

interface AudioTrackItemProps {
  track: AudioTrack;
  onVolumeChange: (details: { value: number[] }) => void;
  onTrimStartChange: (details: { value: number[] }) => void;
  onTrimEndChange: (details: { value: number[] }) => void;
  onRemove: () => void;
}

function AudioTrackItem({
  track,
  onVolumeChange,
  onTrimStartChange,
  onTrimEndChange,
  onRemove,
}: AudioTrackItemProps) {
  return (
    <Box
      p={4}
      bg="white"
      borderRadius="xl"
      border="1px solid"
      borderColor="gray.200"
      boxShadow="sm"
    >
      <HStack justify="space-between" mb={3}>
        <HStack gap={2}>
          <FaMusic color="var(--chakra-colors-brand-500)" />
          <Text fontSize="sm" fontWeight="600" color="gray.700" maxW="150px" truncate>
            {track.name}
          </Text>
        </HStack>
        <IconButton
          aria-label="حذف"
          variant="ghost"
          size="xs"
          colorPalette="red"
          onClick={onRemove}
        >
          <FaTrash />
        </IconButton>
      </HStack>

      {/* Volume */}
      <Box mb={4}>
        <HStack justify="space-between" mb={1}>
          <Text fontSize="xs" color="gray.500">الصوت</Text>
          <Text fontSize="xs" color="gray.600">{Math.round(track.volume * 100)}%</Text>
        </HStack>
        <Slider.Root
          min={0}
          max={1}
          step={0.01}
          value={[track.volume]}
          onValueChange={onVolumeChange}
        >
          <Slider.Control>
            <Slider.Track bg="gray.200" h="4px" borderRadius="full">
              <Slider.Range bg="brand.500" />
            </Slider.Track>
            <Slider.Thumb index={0} bg="brand.500" boxSize="14px" borderRadius="full" />
          </Slider.Control>
        </Slider.Root>
      </Box>

      {/* Trim */}
      <Box>
        <HStack justify="space-between" mb={1}>
          <Text fontSize="xs" color="gray.500">النطاق</Text>
          <Text fontSize="xs" color="gray.600">
            {formatTime(track.trimStart)} - {formatTime(track.trimEnd)}
          </Text>
        </HStack>
        <HStack gap={2}>
          <Box flex={1}>
            <Slider.Root
              min={0}
              max={track.duration}
              step={0.1}
              value={[track.trimStart]}
              onValueChange={onTrimStartChange}
            >
              <Slider.Control>
                <Slider.Track bg="gray.200" h="4px" borderRadius="full">
                  <Slider.Range bg="green.400" />
                </Slider.Track>
                <Slider.Thumb index={0} bg="green.500" boxSize="12px" borderRadius="full" />
              </Slider.Control>
            </Slider.Root>
          </Box>
          <Box flex={1}>
            <Slider.Root
              min={0}
              max={track.duration}
              step={0.1}
              value={[track.trimEnd]}
              onValueChange={onTrimEndChange}
            >
              <Slider.Control>
                <Slider.Track bg="gray.200" h="4px" borderRadius="full">
                  <Slider.Range bg="red.400" />
                </Slider.Track>
                <Slider.Thumb index={0} bg="red.500" boxSize="12px" borderRadius="full" />
              </Slider.Control>
            </Slider.Root>
          </Box>
        </HStack>
      </Box>
    </Box>
  );
}

export default AudioPanel;
