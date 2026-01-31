"use client";

import {
  Box,
  Button,
  Flex,
  HStack,
  Input,
  NativeSelect,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useCallback, useRef, useState } from "react";

export interface TextStyling {
  fontFamily?: string;
  fontSize?: string;
  fontColor?: string;
  backgroundColor?: string;
  textAlign?: string;
}

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  styling: TextStyling;
  onStylingChange: (styling: TextStyling) => void;
  placeholder?: string;
  minHeight?: string;
}

const fontFamilies = [
  { value: "inherit", label: "الافتراضي" },
  { value: "'Noto Kufi Arabic', sans-serif", label: "الخط الكوفي" },
  { value: "'Noto Naskh Arabic', serif", label: "خط النسخ" },
  { value: "'Amiri', serif", label: "خط الأميري" },
  { value: "'Cairo', sans-serif", label: "خط القاهرة" },
  { value: "'Tajawal', sans-serif", label: "خط تجوال" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "Arial, sans-serif", label: "Arial" },
];

const fontSizes = [
  { value: "sm", label: "صغير" },
  { value: "md", label: "متوسط" },
  { value: "lg", label: "كبير" },
  { value: "xl", label: "كبير جداً" },
  { value: "2xl", label: "ضخم" },
];

const textAligns = [
  { value: "right", label: "يمين" },
  { value: "center", label: "وسط" },
  { value: "left", label: "يسار" },
  { value: "justify", label: "ضبط" },
];

const presetColors = [
  "#000000", "#374151", "#6B7280", "#9CA3AF",
  "#DC2626", "#EA580C", "#D97706", "#CA8A04",
  "#16A34A", "#059669", "#0D9488", "#0891B2",
  "#2563EB", "#4F46E5", "#7C3AED", "#9333EA",
  "#C026D3", "#DB2777", "#E11D48",
];

