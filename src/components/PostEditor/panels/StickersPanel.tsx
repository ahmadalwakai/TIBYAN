"use client";

/**
 * Stickers Panel - Add sticker layers
 */

import {
  Box,
  VStack,
  Text,
  SimpleGrid,
  Tabs,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import { useEditorStore } from "@/lib/editor/store";
import { BUILT_IN_STICKERS } from "@/lib/editor/utils";
import { STICKER_CATEGORIES } from "@/lib/editor/types";
import type { StickerLayer } from "@/lib/editor/types";

const MotionBox = motion.create(Box);

export function StickersPanel() {
  const [activeCategory, setActiveCategory] = useState("emoji");

  const canvasWidth = useEditorStore((s) => s.canvasWidth);
  const canvasHeight = useEditorStore((s) => s.canvasHeight);
  const addLayer = useEditorStore((s) => s.addLayer);

  const handleStickerSelect = useCallback(
    (stickerId: string, stickerUrl: string) => {
      const stickerLayer: Omit<StickerLayer, "id" | "zIndex"> = {
        type: "sticker",
        stickerId,
        stickerUrl,
        x: canvasWidth / 2 - 50,
        y: canvasHeight / 2 - 50,
        width: 100,
        height: 100,
        rotation: 0,
        opacity: 1,
        visible: true,
        locked: false,
      };
      addLayer(stickerLayer);
    },
    [canvasWidth, canvasHeight, addLayer]
  );

  const filteredStickers = BUILT_IN_STICKERS.filter(
    (s) => s.category === activeCategory
  );

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      p={4}
    >
      <VStack gap={6} align="stretch">
        {/* Header */}
        <Text fontSize="lg" fontWeight="700" color="gray.800">
          الملصقات
        </Text>

        {/* Category Tabs */}
        <Tabs.Root value={activeCategory} onValueChange={(e) => setActiveCategory(e.value)}>
          <Tabs.List
            bg="gray.100"
            borderRadius="xl"
            p={1}
            overflowX="auto"
            css={{ WebkitOverflowScrolling: "touch" }}
          >
            {STICKER_CATEGORIES.map((category: { id: string; name: string; nameAr: string }) => (
              <Tabs.Trigger
                key={category.id}
                value={category.id}
                px={4}
                py={2}
                borderRadius="lg"
                fontSize="sm"
                fontWeight="600"
                _selected={{
                  bg: "white",
                  color: "brand.600",
                  boxShadow: "sm",
                }}
              >
                {category.nameAr}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {/* Stickers Grid */}
          {STICKER_CATEGORIES.map((category: { id: string; name: string; nameAr: string }) => (
            <Tabs.Content key={category.id} value={category.id} pt={4}>
              <SimpleGrid columns={4} gap={3}>
                {filteredStickers
                  .filter((s) => s.category === category.id)
                  .map((sticker) => (
                    <Box
                      key={sticker.id}
                      p={2}
                      bg="gray.50"
                      borderRadius="xl"
                      cursor="pointer"
                      onClick={() => handleStickerSelect(sticker.id, sticker.url)}
                      transition="all 0.2s"
                      _hover={{
                        bg: "brand.50",
                        transform: "scale(1.1)",
                      }}
                      _active={{ transform: "scale(0.95)" }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={sticker.url}
                        alt={sticker.name}
                        style={{
                          width: "48px",
                          height: "48px",
                          margin: "0 auto",
                          objectFit: "contain",
                        }}
                      />
                    </Box>
                  ))}
              </SimpleGrid>
            </Tabs.Content>
          ))}
        </Tabs.Root>

        {/* Usage Info */}
        <Box p={4} bg="blue.50" borderRadius="xl">
          <Text fontSize="sm" color="blue.700">
            اضغط على الملصق لإضافته إلى الصورة. يمكنك تحريكه وتغيير حجمه من منطقة المعاينة.
          </Text>
        </Box>
      </VStack>
    </MotionBox>
  );
}

export default StickersPanel;
