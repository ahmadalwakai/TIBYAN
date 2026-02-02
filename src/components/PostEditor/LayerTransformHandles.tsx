"use client";

/**
 * LayerTransformHandles - Visual transform handles for active layer
 * Provides dragging and resizing for layers on the canvas
 */

import { Box } from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorStore, selectActiveLayer } from "@/lib/editor/store";

const MotionBox = motion.create(Box);

interface LayerTransformHandlesProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function LayerTransformHandles({ containerRef }: LayerTransformHandlesProps) {
  const activeLayer = useEditorStore(selectActiveLayer);
  const updateLayer = useEditorStore((s) => s.updateLayer);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  const startPos = useRef({ x: 0, y: 0 });
  const startLayerPos = useRef({ x: 0, y: 0 });
  const startLayerSize = useRef({ width: 100, height: 100 });

  // Drag handlers - all hooks must be called before early return
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!activeLayer || activeLayer.locked) return;
      e.preventDefault();
      e.stopPropagation();

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      setIsDragging(true);
      startPos.current = { x: clientX, y: clientY };
      startLayerPos.current = { x: activeLayer.x, y: activeLayer.y };
    },
    [activeLayer]
  );

  const handleDrag = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isDragging || !containerRef.current || !activeLayer) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();

      // Calculate delta as percentage
      const deltaX = ((clientX - startPos.current.x) / rect.width) * 100;
      const deltaY = ((clientY - startPos.current.y) / rect.height) * 100;

      const newX = Math.max(0, Math.min(100, startLayerPos.current.x + deltaX));
      const newY = Math.max(0, Math.min(100, startLayerPos.current.y + deltaY));

      updateLayer(activeLayer.id, { x: newX, y: newY });
    },
    [isDragging, activeLayer, updateLayer, containerRef]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Resize handlers
  const handleResizeStart = useCallback(
    (handle: string, e: React.MouseEvent | React.TouchEvent) => {
      if (!activeLayer || activeLayer.locked) return;
      e.preventDefault();
      e.stopPropagation();

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      setIsResizing(true);
      setResizeHandle(handle);
      startPos.current = { x: clientX, y: clientY };
      startLayerSize.current = { width: activeLayer.width, height: activeLayer.height };
    },
    [activeLayer]
  );

  const handleResize = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!isResizing || !resizeHandle || !activeLayer) return;

      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const deltaX = clientX - startPos.current.x;
      const deltaY = clientY - startPos.current.y;

      // Calculate new width/height based on drag distance
      const newWidth = Math.max(20, startLayerSize.current.width + deltaX);
      const newHeight = Math.max(20, startLayerSize.current.height + deltaY);

      updateLayer(activeLayer.id, { width: newWidth, height: newHeight });
    },
    [isResizing, resizeHandle, activeLayer, updateLayer]
  );

  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  // Event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDrag);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleDrag);
      window.addEventListener("touchend", handleDragEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleDrag);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleDrag);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, handleDrag, handleDragEnd]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleResize);
      window.addEventListener("mouseup", handleResizeEnd);
      window.addEventListener("touchmove", handleResize);
      window.addEventListener("touchend", handleResizeEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleResize);
      window.removeEventListener("mouseup", handleResizeEnd);
      window.removeEventListener("touchmove", handleResize);
      window.removeEventListener("touchend", handleResizeEnd);
    };
  }, [isResizing, handleResize, handleResizeEnd]);

  // Early return AFTER all hooks
  if (!activeLayer || !activeLayer.visible || activeLayer.locked) {
    return null;
  }

  const { x, y, rotation, width, height } = activeLayer;

  // Use layer's own width/height for display
  const displayWidth = width || 100;
  const displayHeight = height || 100;

  return (
    <MotionBox
      position="absolute"
      left={`${x}%`}
      top={`${y}%`}
      transform={`translate(-50%, -50%) rotate(${rotation}deg)`}
      width={`${displayWidth}px`}
      height={`${displayHeight}px`}
      border="2px solid"
      borderColor="brand.500"
      borderRadius="md"
      cursor={isDragging ? "grabbing" : "grab"}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      pointerEvents="auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Resize Handles */}
      {["nw", "ne", "sw", "se"].map((handle) => (
        <Box
          key={handle}
          position="absolute"
          width="14px"
          height="14px"
          bg="white"
          border="2px solid"
          borderColor="brand.500"
          borderRadius="sm"
          cursor={`${handle}-resize`}
          {...getHandlePosition(handle)}
          transform="translate(-50%, -50%)"
          onMouseDown={(e) => handleResizeStart(handle, e)}
          onTouchStart={(e) => handleResizeStart(handle, e)}
          _hover={{ bg: "brand.100" }}
          transition="background 0.2s"
        />
      ))}

      {/* Rotation Handle */}
      <Box
        position="absolute"
        top="-30px"
        left="50%"
        transform="translateX(-50%)"
        width="20px"
        height="20px"
        bg="white"
        border="2px solid"
        borderColor="brand.500"
        borderRadius="full"
        cursor="grab"
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontSize="10px"
        _hover={{ bg: "brand.100" }}
      >
        ↻
      </Box>

      {/* Connection Line to Rotation Handle */}
      <Box
        position="absolute"
        top="-25px"
        left="50%"
        width="2px"
        height="20px"
        bg="brand.500"
        transform="translateX(-50%)"
      />
    </MotionBox>
  );
}

function getHandlePosition(handle: string): Record<string, string> {
  switch (handle) {
    case "nw":
      return { top: "0", left: "0" };
    case "ne":
      return { top: "0", right: "0", left: "auto", transform: "translate(50%, -50%)" };
    case "sw":
      return { bottom: "0", left: "0", top: "auto", transform: "translate(-50%, 50%)" };
    case "se":
      return { bottom: "0", right: "0", top: "auto", left: "auto", transform: "translate(50%, 50%)" };
    default:
      return {};
  }
}

export default LayerTransformHandles;