export default function RichTextEditor({
  value,
  onChange,
  styling,
  onStylingChange,
  placeholder = "اكتب محتوى المنشور...",
  minHeight = "200px",
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);

  const handleStyleChange = useCallback(
    (key: keyof TextStyling, styleValue: string) => {
      onStylingChange({
        ...styling,
        [key]: styleValue,
      });
    },
    [styling, onStylingChange]
  );

  const insertFormatting = useCallback(
    (prefix: string, suffix: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      
      const newValue =
        value.substring(0, start) +
        prefix +
        selectedText +
        suffix +
        value.substring(end);
      
      onChange(newValue);
      
      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + prefix.length,
          start + prefix.length + selectedText.length
        );
      }, 0);
    },
    [value, onChange]
  );

  return (
    <Stack gap={3}>
      {/* Toolbar */}
      <Flex
        wrap="wrap"
        gap={2}
        p={3}
        bg="surface"
        borderRadius="card"
        border="1px solid"
        borderColor="border"
      >
        {/* Font Family */}
        <Box flex={{ base: "1 1 100%", md: "0 0 auto" }}>
          <NativeSelect.Root size="sm">
            <NativeSelect.Field
              w="160px"
              value={styling.fontFamily || "inherit"}
              onChange={(e) => handleStyleChange("fontFamily", e.target.value)}
            >
              {fontFamilies.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Box>

        {/* Font Size */}
        <Box>
          <NativeSelect.Root size="sm">
            <NativeSelect.Field
              w="110px"
              value={styling.fontSize || "md"}
              onChange={(e) => handleStyleChange("fontSize", e.target.value)}
            >
              {fontSizes.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Box>

        {/* Text Align */}
        <Box>
          <NativeSelect.Root size="sm">
            <NativeSelect.Field
              w="100px"
              value={styling.textAlign || "right"}
              onChange={(e) => handleStyleChange("textAlign", e.target.value)}
            >
              {textAligns.map((align) => (
                <option key={align.value} value={align.value}>
                  {align.label}
                </option>
              ))}
            </NativeSelect.Field>
          </NativeSelect.Root>
        </Box>

        {/* Font Color */}
        <Box position="relative">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowBgColorPicker(false);
            }}
          >
            <Box
              w={4}
              h={4}
              borderRadius="sm"
              bg={styling.fontColor || "#000000"}
              border="1px solid"
              borderColor="border"
            />
            <Text mr={2}>لون الخط</Text>
          </Button>
          {showColorPicker && (
            <Box
              position="absolute"
              top="100%"
              right={0}
              mt={1}
              p={2}
              bg="surface"
              borderRadius="card"
              boxShadow="lg"
              zIndex={10}
              border="1px solid"
              borderColor="border"
            >
              <Flex wrap="wrap" gap={1} maxW="200px">
                {presetColors.map((color) => (
                  <Box
                    key={color}
                    w={6}
                    h={6}
                    bg={color}
                    borderRadius="sm"
                    cursor="pointer"
                    border={styling.fontColor === color ? "2px solid" : "1px solid"}
                    borderColor={styling.fontColor === color ? "brand.500" : "border"}
                    onClick={() => {
                      handleStyleChange("fontColor", color);
                      setShowColorPicker(false);
                    }}
                  />
                ))}
              </Flex>
              <Input
                mt={2}
                size="sm"
                type="color"
                value={styling.fontColor || "#000000"}
                onChange={(e) => handleStyleChange("fontColor", e.target.value)}
              />
            </Box>
          )}
        </Box>

        {/* Background Color */}
        <Box position="relative">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setShowBgColorPicker(!showBgColorPicker);
              setShowColorPicker(false);
            }}
          >
            <Box
              w={4}
              h={4}
              borderRadius="sm"
              bg={styling.backgroundColor || "transparent"}
              border="1px solid"
              borderColor="border"
            />
            <Text mr={2}>خلفية</Text>
          </Button>
          {showBgColorPicker && (
            <Box
              position="absolute"
              top="100%"
              right={0}
              mt={1}
              p={2}
              bg="surface"
              borderRadius="card"
              boxShadow="lg"
              zIndex={10}
              border="1px solid"
              borderColor="border"
            >
              <Flex wrap="wrap" gap={1} maxW="200px">
                <Box
                  w={6}
                  h={6}
                  bg="transparent"
                  borderRadius="sm"
                  cursor="pointer"
                  border="1px solid"
                  borderColor="border"
                  onClick={() => {
                    handleStyleChange("backgroundColor", "");
                    setShowBgColorPicker(false);
                  }}
                >
                  ❌
                </Box>
                {presetColors.map((color) => (
                  <Box
                    key={color}
                    w={6}
                    h={6}
                    bg={color}
                    opacity={0.3}
                    borderRadius="sm"
                    cursor="pointer"
                    border={styling.backgroundColor === color ? "2px solid" : "1px solid"}
                    borderColor={styling.backgroundColor === color ? "brand.500" : "border"}
                    onClick={() => {
                      handleStyleChange("backgroundColor", color);
                      setShowBgColorPicker(false);
                    }}
                  />
                ))}
              </Flex>
              <Input
                mt={2}
                size="sm"
                type="color"
                value={styling.backgroundColor || "#ffffff"}
                onChange={(e) => handleStyleChange("backgroundColor", e.target.value)}
              />
            </Box>
          )}
        </Box>

        {/* Formatting Buttons */}
        <HStack gap={1}>
          <Button
            size="sm"
            variant="ghost"
            fontWeight="bold"
            onClick={() => insertFormatting("<b>", "</b>")}
          >
            B
          </Button>
          <Button
            size="sm"
            variant="ghost"
            fontStyle="italic"
            onClick={() => insertFormatting("<i>", "</i>")}
          >
            I
          </Button>
          <Button
            size="sm"
            variant="ghost"
            textDecoration="underline"
            onClick={() => insertFormatting("<u>", "</u>")}
          >
            U
          </Button>
        </HStack>
      </Flex>

      {/* Editor Area */}
      <Box
        position="relative"
        borderRadius="card"
        border="1px solid"
        borderColor="border"
        overflow="hidden"
      >
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          minH={minHeight}
          resize="vertical"
          border="none"
          _focus={{ boxShadow: "none" }}
          p={4}
          style={{
            fontFamily: styling.fontFamily || "inherit",
            fontSize: styling.fontSize === "sm" ? "14px" : 
                     styling.fontSize === "lg" ? "18px" :
                     styling.fontSize === "xl" ? "20px" :
                     styling.fontSize === "2xl" ? "24px" : "16px",
            color: styling.fontColor || "inherit",
            backgroundColor: styling.backgroundColor || "transparent",
            textAlign: (styling.textAlign || "right") as "right" | "center" | "left" | "justify",
          }}
        />
      </Box>

      {/* Preview hint */}
      <Text fontSize="xs" color="muted">
        يدعم HTML الأساسي: &lt;b&gt;عريض&lt;/b&gt;، &lt;i&gt;مائل&lt;/i&gt;، &lt;u&gt;تحته خط&lt;/u&gt;
      </Text>
    </Stack>
  );
}
