import { 
  Accordion, 
  Badge, 
  Box, 
  Button, 
  Container, 
  Flex, 
  Heading, 
  HStack, 
  Link as ChakraLink,
  Stack, 
  Text 
} from "@chakra-ui/react";
import type { Metadata } from "next";
import PremiumCard from "@/components/ui/PremiumCard";
import { syrianCurriculum2026 } from "@/config/syrianCurriculum2026";

export const metadata: Metadata = {
  title: "المناهج السورية 2025/2026 – موارد المدرسين | Syrian Curriculum",
  description: "تحميل وتصفح المناهج السورية للعام الدراسي 2025/2026. روابط رسمية ومواد تعليمية للمدرسين.",
};

/**
 * Syrian Curriculum 2026 Resources Page
 * 
 * Displays downloadable/viewable Syrian curriculum PDFs organized by grade.
 * 
 * NOTE: If PDFs are placed locally, update config URLs to:
 * "/curriculum/syrian/2025-2026/Grade-XX/subject.pdf"
 */
export default function SyrianCurriculumPage() {
  const { yearLabel, lastUpdated, officialSourceUrl, grades } = syrianCurriculum2026;

  return (
    <Box
      as="main"
      dir="rtl"
      bg="#000000"
      minH="100vh"
      position="relative"
      overflow="hidden"
    >
      {/* Background decorations */}
      <Box
        position="absolute"
        top="5%"
        right="5%"
        w="400px"
        h="400px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.08) 0%, transparent 70%)"
        filter="blur(60px)"
        pointerEvents="none"
      />
      <Box
        position="absolute"
        bottom="10%"
        left="10%"
        w="300px"
        h="300px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.06) 0%, transparent 70%)"
        filter="blur(50px)"
        pointerEvents="none"
      />

      <Container
        maxW="5xl"
        py={{ base: 12, md: 20 }}
        px={{ base: 6, md: 8 }}
        position="relative"
        zIndex={1}
      >
        <Stack gap={10}>
          {/* Header Section */}
          <Stack gap={4}>
            <HStack gap={3} flexWrap="wrap">
              <Heading size="2xl" color="white" lineHeight="1.4">
                📚 المناهج السورية
              </Heading>
              <Badge
                bg="#0A0A0A"
                color="#00FF2A"
                border="1px solid"
                borderColor="#00FF2A"
                px={3}
                py={1}
                borderRadius="full"
                fontSize="md"
              >
                {yearLabel}
              </Badge>
            </HStack>
            <Text color="gray.300" fontSize="lg" lineHeight="1.9">
              مجموعة من المناهج السورية الرسمية للعام الدراسي {yearLabel}. 
              يمكنك تصفح المواد حسب الصف وتحميلها أو فتحها مباشرة.
            </Text>
          </Stack>

          {/* Info Cards */}
          <Flex gap={4} flexWrap="wrap">
            <PremiumCard variant="bordered" p={5} flex="1" minW="280px" hoverEffect={false}>
              <Stack gap={2}>
                <Text color="#00FF2A" fontWeight="600" fontSize="sm">
                  🔗 روابط رسمية
                </Text>
                <Text color="gray.400" fontSize="sm" lineHeight="1.7">
                  الروابط المعلّمة بـ &quot;رسمي&quot; توجّهك إلى بوابة وزارة التربية السورية مباشرة.
                </Text>
              </Stack>
            </PremiumCard>
            
            <PremiumCard variant="bordered" p={5} flex="1" minW="280px" hoverEffect={false}>
              <Stack gap={2}>
                <Text color="#00FF2A" fontWeight="600" fontSize="sm">
                  📥 ملفات محلية
                </Text>
                <Text color="gray.400" fontSize="sm" lineHeight="1.7">
                  الملفات المعلّمة بـ &quot;محلي&quot; متاحة للتحميل المباشر من خوادمنا.
                </Text>
              </Stack>
            </PremiumCard>
          </Flex>

          {/* Grades Accordion */}
          <PremiumCard variant="default" p={{ base: 4, md: 6 }} hoverEffect={false}>
            <Accordion.Root multiple variant="plain" defaultValue={["grade-1"]}>
              {grades.map((grade) => (
                <Accordion.Item 
                  key={grade.gradeNumber} 
                  value={`grade-${grade.gradeNumber}`}
                  borderBottom="1px solid"
                  borderColor="whiteAlpha.100"
                  _last={{ borderBottom: "none" }}
                >
                  <Accordion.ItemTrigger
                    py={4}
                    px={2}
                    cursor="pointer"
                    _hover={{ bg: "whiteAlpha.50" }}
                    borderRadius="md"
                  >
                    <Flex flex="1" justify="space-between" align="center">
                      <HStack gap={3}>
                        <Text fontSize="xl">📖</Text>
                        <Text color="white" fontWeight="600" fontSize="lg">
                          {grade.labelAr}
                        </Text>
                        <Text color="gray.500" fontSize="sm">
                          ({grade.labelEn})
                        </Text>
                      </HStack>
                      <Badge
                        bg="whiteAlpha.100"
                        color="gray.400"
                        px={2}
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                      >
                        {grade.subjects.length} مادة
                      </Badge>
                    </Flex>
                    <Accordion.ItemIndicator>
                      <Text color="gray.400">▼</Text>
                    </Accordion.ItemIndicator>
                  </Accordion.ItemTrigger>
                  
                  <Accordion.ItemContent pb={4}>
                    <Stack gap={3} pt={2}>
                      {grade.subjects.map((subject, idx) => (
                        <Flex
                          key={idx}
                          bg="whiteAlpha.50"
                          borderRadius="lg"
                          p={4}
                          justify="space-between"
                          align="center"
                          flexWrap="wrap"
                          gap={3}
                        >
                          <Stack gap={1} flex="1" minW="200px">
                            <HStack gap={2}>
                              <Text color="white" fontWeight="500">
                                {subject.titleAr}
                              </Text>
                              <Badge
                                bg={subject.source === "official" ? "blue.900" : "green.900"}
                                color={subject.source === "official" ? "blue.200" : "green.200"}
                                px={2}
                                py={0.5}
                                borderRadius="full"
                                fontSize="xs"
                              >
                                {subject.source === "official" ? "رسمي" : "محلي"}
                              </Badge>
                            </HStack>
                            <Text color="gray.500" fontSize="sm">
                              {subject.titleEn}
                            </Text>
                            {subject.notesAr && (
                              <Text color="gray.400" fontSize="xs">
                                {subject.notesAr}
                              </Text>
                            )}
                          </Stack>
                          
                          <HStack gap={2}>
                            <ChakraLink
                              href={subject.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              _hover={{ textDecoration: "none" }}
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                borderColor="#00FF2A"
                                color="#00FF2A"
                                _hover={{
                                  bg: "rgba(0, 255, 42, 0.1)",
                                }}
                              >
                                فتح ↗
                              </Button>
                            </ChakraLink>
                            {(subject.source === "local" || subject.url.endsWith(".pdf")) && (
                              <ChakraLink
                                href={subject.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={subject.source === "local" ? true : undefined}
                                _hover={{ textDecoration: "none" }}
                              >
                                <Button
                                  size="sm"
                                  bg="#00FF2A"
                                  color="black"
                                  _hover={{
                                    bg: "#00DD25",
                                  }}
                                >
                                  تحميل ⬇
                                </Button>
                              </ChakraLink>
                            )}
                          </HStack>
                        </Flex>
                      ))}
                    </Stack>
                  </Accordion.ItemContent>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </PremiumCard>

          {/* Footer Info */}
          <PremiumCard variant="bordered" p={5} hoverEffect={false}>
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
              <Stack gap={1}>
                <Text color="gray.400" fontSize="sm">
                  آخر تحديث: {lastUpdated}
                </Text>
                <Text color="gray.500" fontSize="xs">
                  المصدر الرسمي:{" "}
                  <ChakraLink
                    href={officialSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    color="#00FF2A"
                    _hover={{ textDecoration: "underline" }}
                  >
                    وزارة التربية السورية
                  </ChakraLink>
                </Text>
              </Stack>
              <Text color="gray.600" fontSize="xs" maxW="300px">
                ملاحظة: بعض الروابط قد تتطلب اتصالاً بالإنترنت أو قد تتغير. 
                نوصي بالتحقق من المصدر الرسمي.
              </Text>
            </Flex>
          </PremiumCard>
        </Stack>
      </Container>
    </Box>
  );
}
