"use client";

/**
 * Bottom Toolbar Component
 * iOS-style horizontally scrollable toolbar with main and secondary tools
 */

import { Box, Flex, Text, HStack, VStack, Icon } from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  FaCut,
  FaMusic,
  FaFont,
  FaMagic,
  FaLayerGroup,
  FaClosedCaptioning,
  FaAdjust,
  FaPalette,
  FaCropAlt,
  FaImages,
  FaSmile,
  FaSlidersH,
  FaRobot,
  FaShapes,
} from "react-icons/fa";
import { useEditorStore, selectIsVideoMode } from "@/lib/editor/store";
import type { ToolbarItem, ToolbarButton as ToolbarButtonType } from "@/lib/editor/types";

const MotionBox = motion.create(Box);

// Export ToolId type
export type ToolId = ToolbarItem | "aspect-ratio";

// ============== Toolbar Configuration ==============

const MAIN_TOOLBAR_ITEMS: ToolbarButtonType[] = [
  { id: "edit", icon: "cut", label: "Edit", labelAr: "تحرير" },
  { id: "audio", icon: "music", label: "Audio", labelAr: "صوت" },
  { id: "text", icon: "font", label: "Text", labelAr: "نص" },
  { id: "effects", icon: "magic", label: "Effects", labelAr: "تأثيرات" },
  { id: "overlay", icon: "layer", label: "Overlay", labelAr: "طبقة" },
  { id: "captions", icon: "caption", label: "Captions", labelAr: "ترجمة" },
  { id: "filters", icon: "adjust", label: "Filters", labelAr: "فلاتر" },
];

const SECONDARY_TOOLBAR_ITEMS: ToolbarButtonType[] = [
  { id: "background", icon: "palette", label: "Background", labelAr: "خلفية" },
  { id: "aspect", icon: "crop", label: "Aspect", labelAr: "نسبة" },
  { id: "media", icon: "images", label: "Media", labelAr: "وسائط" },
  { id: "stickers", icon: "smile", label: "Stickers", labelAr: "ملصقات" },
  { id: "adjust", icon: "sliders", label: "Adjust", labelAr: "ضبط" },
  { id: "shape", icon: "shapes", label: "Shape", labelAr: "شكل" },
  { id: "ai-avatar", icon: "robot", label: "AI Avatar", labelAr: "صورة ذكية" },
];

// ============== Icon Mapping ==============

const getIcon = (iconName: string) => {
  const icons: Record<string, React.ElementType> = {
    cut: FaCut,
    music: FaMusic,
    font: FaFont,
    magic: FaMagic,
    layer: FaLayerGroup,
    caption: FaClosedCaptioning,
    adjust: FaAdjust,
    palette: FaPalette,
    crop: FaCropAlt,
    images: FaImages,
    smile: FaSmile,
    sliders: FaSlidersH,
    robot: FaRobot,
    shapes: FaShapes,
  };
  return icons[iconName] || FaMagic;
};

// ============== Toolbar Button Component ==============

interface ToolbarButtonProps {
  item: ToolbarButtonType;
  isActive: boolean;
  onClick: () => void;
  isDisabled?: boolean;
}

function ToolbarButton({ item, isActive, onClick, isDisabled }: ToolbarButtonProps) {
  return (
    <MotionBox
      as="button"
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      gap={1}
      px={3}
      py={2}
      minW="60px"
      borderRadius="xl"
      bg={isActive ? "brand.500" : "transparent"}
      color={isActive ? "white" : "gray.600"}
      opacity={isDisabled ? 0.5 : 1}
      cursor={isDisabled ? "not-allowed" : "pointer"}
      onClick={isDisabled ? undefined : onClick}
      whileHover={isDisabled ? {} : { scale: 1.05 }}
      whileTap={isDisabled ? {} : { scale: 0.95 }}
      _hover={
        isDisabled
          ? {}
          : {
              bg: isActive ? "brand.600" : "gray.100",
            }
      }
    >
      <Icon as={getIcon(item.icon)} boxSize={5} />
      <Text fontSize="xs" fontWeight={isActive ? "600" : "500"}>
        {item.labelAr}
      </Text>
    </MotionBox>
  );
}

// ============== Bottom Toolbar Component ==============

interface BottomToolbarProps {
  onToolSelect?: (toolId: ToolId) => void;
  activeTool?: ToolId | null;
}

export function BottomToolbar({ onToolSelect, activeTool }: BottomToolbarProps) {
  const activePanel = useEditorStore((s) => s.activePanel);
  const setActivePanel = useEditorStore((s) => s.setActivePanel);
  const isVideoMode = useEditorStore(selectIsVideoMode);
  const hasMedia = useEditorStore((s) => s.mediaAssets.length > 0);

  const handleToolClick = (toolId: ToolbarItem) => {
    setActivePanel(toolId);
    onToolSelect?.(toolId);
  };

  return (
    <Box
      position="absolute"
      bottom={0}
      left={0}
      right={0}
      bg="white"
      borderTopRadius="2xl"
      boxShadow="0 -4px 20px rgba(0, 0, 0, 0.1)"
      zIndex={10}
      pb="env(safe-area-inset-bottom)"
    >
      <VStack gap={0} py={2}>
        {/* Main Toolbar */}
        <Box w="100%" overflowX="auto" css={{ WebkitOverflowScrolling: "touch" }}>
          <HStack
            gap={1}
            px={4}
            py={2}
            minW="max-content"
            justify="flex-start"
          >
            {MAIN_TOOLBAR_ITEMS.map((item) => {
              // Audio and Captions are video-only
              const isVideoOnly = item.id === "audio" || item.id === "captions";
              const isDisabled = isVideoOnly && !isVideoMode;

              return (
                <ToolbarButton
                  key={item.id}
                  item={item}
                  isActive={activePanel === item.id}
                  onClick={() => handleToolClick(item.id)}
                  isDisabled={isDisabled || !hasMedia}
                />
              );
            })}
          </HStack>
        </Box>

        {/* Divider */}
        <Box w="90%" h="1px" bg="gray.100" my={1} />

        {/* Secondary Toolbar */}
        <Box w="100%" overflowX="auto" css={{ WebkitOverflowScrolling: "touch" }}>
          <HStack
            gap={1}
            px={4}
            py={2}
            minW="max-content"
            justify="flex-start"
          >
            {SECONDARY_TOOLBAR_ITEMS.map((item) => (
              <ToolbarButton
                key={item.id}
                item={item}
                isActive={activePanel === item.id}
                onClick={() => handleToolClick(item.id)}
                isDisabled={item.id !== "media" && !hasMedia}
              />
            ))}
          </HStack>
        </Box>
      </VStack>

      {/* Home indicator for iOS */}
      <Flex justify="center" pb={2}>
        <Box w="134px" h="5px" bg="gray.300" borderRadius="full" />
      </Flex>
    </Box>
  );
}

export default BottomToolbar;
