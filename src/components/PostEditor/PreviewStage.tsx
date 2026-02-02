"use client";

/**
 * Preview Stage Component
 * Renders the canvas/video preview with layers
 */

import {
  Box,
  Flex,
  IconButton,
  Slider,
  Text,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaPlay,
  FaPause,
  FaExpand,
  FaCompress,
  FaVolumeUp,
  FaVolumeMute,
} from "react-icons/fa";
import { useEditorStore, selectActiveMedia, selectIsVideoMode, selectCssFilters } from "@/lib/editor/store";
import { getFabricEngine } from "@/lib/editor/fabricEngine";
import { formatTime, FILTER_PRESETS } from "@/lib/editor/utils";

const MotionBox = motion.create(Box);

export function PreviewStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);

  // Store selectors
  const activeMedia = useEditorStore(selectActiveMedia);
  const isVideoMode = useEditorStore(selectIsVideoMode);
  const cssFilters = useEditorStore(selectCssFilters);
  const currentTime = useEditorStore((s) => s.currentTime);
  const isPlaying = useEditorStore((s) => s.isPlaying);
  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const background = useEditorStore((s) => s.background);
  const activeFilter = useEditorStore((s) => s.activeFilter);
  const filterIntensity = useEditorStore((s) => s.filterIntensity);
  const shapeMask = useEditorStore((s) => s.shapeMask);
  const layers = useEditorStore((s) => s.layers);
  const adjustments = useEditorStore((s) => s.adjustments);

  // Actions
  const setCurrentTime = useEditorStore((s) => s.setCurrentTime);
  const setIsPlaying = useEditorStore((s) => s.setIsPlaying);
  const setActiveLayer = useEditorStore((s) => s.setActiveLayer);
  const updateLayer = useEditorStore((s) => s.updateLayer);

  // Initialize canvas for image mode
  useEffect(() => {
    if (!canvasRef.current || isVideoMode) return;

    const engine = getFabricEngine();
    engine.initialize(canvasRef.current, {
      width: canvasWidth,
      height: canvasHeight,
      backgroundColor: background.color,
    });

    // Set callbacks
    engine.setSelectionCallback(setActiveLayer);
    engine.setLayerUpdateCallback(updateLayer);

    return () => {
      // Don't dispose here, let the main component handle it
    };
  }, [canvasWidth, canvasHeight, isVideoMode, background.color, setActiveLayer, updateLayer]);

  // Load background image
  useEffect(() => {
    if (!activeMedia || isVideoMode) return;

    const engine = getFabricEngine();
    engine.setBackgroundImage(activeMedia.url);
  }, [activeMedia, isVideoMode]);

  // Apply shape mask
  useEffect(() => {
    if (isVideoMode) return;
    const engine = getFabricEngine();
    engine.setShapeMask(shapeMask);
  }, [shapeMask, isVideoMode]);

  // Apply adjustments
  useEffect(() => {
    if (isVideoMode) return;
    const engine = getFabricEngine();
    engine.applyAdjustments(adjustments);
  }, [adjustments, isVideoMode]);

  // Apply filter
  useEffect(() => {
    if (isVideoMode) return;
    const filterPreset = FILTER_PRESETS.find((f) => f.id === activeFilter);
    const engine = getFabricEngine();
    engine.applyCssFilter(filterPreset?.cssFilter || "", filterIntensity);
  }, [activeFilter, filterIntensity, isVideoMode]);

  // Sync layers to canvas
  useEffect(() => {
    if (isVideoMode) return;
    const engine = getFabricEngine();

    // For simplicity, we'll re-add layers when they change
    // A more optimal approach would track individual changes
    layers.forEach((layer) => {
      switch (layer.type) {
        case "text":
          engine.addTextLayer(layer);
          break;
        case "sticker":
          engine.addStickerLayer(layer);
          break;
        case "overlay":
          engine.addOverlayLayer(layer);
          break;
        case "caption":
          engine.addCaptionLayer(layer);
          break;
      }
    });
  }, [layers, isVideoMode]);

  // Video playback handling
  useEffect(() => {
    if (!videoRef.current || !isVideoMode) return;

    if (isPlaying) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  }, [isPlaying, isVideoMode]);

  useEffect(() => {
    if (!videoRef.current || !isVideoMode) return;
    videoRef.current.currentTime = currentTime;
  }, [currentTime, isVideoMode]);

  // Video event handlers
  const handleVideoTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, [setCurrentTime]);

  const handleVideoLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    setIsPlaying(false);
  }, [setIsPlaying]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const handleSeek = useCallback(
    (details: { value: number[] }) => {
      const time = details.value[0];
      setCurrentTime(time);
      if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
    [setCurrentTime]
  );

  // Get CSS filters for video
  const getVideoFilters = (): string => {
    const filters: string[] = [];

    // Base adjustments
    if (adjustments.brightness !== 0) {
      filters.push(`brightness(${1 + adjustments.brightness / 100})`);
    }
    if (adjustments.contrast !== 0) {
      filters.push(`contrast(${1 + adjustments.contrast / 100})`);
    }
    if (adjustments.saturation !== 0) {
      filters.push(`saturate(${1 + adjustments.saturation / 100})`);
    }
    if (adjustments.temperature > 0) {
      filters.push(`sepia(${adjustments.temperature / 200})`);
    } else if (adjustments.temperature < 0) {
      filters.push(`hue-rotate(${adjustments.temperature}deg)`);
    }

    // Preset filter
    if (activeFilter) {
      const filterPreset = FILTER_PRESETS.find((f) => f.id === activeFilter);
      if (filterPreset?.cssFilter) {
        // Apply with intensity
        const _intensity = filterIntensity / 100;
        filters.push(filterPreset.cssFilter);
      }
    }

    return filters.join(" ");
  };

  // Get shape mask clip-path for video
  const getClipPath = (): string => {
    switch (shapeMask.type) {
      case "circle":
        return "circle(45% at center)";
      case "rounded-rectangle":
        return `inset(5% round ${shapeMask.borderRadius || 20}px)`;
      case "rectangle":
        return "inset(5%)";
      case "pill":
        return "inset(30% 5% round 9999px)";
      default:
        return "none";
    }
  };

  // Get background style
  const getBackgroundStyle = (): React.CSSProperties => {
    switch (background.type) {
      case "solid":
        return { backgroundColor: background.color };
      case "gradient":
        if (background.gradient) {
          const colors = background.gradient.colors.join(", ");
          if (background.gradient.type === "radial") {
            return { background: `radial-gradient(circle, ${colors})` };
          }
          return {
            background: `linear-gradient(${background.gradient.angle || 0}deg, ${colors})`,
          };
        }
        return {};
      case "blur":
        return { backdropFilter: `blur(${background.blurAmount || 20}px)` };
      default:
        return { backgroundColor: "#000000" };
    }
  };

  return (
    <Box
      ref={containerRef}
      position="relative"
      w="100%"
      h="100%"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      style={getBackgroundStyle()}
    >
      {/* Canvas/Video Container */}
      <MotionBox
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        position="relative"
        maxW="100%"
        maxH="100%"
        aspectRatio={`${canvasWidth}/${canvasHeight}`}
      >
        {isVideoMode && activeMedia ? (
          <>
            {/* Video Element */}
            { }
            <video
              ref={videoRef}
              src={activeMedia.url}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: getVideoFilters(),
                clipPath: getClipPath(),
              }}
              onTimeUpdate={handleVideoTimeUpdate}
              onLoadedMetadata={handleVideoLoadedMetadata}
              onEnded={handleVideoEnded}
              playsInline
              muted={isMuted}
            />

            {/* Video Overlay Layers */}
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              pointerEvents="none"
            >
              {layers.map((layer) => {
                // Only show captions in their time range
                if (layer.type === "caption") {
                  const caption = layer;
                  if (
                    currentTime < caption.startTime ||
                    currentTime > caption.endTime
                  ) {
                    return null;
                  }
                }

                if (!layer.visible) return null;

                return (
                  <Box
                    key={layer.id}
                    position="absolute"
                    left={`${(layer.x / canvasWidth) * 100}%`}
                    top={`${(layer.y / canvasHeight) * 100}%`}
                    transform={`rotate(${layer.rotation}deg)`}
                    opacity={layer.opacity}
                    pointerEvents="auto"
                    cursor="move"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveLayer(layer.id);
                    }}
                  >
                    {layer.type === "text" && (
                      <Text
                        fontFamily={layer.fontFamily}
                        fontSize={`${layer.fontSize}px`}
                        fontWeight={layer.fontWeight}
                        fontStyle={layer.fontStyle}
                        color={layer.color}
                        bg={layer.backgroundColor}
                        px={layer.backgroundPadding ? `${layer.backgroundPadding}px` : undefined}
                        py={layer.backgroundPadding ? `${layer.backgroundPadding / 2}px` : undefined}
                        borderRadius={layer.borderRadius ? `${layer.borderRadius}px` : undefined}
                        textAlign={layer.textAlign}
                        whiteSpace="pre-wrap"
                      >
                        {layer.text}
                      </Text>
                    )}
                    {layer.type === "caption" && (
                      <Text
                        fontFamily={layer.fontFamily}
                        fontSize={`${layer.fontSize}px`}
                        fontWeight={layer.fontWeight}
                        color={layer.color}
                        bg={layer.backgroundColor}
                        px={layer.backgroundPadding ? `${layer.backgroundPadding}px` : undefined}
                        py={layer.backgroundPadding ? `${layer.backgroundPadding / 2}px` : undefined}
                        borderRadius="8px"
                        textAlign="center"
                      >
                        {layer.text}
                      </Text>
                    )}
                    {layer.type === "sticker" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={layer.stickerUrl}
                        alt="sticker"
                        style={{
                          width: `${layer.width}px`,
                          height: `${layer.height}px`,
                          objectFit: "contain",
                        }}
                        draggable={false}
                      />
                    )}
                    {layer.type === "overlay" && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={layer.imageUrl}
                        alt="overlay"
                        style={{
                          width: `${layer.width}px`,
                          height: `${layer.height}px`,
                          objectFit: "contain",
                          mixBlendMode: layer.blendMode,
                        }}
                        draggable={false}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          </>
        ) : (
          // Canvas for image editing
          <canvas
            ref={canvasRef}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              display: activeMedia ? "block" : "none",
            }}
          />
        )}

        {/* Empty state */}
        {!activeMedia && (
          <Flex
            w="100%"
            h="100%"
            minH="300px"
            align="center"
            justify="center"
            direction="column"
            gap={4}
            color="gray.500"
          >
            <Text fontSize="lg">أضف صورة أو فيديو للبدء</Text>
            <Text fontSize="sm" color="gray.400">
              اسحب وأفلت أو استخدم زر الوسائط
            </Text>
          </Flex>
        )}
      </MotionBox>

      {/* Video Controls */}
      <AnimatePresence>
        {isVideoMode && activeMedia && (
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            position="absolute"
            bottom={4}
            left={4}
            right={4}
            bg="blackAlpha.700"
            backdropFilter="blur(10px)"
            borderRadius="xl"
            p={3}
          >
            {/* Timeline Slider */}
            <Flex align="center" gap={3} mb={2}>
              <Text fontSize="xs" color="white" minW="50px">
                {formatTime(currentTime)}
              </Text>
              <Box flex={1}>
                <Slider.Root
                  min={0}
                  max={videoDuration || 100}
                  step={0.1}
                  value={[currentTime]}
                  onValueChange={handleSeek}
                >
                  <Slider.Control>
                    <Slider.Track bg="whiteAlpha.300" h="4px" borderRadius="full">
                      <Slider.Range bg="brand.500" />
                    </Slider.Track>
                    <Slider.Thumb
                      index={0}
                      w="14px"
                      h="14px"
                      bg="white"
                      borderRadius="full"
                      boxShadow="md"
                    />
                  </Slider.Control>
                </Slider.Root>
              </Box>
              <Text fontSize="xs" color="white" minW="50px" textAlign="right">
                {formatTime(videoDuration)}
              </Text>
            </Flex>

            {/* Control Buttons */}
            <Flex justify="center" align="center" gap={4}>
              <IconButton
                aria-label={isMuted ? "تشغيل الصوت" : "كتم الصوت"}
                variant="ghost"
                size="sm"
                color="white"
                onClick={toggleMute}
                _hover={{ bg: "whiteAlpha.200" }}
              >
                {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
              </IconButton>

              <IconButton
                aria-label={isPlaying ? "إيقاف" : "تشغيل"}
                variant="solid"
                size="lg"
                bg="white"
                color="brand.700"
                borderRadius="full"
                onClick={togglePlayPause}
                _hover={{ bg: "gray.100" }}
              >
                {isPlaying ? <FaPause /> : <FaPlay />}
              </IconButton>

              <IconButton
                aria-label={isFullscreen ? "خروج من ملء الشاشة" : "ملء الشاشة"}
                variant="ghost"
                size="sm"
                color="white"
                onClick={toggleFullscreen}
                _hover={{ bg: "whiteAlpha.200" }}
              >
                {isFullscreen ? <FaCompress /> : <FaExpand />}
              </IconButton>
            </Flex>
          </MotionBox>
        )}
      </AnimatePresence>
    </Box>
  );
}

export default PreviewStage;
