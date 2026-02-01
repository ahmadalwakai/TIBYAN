"use client";

/**
 * LayerList - Displays and manages layers
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  IconButton,
  Badge,
} from "@chakra-ui/react";
import { motion, Reorder } from "framer-motion";
import { useEditorStore, selectSortedLayers } from "@/lib/editor/store";
import type { Layer } from "@/lib/editor/types";

const MotionBox = motion.create(Box);

export function LayerList() {
  const layers = useEditorStore(selectSortedLayers);
  const activeLayerId = useEditorStore((s) => s.activeLayerId);
  const setActiveLayer = useEditorStore((s) => s.setActiveLayer);
  const removeLayer = useEditorStore((s) => s.removeLayer);
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const reorderLayers = useEditorStore((s) => s.reorderLayers);

  const handleReorder = (newOrder: Layer[]) => {
    // Get the indices for reordering
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
    const fromIndex = sortedLayers.findIndex((l) => l.id === newOrder[0]?.id);
    const toIndex = 0;
    if (fromIndex !== -1) {
      reorderLayers(fromIndex, toIndex);
    }
  };

  const toggleVisibility = (layer: Layer, e: React.MouseEvent) => {
    e.stopPropagation();
    updateLayer(layer.id, { visible: !layer.visible });
  };

  const toggleLock = (layer: Layer, e: React.MouseEvent) => {
    e.stopPropagation();
    updateLayer(layer.id, { locked: !layer.locked });
  };

  const handleDelete = (layerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeLayer(layerId);
  };

  if (layers.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Text fontSize="sm" color="gray.500">
          لا توجد طبقات
        </Text>
        <Text fontSize="xs" color="gray.400" mt={1}>
          أضف نصًا أو ملصقات أو صور
        </Text>
      </Box>
    );
  }

  return (
    <Box p={2}>
      <HStack justify="space-between" mb={3} px={2}>
        <Text fontSize="sm" fontWeight="700" color="gray.700">
          الطبقات
        </Text>
        <Badge colorScheme="brand" fontSize="xs">
          {layers.length}
        </Badge>
      </HStack>

      <Reorder.Group
        axis="y"
        values={layers}
        onReorder={handleReorder}
        as="div"
        style={{ listStyle: "none", padding: 0, margin: 0 }}
      >
        <VStack gap={2} align="stretch">
          {layers.map((layer) => (
            <Reorder.Item
              key={layer.id}
              value={layer}
              as="div"
              style={{ listStyle: "none" }}
            >
              <LayerItem
                layer={layer}
                isActive={activeLayerId === layer.id}
                onSelect={() => setActiveLayer(layer.id)}
                onToggleVisibility={(e) => toggleVisibility(layer, e)}
                onToggleLock={(e) => toggleLock(layer, e)}
                onDelete={(e) => handleDelete(layer.id, e)}
              />
            </Reorder.Item>
          ))}
        </VStack>
      </Reorder.Group>
    </Box>
  );
}

// ============== Layer Item Component ==============

interface LayerItemProps {
  layer: Layer;
  isActive: boolean;
  onSelect: () => void;
  onToggleVisibility: (e: React.MouseEvent) => void;
  onToggleLock: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

function LayerItem({
  layer,
  isActive,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete,
}: LayerItemProps) {
  const getLayerIcon = () => {
    switch (layer.type) {
      case "text":
        return "📝";
      case "sticker":
        return "🏷️";
      case "overlay":
        return "🖼️";
      case "caption":
        return "💬";
      default:
        return "📄";
    }
  };

  const getLayerLabel = () => {
    switch (layer.type) {
      case "text":
        return layer.text.length > 15 ? layer.text.slice(0, 15) + "..." : layer.text;
      case "sticker":
        return layer.stickerId;
      case "overlay":
        return "صورة مركبة";
      case "caption":
        return layer.text.length > 15 ? layer.text.slice(0, 15) + "..." : layer.text;
      default:
        return "طبقة";
    }
  };

  return (
    <MotionBox
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      p={3}
      bg={isActive ? "brand.50" : "gray.50"}
      borderRadius="lg"
      border="2px solid"
      borderColor={isActive ? "brand.500" : "transparent"}
      cursor="grab"
      onClick={onSelect}
      _hover={{ bg: isActive ? "brand.100" : "gray.100" }}
      opacity={layer.visible ? 1 : 0.5}
    >
      <HStack justify="space-between">
        <HStack gap={3}>
          {/* Drag Handle */}
          <Box color="gray.400" cursor="grab" _active={{ cursor: "grabbing" }}>
            ⋮⋮
          </Box>

          {/* Icon */}
          <Box fontSize="lg">{getLayerIcon()}</Box>

          {/* Label */}
          <VStack gap={0} align="start">
            <Text fontSize="sm" fontWeight="600" color={isActive ? "brand.700" : "gray.700"}>
              {getLayerLabel()}
            </Text>
            <Text fontSize="xs" color="gray.500">
              {getLayerTypeLabel(layer.type)}
            </Text>
          </VStack>
        </HStack>

        {/* Actions */}
        <HStack gap={1}>
          {/* Visibility Toggle */}
          <IconButton
            aria-label={layer.visible ? "إخفاء" : "إظهار"}
            size="sm"
            variant="ghost"
            onClick={onToggleVisibility}
            color={layer.visible ? "gray.600" : "gray.400"}
          >
            {layer.visible ? "👁️" : "🙈"}
          </IconButton>

          {/* Lock Toggle */}
          <IconButton
            aria-label={layer.locked ? "فك القفل" : "قفل"}
            size="sm"
            variant="ghost"
            onClick={onToggleLock}
            color={layer.locked ? "orange.500" : "gray.400"}
          >
            {layer.locked ? "🔒" : "🔓"}
          </IconButton>

          {/* Delete */}
          <IconButton
            aria-label="حذف"
            size="sm"
            variant="ghost"
            onClick={onDelete}
            color="red.400"
            _hover={{ color: "red.600", bg: "red.50" }}
          >
            🗑️
          </IconButton>
        </HStack>
      </HStack>
    </MotionBox>
  );
}

function getLayerTypeLabel(type: Layer["type"]): string {
  switch (type) {
    case "text":
      return "نص";
    case "sticker":
      return "ملصق";
    case "overlay":
      return "صورة";
    case "caption":
      return "تسمية";
    default:
      return "طبقة";
  }
}

export default LayerList;
