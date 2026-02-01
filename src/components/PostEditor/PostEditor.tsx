"use client";

/**
 * PostEditor - Main editor component
 * Assembles PreviewStage, BottomToolbar, Panels, and LayerList
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  IconButton,
  Drawer,
  Portal,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useRef, useState, useCallback, useEffect } from "react";
import { useEditorStore, selectActiveMedia, selectCssFilters } from "@/lib/editor/store";
import { PreviewStage } from "./PreviewStage";
import { BottomToolbar, type ToolId } from "./BottomToolbar";
import { LayerList } from "./LayerList";
import { LayerTransformHandles } from "./LayerTransformHandles";
import {
  EditPanel,
  AudioPanel,
  TextPanel,
  EffectsPanel,
  OverlayPanel,
  CaptionsPanel,
  FiltersPanel,
  BackgroundPanel,
  AspectRatioPanel,
  MediaPanel,
  StickersPanel,
  AdjustPanel,
  ShapePanel,
  AiAvatarPanel,
} from "./panels";
import type { MediaAsset } from "@/lib/editor/types";

const MotionBox = motion.create(Box);

interface PostEditorProps {
  onExport?: (blob: Blob, type: "image" | "video") => void;
  onCancel?: () => void;
  initialMedia?: MediaAsset[];
}

export function PostEditor({ onExport, onCancel, initialMedia }: PostEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);
  const [showLayerList, setShowLayerList] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Store selectors
  const activeMedia = useEditorStore(selectActiveMedia);
  const mediaAssets = useEditorStore((s) => s.mediaAssets);
  const addMediaAsset = useEditorStore((s) => s.addMediaAsset);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const historyIndex = useEditorStore((s) => s.historyIndex);
  const historyLength = useEditorStore((s) => s.history.length);
  const loadDraft = useEditorStore((s) => s.loadDraft);
  const reset = useEditorStore((s) => s.reset);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyLength - 1;

  // Load initial media or draft
  useEffect(() => {
    if (initialMedia && initialMedia.length > 0) {
      initialMedia.forEach((asset) => addMediaAsset(asset));
    } else {
      loadDraft();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle tool selection
  const handleToolSelect = useCallback((toolId: ToolId) => {
    setActiveTool((prev: ToolId | null) => (prev === toolId ? null : toolId));
  }, []);

  // Close panel
  const handleClosePanel = useCallback(() => {
    setActiveTool(null);
  }, []);

  // Handle export
  const handleExport = useCallback(async () => {
    if (!activeMedia) return;

    setIsExporting(true);

    try {
      // Dynamic import of export functions
      const { exportImage, exportVideoSimple } = await import("@/lib/editor/ffmpegExport");
      const state = useEditorStore.getState();

      if (activeMedia.type === "image") {
        const blob = await exportImage(state, activeMedia);
        onExport?.(blob, "image");
      } else {
        const blob = await exportVideoSimple(state);
        onExport?.(blob, "video");
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("فشل التصدير. حاول مرة أخرى.");
    } finally {
      setIsExporting(false);
    }
  }, [activeMedia, onExport]);

  // Handle file drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      files.forEach((file) => {
        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
          const img = new Image();
          const url = URL.createObjectURL(file);
          
          if (file.type.startsWith("image/")) {
            img.onload = () => {
              const asset: Omit<MediaAsset, "id"> = {
                type: "image",
                url,
                name: file.name,
                width: img.width,
                height: img.height,
                file,
              };
              addMediaAsset(asset);
            };
            img.src = url;
          } else {
            // For video, get dimensions from video element
            const video = document.createElement("video");
            video.onloadedmetadata = () => {
              const asset: Omit<MediaAsset, "id"> = {
                type: "video",
                url,
                name: file.name,
                width: video.videoWidth,
                height: video.videoHeight,
                duration: video.duration,
                file,
              };
              addMediaAsset(asset);
            };
            video.src = url;
          }
        }
      });
    },
    [addMediaAsset]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // File input handler
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      files.forEach((file) => {
        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
          const url = URL.createObjectURL(file);
          
          if (file.type.startsWith("image/")) {
            const img = new Image();
            img.onload = () => {
              const asset: Omit<MediaAsset, "id"> = {
                type: "image",
                url,
                name: file.name,
                width: img.width,
                height: img.height,
                file,
              };
              addMediaAsset(asset);
            };
            img.src = url;
          } else {
            const video = document.createElement("video");
            video.onloadedmetadata = () => {
              const asset: Omit<MediaAsset, "id"> = {
                type: "video",
                url,
                name: file.name,
                width: video.videoWidth,
                height: video.videoHeight,
                duration: video.duration,
                file,
              };
              addMediaAsset(asset);
            };
            video.src = url;
          }
        }
      });
    },
    [addMediaAsset]
  );

  // Render panel based on active tool
  const renderPanel = () => {
    switch (activeTool) {
      case "edit":
        return <EditPanel />;
      case "audio":
        return <AudioPanel />;
      case "text":
        return <TextPanel />;
      case "effects":
        return <EffectsPanel />;
      case "overlay":
        return <OverlayPanel />;
      case "captions":
        return <CaptionsPanel />;
      case "filters":
        return <FiltersPanel />;
      case "background":
        return <BackgroundPanel />;
      case "aspect-ratio":
        return <AspectRatioPanel />;
      case "media":
        return <MediaPanel />;
      case "stickers":
        return <StickersPanel />;
      case "adjust":
        return <AdjustPanel />;
      case "shape":
        return <ShapePanel />;
      case "ai-avatar":
        return <AiAvatarPanel />;
      default:
        return null;
    }
  };

  return (
    <Box
      ref={containerRef}
      position="relative"
      width="100%"
      height="100vh"
      bg="gray.900"
      display="flex"
      flexDirection="column"
      overflow="hidden"
      dir="rtl"
    >
      {/* Top Bar */}
      <HStack
        px={4}
        py={3}
        bg="gray.800"
        justify="space-between"
        borderBottom="1px solid"
        borderColor="gray.700"
        flexShrink={0}
      >
        {/* Cancel / Back */}
        <Button
          variant="ghost"
          color="white"
          size="sm"
          onClick={onCancel}
          _hover={{ bg: "gray.700" }}
        >
          إلغاء
        </Button>

        {/* Title */}
        <Text color="white" fontWeight="700" fontSize="lg">
          محرر المنشور
        </Text>

        {/* Actions */}
        <HStack gap={2}>
          {/* Undo/Redo */}
          <IconButton
            aria-label="تراجع"
            variant="ghost"
            color="white"
            size="sm"
            disabled={!canUndo}
            onClick={undo}
            _hover={{ bg: "gray.700" }}
          >
            ↶
          </IconButton>
          <IconButton
            aria-label="إعادة"
            variant="ghost"
            color="white"
            size="sm"
            disabled={!canRedo}
            onClick={redo}
            _hover={{ bg: "gray.700" }}
          >
            ↷
          </IconButton>

          {/* Layer List Toggle */}
          <IconButton
            aria-label="الطبقات"
            variant="ghost"
            color="white"
            size="sm"
            onClick={() => setShowLayerList(!showLayerList)}
            _hover={{ bg: "gray.700" }}
          >
            ☰
          </IconButton>

          {/* Export */}
          <Button
            colorScheme="brand"
            size="sm"
            borderRadius="full"
            fontWeight="700"
            onClick={handleExport}
            disabled={!activeMedia || isExporting}
            loading={isExporting}
            loadingText="تصدير..."
          >
            تصدير
          </Button>
        </HStack>
      </HStack>

      {/* Main Content */}
      <Box flex="1" position="relative" overflow="hidden">
        {/* Preview Stage */}
        <Box
          position="absolute"
          inset={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          {mediaAssets.length === 0 ? (
            <EmptyState onFileInput={handleFileInput} />
          ) : (
            <>
              <PreviewStage />
              <LayerTransformHandles containerRef={containerRef} />
            </>
          )}
        </Box>

        {/* Layer List Sidebar */}
        <AnimatePresence>
          {showLayerList && (
            <MotionBox
              position="absolute"
              top={0}
              left={0}
              width="280px"
              height="100%"
              bg="white"
              borderRight="1px solid"
              borderColor="gray.200"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              zIndex={20}
              overflowY="auto"
            >
              <HStack justify="space-between" p={3} borderBottom="1px solid" borderColor="gray.200">
                <Text fontWeight="700">الطبقات</Text>
                <IconButton
                  aria-label="إغلاق"
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowLayerList(false)}
                >
                  ✕
                </IconButton>
              </HStack>
              <LayerList />
            </MotionBox>
          )}
        </AnimatePresence>
      </Box>

      {/* Bottom Toolbar */}
      <Box flexShrink={0}>
        <BottomToolbar onToolSelect={handleToolSelect} activeTool={activeTool} />
      </Box>

      {/* Bottom Sheet Panel */}
      <AnimatePresence>
        {activeTool && (
          <MotionBox
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            bg="white"
            borderTopRadius="2xl"
            boxShadow="0 -4px 20px rgba(0,0,0,0.15)"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            maxH="60vh"
            overflowY="auto"
            zIndex={30}
          >
            {/* Handle */}
            <Box
              position="sticky"
              top={0}
              bg="white"
              pt={2}
              pb={1}
              borderTopRadius="2xl"
              zIndex={1}
            >
              <Box
                w="40px"
                h="4px"
                bg="gray.300"
                borderRadius="full"
                mx="auto"
                cursor="pointer"
                onClick={handleClosePanel}
              />
            </Box>

            {/* Panel Content */}
            <Box pb={4}>{renderPanel()}</Box>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}

// ============== Empty State ==============

interface EmptyStateProps {
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function EmptyState({ onFileInput }: EmptyStateProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <VStack gap={6} p={8}>
      <Box
        w="200px"
        h="200px"
        borderRadius="2xl"
        border="3px dashed"
        borderColor="gray.600"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.800"
      >
        <VStack gap={3}>
          <Text fontSize="4xl">📸</Text>
          <Text color="gray.400" fontSize="sm" textAlign="center">
            اسحب وأفلت
            <br />
            الصور أو الفيديوهات
          </Text>
        </VStack>
      </Box>

      <Text color="gray.500" fontSize="sm">
        أو
      </Text>

      <Button
        colorScheme="brand"
        size="lg"
        borderRadius="full"
        fontWeight="700"
        onClick={() => fileInputRef.current?.click()}
      >
        اختر من الجهاز
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={onFileInput}
        style={{ display: "none" }}
      />

      <Text color="gray.600" fontSize="xs" textAlign="center" maxW="300px">
        يدعم المحرر صور PNG، JPG، WEBP وفيديوهات MP4، MOV، WEBM
      </Text>
    </VStack>
  );
}

export default PostEditor;
