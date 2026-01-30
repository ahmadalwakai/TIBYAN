"use client";

import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Progress,
  Stack,
  Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface Question {
  id: number;
  category: "knowledge" | "goals" | "availability" | "experience";
  questionKey: string;
  options: { key: string; value: number }[];
}

const questions: Question[] = [
  {
    id: 1,
    category: "experience",
    questionKey: "q1",
    options: [
      { key: "q1_a", value: 1 },
      { key: "q1_b", value: 2 },
      { key: "q1_c", value: 3 },
      { key: "q1_d", value: 4 },
    ],
  },
  {
    id: 2,
    category: "knowledge",
    questionKey: "q2",
    options: [
      { key: "q2_a", value: 1 },
      { key: "q2_b", value: 2 },
      { key: "q2_c", value: 3 },
    ],
  },
  {
    id: 3,
    category: "goals",
    questionKey: "q3",
    options: [
      { key: "q3_a", value: 1 },
      { key: "q3_b", value: 2 },
      { key: "q3_c", value: 3 },
      { key: "q3_d", value: 4 },
    ],
  },
  {
    id: 4,
    category: "availability",
    questionKey: "q4",
    options: [
      { key: "q4_a", value: 1 },
      { key: "q4_b", value: 2 },
      { key: "q4_c", value: 3 },
    ],
  },
  {
    id: 5,
    category: "experience",
    questionKey: "q5",
    options: [
      { key: "q5_a", value: 1 },
      { key: "q5_b", value: 2 },
      { key: "q5_c", value: 3 },
    ],
  },
];

type ProgramRecommendation = {
  program: string;
  match: number;
  reasonKey: string;
  icon: string;
  gradient: string;
};

