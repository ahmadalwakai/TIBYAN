"use client";

import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState, useCallback } from "react";
import { LuBookOpen, LuList, LuNotebookPen, LuSparkles, LuRefreshCw } from "react-icons/lu";

type SummaryType = "brief" | "detailed" | "key_points" | "study_notes";

interface SummaryData {
  summary: string;
  type: SummaryType;
  lessonTitle: string;
  courseTitle: string;
  generatedAt: string;
  durationMs: number;
}

interface LessonSummarizerProps {
  lessonId: string;
  language?: "ar" | "en";
}

const SUMMARY_TYPES = [
  { id: "brief" as const, labelAr: "ملخص موجز", labelEn: "Brief", icon: LuSparkles },
  { id: "detailed" as const, labelAr: "ملخص مفصل", labelEn: "Detailed", icon: LuBookOpen },
  { id: "key_points" as const, labelAr: "النقاط الرئيسية", labelEn: "Key Points", icon: LuList },
  { id: "study_notes" as const, labelAr: "ملاحظات دراسية", labelEn: "Study Notes", icon: LuNotebookPen },
];

export default function LessonSummarizer({ lessonId, language = "ar" }: LessonSummarizerProps) {
  const [selectedType, setSelectedType] = useState<SummaryType>("brief");
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRTL = language === "ar";

  const generateSummary = useCallback(async (type: SummaryType) => {
    setIsLoading(true);
    setError(null);
    setSelectedType(type);

    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ lessonId, type, language }),
      });

      const data = await response.json() as { ok: boolean; data?: SummaryData; error?: string };

      if (data.ok && data.data) {
        setSummary(data.data);
      } else {
        setError(data.error || (isRTL ? "فشل في إنشاء الملخص" : "Failed to generate summary"));
      }
    } catch (err) {
      console.error("Summary error:", err);
      setError(isRTL ? "خطأ في الاتصال بالخادم" : "Server connection error");
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, language, isRTL]);

  return (
    <Box
      bg="gray.800"
      borderRadius="xl"
      p={5}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <Flex align="center" justify="space-between" mb={4}>
        <HStack gap={2}>
          <Icon asChild boxSize={5} color="accent.400">
            <LuSparkles />
          </Icon>
          <Heading size="md" color="white">
            {isRTL ? "ملخص بالذكاء الاصطناعي" : "AI Summary"}
          </Heading>
        </HStack>
        {summary && (
          <Badge colorPalette="green" size="sm">
            {(summary.durationMs / 1000).toFixed(1)}s
          </Badge>
        )}
      </Flex>

      {/* Type Selector */}
      <Flex gap={2} mb={4} flexWrap="wrap">
        {SUMMARY_TYPES.map((type) => (
          <Button
            key={type.id}
            size="sm"
            variant={selectedType === type.id ? "solid" : "outline"}
            colorPalette={selectedType === type.id ? "accent" : "gray"}
            onClick={() => generateSummary(type.id)}
            disabled={isLoading}
          >
            <Icon asChild boxSize={4}>
              <type.icon />
            </Icon>
            <Text mr={isRTL ? 0 : 2} ml={isRTL ? 2 : 0}>
              {isRTL ? type.labelAr : type.labelEn}
            </Text>
          </Button>
        ))}
      </Flex>

      {/* Content */}
      <VStack align="stretch" gap={3}>
        {isLoading ? (
          <Flex
            align="center"
            justify="center"
            py={8}
            gap={3}
            color="gray.400"
          >
            <Spinner size="md" color="accent.400" />
            <Text>{isRTL ? "جاري إنشاء الملخص..." : "Generating summary..."}</Text>
          </Flex>
        ) : error ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            py={6}
            gap={3}
          >
            <Text color="red.400">{error}</Text>
            <Button
              size="sm"
              variant="outline"
              colorPalette="red"
              onClick={() => generateSummary(selectedType)}
            >
              <Icon asChild boxSize={4}>
                <LuRefreshCw />
              </Icon>
              <Text mr={isRTL ? 0 : 2} ml={isRTL ? 2 : 0}>
                {isRTL ? "إعادة المحاولة" : "Retry"}
              </Text>
            </Button>
          </Flex>
        ) : summary ? (
          <Box
            bg="gray.700"
            p={4}
            borderRadius="lg"
            borderRight={isRTL ? "3px solid" : undefined}
            borderLeft={!isRTL ? "3px solid" : undefined}
            borderColor="accent.500"
          >
            <Text
              color="white"
              fontSize="sm"
              lineHeight="tall"
              whiteSpace="pre-wrap"
            >
              {summary.summary}
            </Text>
            <HStack gap={2} mt={3} fontSize="xs" color="gray.400">
              <Text>{summary.lessonTitle}</Text>
              <Text>•</Text>
              <Text>{summary.courseTitle}</Text>
            </HStack>
          </Box>
        ) : (
          <Flex
            direction="column"
            align="center"
            justify="center"
            py={8}
            gap={3}
            color="gray.500"
          >
            <Icon asChild boxSize={10}>
              <LuSparkles />
            </Icon>
            <Text textAlign="center">
              {isRTL
                ? "اختر نوع الملخص للبدء"
                : "Select a summary type to begin"}
            </Text>
          </Flex>
        )}
      </VStack>
    </Box>
  );
}
