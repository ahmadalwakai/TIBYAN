"use client";

/**
 * Filters Panel - Apply preset filters with intensity
 */

import {
  Box,
  VStack,
  HStack,
  Text,
  SimpleGrid,
  Slider,
} from "@chakra-ui/react";
import { motion } from "framer-motion";
import { useEditorStore } from "@/lib/editor/store";
import { FILTER_PRESETS } from "@/lib/editor/utils";

const MotionBox = motion.create(Box);

export function FiltersPanel() {
  const activeFilter = useEditorStore((s) => s.activeFilter);
  const filterIntensity = useEditorStore((s) => s.filterIntensity);
  const setFilter = useEditorStore((s) => s.setFilter);
  const setFilterIntensity = useEditorStore((s) => s.setFilterIntensity);

  const handleFilterSelect = (filterId: string) => {
    if (filterId === "none") {
      setFilter(null);
    } else {
      setFilter(filterId);
    }
  };

  const handleIntensityChange = (details: { value: number[] }) => {
    setFilterIntensity(details.value[0]);
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
          الفلاتر
        </Text>

        {/* Filters Grid */}
        <SimpleGrid columns={3} gap={3}>
          {FILTER_PRESETS.map((filter) => (
            <Box
              key={filter.id}
              p={3}
              bg={activeFilter === filter.id || (filter.id === "none" && !activeFilter) ? "brand.50" : "gray.50"}
              borderRadius="xl"
              border="2px solid"
              borderColor={activeFilter === filter.id || (filter.id === "none" && !activeFilter) ? "brand.500" : "transparent"}
              cursor="pointer"
              onClick={() => handleFilterSelect(filter.id)}
              transition="all 0.2s"
              _hover={{ bg: "gray.100" }}
              textAlign="center"
            >
              <Box
                w="50px"
                h="50px"
                mx="auto"
                mb={2}
                borderRadius="lg"
                overflow="hidden"
                bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                style={{ filter: filter.cssFilter }}
              />
              <Text fontSize="xs" fontWeight="600" color="gray.700">
                {filter.nameAr}
              </Text>
            </Box>
          ))}
        </SimpleGrid>

        {/* Intensity Slider */}
        {activeFilter && (
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text fontSize="sm" fontWeight="600" color="gray.700">
                شدة الفلتر
              </Text>
              <Text fontSize="sm" color="brand.600" fontWeight="600">
                {filterIntensity}%
              </Text>
            </HStack>
            <Slider.Root
              min={0}
              max={100}
              step={1}
              value={[filterIntensity]}
              onValueChange={handleIntensityChange}
            >
              <Slider.Control>
                <Slider.Track bg="gray.200" h="6px" borderRadius="full">
                  <Slider.Range bg="brand.500" />
                </Slider.Track>
                <Slider.Thumb index={0} bg="brand.500" boxSize="18px" borderRadius="full" />
              </Slider.Control>
            </Slider.Root>
          </Box>
        )}

        {/* Filter Preview Info */}
        <Box p={4} bg="gray.50" borderRadius="xl">
          <Text fontSize="sm" color="gray.600">
            {activeFilter ? (
              <>
                الفلتر المحدد:{" "}
                <Text as="span" fontWeight="600" color="brand.600">
                  {FILTER_PRESETS.find((f) => f.id === activeFilter)?.nameAr}
                </Text>
              </>
            ) : (
              "اختر فلتر لتطبيقه على الصورة أو الفيديو"
            )}
          </Text>
        </Box>
      </VStack>
    </MotionBox>
  );
}

export default FiltersPanel;