export default function AssessmentPage() {
  const t = useTranslations("assessment");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestion === questions.length - 1;

  const handleAnswer = (questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setShowResults(true);
    } else {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const calculateRecommendation = (): ProgramRecommendation[] => {
    const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
    const maxPossible = questions.length * 4;
    const percentage = (totalScore / maxPossible) * 100;

    // Determine primary recommendation based on score
    const recommendations: ProgramRecommendation[] = [];

    if (percentage <= 40) {
      recommendations.push({
        program: t("programs.preparatory.title"),
        match: 95,
        reasonKey: "preparatory",
        icon: "🎓",
        gradient: "linear-gradient(135deg, #D4AF37, #F7DC6F)",
      });
      recommendations.push({
        program: t("programs.arabicReading.title"),
        match: 75,
        reasonKey: "arabicReading",
        icon: "✍️",
        gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
      });
    } else if (percentage <= 70) {
      recommendations.push({
        program: t("programs.arabicReading.title"),
        match: 90,
        reasonKey: "arabicReading",
        icon: "✍️",
        gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
      });
      recommendations.push({
        program: t("programs.preparatory.title"),
        match: 70,
        reasonKey: "preparatory",
        icon: "🎓",
        gradient: "linear-gradient(135deg, #D4AF37, #F7DC6F)",
      });
    } else {
      recommendations.push({
        program: t("programs.shariah.title"),
        match: 92,
        reasonKey: "shariah",
        icon: "📖",
        gradient: "linear-gradient(135deg, #10b981, #34d399)",
      });
      recommendations.push({
        program: t("programs.arabicReading.title"),
        match: 65,
        reasonKey: "arabicReading",
        icon: "✍️",
        gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
      });
    }

    return recommendations;
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  if (showResults) {
    const recommendations = calculateRecommendation();

    return (
      <Box as="main" bg="background" minH="100vh" py={{ base: 8, md: 16 }}>
        <Container maxW="4xl">
          <Stack gap={10} align="center">
            {/* Results Header */}
            <Stack gap={4} align="center" textAlign="center">
              <Box
                fontSize="6xl"
                css={{
                  animation: "bounce 1s ease-in-out",
                  "@keyframes bounce": {
                    "0%, 100%": { transform: "translateY(0)" },
                    "50%": { transform: "translateY(-20px)" },
                  },
                }}
              >
                🎉
              </Box>
              <Badge
                bg="linear-gradient(135deg, #D4AF37, #F7DC6F)"
                color="#0b1f3b"
                px={6}
                py={2}
                borderRadius="full"
                fontSize="sm"
                fontWeight="800"
              >
                {t("results.badge")}
              </Badge>
              <Heading
                size={{ base: "lg", md: "xl" }}
                css={{
                  background: "linear-gradient(135deg, #0b1f3b 0%, #D4AF37 50%, #0b1f3b 100%)",
                  backgroundSize: "200% auto",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                {t("results.title")}
              </Heading>
              <Text color="muted" fontSize="lg" maxW="600px">
                {t("results.subtitle")}
              </Text>
            </Stack>

            {/* Recommendations */}
            <Stack gap={6} w="100%">
              {recommendations.map((rec, index) => (
                <Box
                  key={rec.program}
                  position="relative"
                  bg="surface"
                  borderRadius="2xl"
                  overflow="hidden"
                  transition="all 0.4s ease"
                  _hover={{
                    transform: "translateY(-8px)",
                    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  {/* Match percentage bar */}
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    h="4px"
                    w={`${rec.match}%`}
                    background={rec.gradient}
                  />

                  <Flex
                    p={6}
                    gap={6}
                    align="center"
                    direction={{ base: "column", md: "row" }}
                  >
                    {/* Icon */}
                    <Box
                      w="80px"
                      h="80px"
                      borderRadius="2xl"
                      background={rec.gradient}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontSize="3xl"
                      boxShadow="0 8px 24px rgba(0, 0, 0, 0.15)"
                      flexShrink={0}
                    >
                      {rec.icon}
                    </Box>

                    {/* Content */}
                    <Stack flex="1" gap={2} textAlign={{ base: "center", md: "start" }}>
                      <Flex
                        align="center"
                        gap={3}
                        justify={{ base: "center", md: "flex-start" }}
                      >
                        <Heading size="md" color="text">
                          {rec.program}
                        </Heading>
                        {index === 0 && (
                          <Badge
                            bg="linear-gradient(135deg, #10b981, #34d399)"
                            color="white"
                            px={3}
                            py={1}
                            borderRadius="full"
                            fontSize="xs"
                            fontWeight="800"
                          >
                            {t("results.bestMatch")}
                          </Badge>
                        )}
                      </Flex>
                      <Text color="muted" fontSize="sm">
                        {t(`results.reasons.${rec.reasonKey}`)}
                      </Text>
                      <Flex align="center" gap={2} mt={2}>
                        <Text fontSize="sm" fontWeight="700" color="text">
                          {t("results.matchScore")}:
                        </Text>
                        <Box flex="1" maxW="200px">
                          <Progress.Root value={rec.match} size="sm">
                            <Progress.Track bg="backgroundAlt" borderRadius="full">
                              <Progress.Range
                                css={{
                                  background: rec.gradient,
                                  borderRadius: "full",
                                }}
                              />
                            </Progress.Track>
                          </Progress.Root>
                        </Box>
                        <Text fontSize="sm" fontWeight="800" color="brand.500">
                          {rec.match}%
                        </Text>
                      </Flex>
                    </Stack>

                    {/* CTA */}
                    <Link href="/programs" style={{ textDecoration: "none" }}>
                      <Button
                        bg="brand.900"
                        color="white"
                        size="lg"
                        px={8}
                        fontWeight="700"
                        _hover={{
                          bg: "brand.700",
                          transform: "scale(1.05)",
                        }}
                        transition="all 0.3s ease"
                      >
                        {t("results.learnMore")}
                      </Button>
                    </Link>
                  </Flex>
                </Box>
              ))}
            </Stack>

            {/* Actions */}
            <Flex gap={4} wrap="wrap" justify="center">
              <Button
                variant="outline"
                borderColor="brand.500"
                color="brand.500"
                size="lg"
                onClick={handleRestart}
                _hover={{
                  bg: "brand.50",
                }}
              >
                {t("results.retake")}
              </Button>
              <Link href="/auth/register" style={{ textDecoration: "none" }}>
                <Button
                  bg="linear-gradient(135deg, #D4AF37, #F7DC6F)"
                  color="#0b1f3b"
                  size="lg"
                  fontWeight="800"
                  _hover={{
                    transform: "scale(1.05)",
                  }}
                >
                  {t("results.createAccount")}
                </Button>
              </Link>
            </Flex>
          </Stack>
        </Container>
      </Box>
    );
  }

  const question = questions[currentQuestion];
  const hasAnswer = answers[question.id] !== undefined;

  return (
    <Box
      as="main"
      bg="background"
      minH="100vh"
      py={{ base: 8, md: 16 }}
      css={{
        "@keyframes fadeIn": {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      <Container maxW="3xl">
        <Stack gap={10}>
          {/* Header */}
          <Stack gap={4} align="center" textAlign="center">
            <Badge
              bg="linear-gradient(135deg, #D4AF37, #F7DC6F)"
              color="#0b1f3b"
              px={6}
              py={2}
              borderRadius="full"
              fontSize="sm"
              fontWeight="800"
            >
              {t("badge")}
            </Badge>
            <Heading
              size={{ base: "md", md: "lg" }}
              css={{
                background: "linear-gradient(135deg, #0b1f3b 0%, #D4AF37 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              {t("title")}
            </Heading>
            <Text color="muted" fontSize="sm">
              {t("subtitle")}
            </Text>
          </Stack>

          {/* Progress */}
          <Box>
            <Flex justify="space-between" mb={2}>
              <Text fontSize="sm" fontWeight="600" color="muted">
                {t("question")} {currentQuestion + 1} / {questions.length}
              </Text>
              <Text fontSize="sm" fontWeight="600" color="brand.500">
                {Math.round(progress)}%
              </Text>
            </Flex>
            <Progress.Root value={progress} size="sm">
              <Progress.Track bg="backgroundAlt" borderRadius="full">
                <Progress.Range
                  css={{
                    background: "linear-gradient(135deg, #D4AF37, #F7DC6F)",
                    borderRadius: "full",
                    transition: "width 0.4s ease",
                  }}
                />
              </Progress.Track>
            </Progress.Root>
          </Box>

          {/* Question Card */}
          <Box
            bg="surface"
            borderRadius="2xl"
            p={{ base: 6, md: 10 }}
            boxShadow="0 4px 20px rgba(0, 0, 0, 0.05)"
            css={{
              animation: "fadeIn 0.4s ease",
            }}
          >
            <Stack gap={8}>
              {/* Question */}
              <Heading size="md" color="text" lineHeight="1.6">
                {t(`questions.${question.questionKey}.text`)}
              </Heading>

              {/* Options */}
              <Stack gap={3}>
                {question.options.map((option) => (
                  <Box
                    key={option.key}
                    as="button"
                    w="100%"
                    p={5}
                    borderRadius="xl"
                    borderWidth="2px"
                    borderColor={
                      answers[question.id] === option.value
                        ? "brand.500"
                        : "transparent"
                    }
                    bg={
                      answers[question.id] === option.value
                        ? "brand.50"
                        : "backgroundAlt"
                    }
                    textAlign="start"
                    transition="all 0.3s ease"
                    _hover={{
                      bg: answers[question.id] === option.value ? "brand.50" : "surfaceHover",
                      transform: "translateX(8px)",
                      borderColor: "brand.300",
                    }}
                    onClick={() => handleAnswer(question.id, option.value)}
                  >
                    <Flex align="center" gap={4}>
                      <Box
                        w="24px"
                        h="24px"
                        borderRadius="full"
                        borderWidth="2px"
                        borderColor={
                          answers[question.id] === option.value
                            ? "brand.500"
                            : "border"
                        }
                        bg={
                          answers[question.id] === option.value
                            ? "brand.500"
                            : "transparent"
                        }
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        transition="all 0.2s ease"
                      >
                        {answers[question.id] === option.value && (
                          <Box
                            w="8px"
                            h="8px"
                            borderRadius="full"
                            bg="white"
                          />
                        )}
                      </Box>
                      <Text fontWeight="600" color="text">
                        {t(`questions.${question.questionKey}.${option.key}`)}
                      </Text>
                    </Flex>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Box>

          {/* Navigation */}
          <Flex justify="space-between" gap={4}>
            <Button
              variant="ghost"
              color="muted"
              size="lg"
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              _hover={{ bg: "backgroundAlt" }}
            >
              ← {t("previous")}
            </Button>
            <Button
              bg={hasAnswer ? "brand.900" : "backgroundAlt"}
              color={hasAnswer ? "white" : "muted"}
              size="lg"
              px={10}
              fontWeight="700"
              onClick={handleNext}
              disabled={!hasAnswer}
              _hover={{
                bg: hasAnswer ? "brand.700" : "backgroundAlt",
                transform: hasAnswer ? "scale(1.02)" : "none",
              }}
              transition="all 0.3s ease"
            >
              {isLastQuestion ? t("seeResults") : t("next")} →
            </Button>
          </Flex>
        </Stack>
      </Container>
    </Box>
  );
}
