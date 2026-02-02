"use client";

import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  Progress,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useState, useCallback } from "react";
import { 
  LuFileQuestion, 
  LuCheck, 
  LuX, 
  LuRefreshCw,
  LuChevronLeft,
  LuChevronRight,
  LuTrophy,
} from "react-icons/lu";

interface QuizQuestion {
  id: string;
  type: "multiple_choice" | "true_false" | "short_answer";
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  difficulty: "easy" | "medium" | "hard";
}

interface QuizData {
  quiz: {
    id: string;
    title: string;
    questions: QuizQuestion[];
    difficulty: string;
    createdAt: string;
  };
  sourceTitle: string;
}

interface QuizGeneratorProps {
  lessonId?: string;
  courseId?: string;
  language?: "ar" | "en";
}

export default function QuizGenerator({ lessonId, courseId, language = "ar" }: QuizGeneratorProps) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [showResults, setShowResults] = useState(false);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "mixed">("medium");
  const [questionCount, setQuestionCount] = useState(5);

  const isRTL = language === "ar";

  const generateQuiz = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setShowResults(false);
    setCurrentQuestion(0);
    setAnswers({});

    try {
      const response = await fetch("/api/ai/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          lessonId,
          courseId,
          questionCount,
          difficulty,
          questionTypes: ["multiple_choice"],
          language,
        }),
      });

      const data = await response.json() as { ok: boolean; data?: QuizData; error?: string };

      if (data.ok && data.data) {
        setQuiz(data.data);
      } else {
        setError(data.error || (isRTL ? "فشل في إنشاء الاختبار" : "Failed to generate quiz"));
      }
    } catch (err) {
      console.error("Quiz error:", err);
      setError(isRTL ? "خطأ في الاتصال بالخادم" : "Server connection error");
    } finally {
      setIsLoading(false);
    }
  }, [lessonId, courseId, questionCount, difficulty, language, isRTL]);

  const selectAnswer = (questionId: string, answer: number | string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const calculateScore = () => {
    if (!quiz) return { correct: 0, total: 0, percentage: 0 };
    let correct = 0;
    quiz.quiz.questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: quiz.quiz.questions.length,
      percentage: Math.round((correct / quiz.quiz.questions.length) * 100),
    };
  };

  const currentQ = quiz?.quiz.questions[currentQuestion];
  const score = calculateScore();

  const DIFFICULTY_OPTIONS = [
    { id: "easy" as const, labelAr: "سهل", labelEn: "Easy", color: "green" },
    { id: "medium" as const, labelAr: "متوسط", labelEn: "Medium", color: "yellow" },
    { id: "hard" as const, labelAr: "صعب", labelEn: "Hard", color: "red" },
    { id: "mixed" as const, labelAr: "متنوع", labelEn: "Mixed", color: "purple" },
  ];

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
          <Icon asChild boxSize={5} color="green.400">
            <LuFileQuestion />
          </Icon>
          <Heading size="md" color="white">
            {isRTL ? "اختبار ذكي" : "AI Quiz"}
          </Heading>
        </HStack>
        {quiz && !showResults && (
          <Badge colorPalette="blue">
            {currentQuestion + 1} / {quiz.quiz.questions.length}
          </Badge>
        )}
      </Flex>

      {/* Content */}
      {!quiz && !isLoading && !error && (
        <VStack gap={4} py={4}>
          {/* Settings */}
          <Box w="100%">
            <Text color="gray.400" mb={2} fontSize="sm">
              {isRTL ? "مستوى الصعوبة:" : "Difficulty:"}
            </Text>
            <Flex gap={2} flexWrap="wrap">
              {DIFFICULTY_OPTIONS.map((opt) => (
                <Button
                  key={opt.id}
                  size="sm"
                  variant={difficulty === opt.id ? "solid" : "outline"}
                  colorPalette={difficulty === opt.id ? opt.color : "gray"}
                  onClick={() => setDifficulty(opt.id)}
                >
                  {isRTL ? opt.labelAr : opt.labelEn}
                </Button>
              ))}
            </Flex>
          </Box>

          <Box w="100%">
            <Text color="gray.400" mb={2} fontSize="sm">
              {isRTL ? "عدد الأسئلة:" : "Questions:"}
            </Text>
            <Flex gap={2}>
              {[3, 5, 10].map((num) => (
                <Button
                  key={num}
                  size="sm"
                  variant={questionCount === num ? "solid" : "outline"}
                  colorPalette={questionCount === num ? "accent" : "gray"}
                  onClick={() => setQuestionCount(num)}
                >
                  {num}
                </Button>
              ))}
            </Flex>
          </Box>

          <Button
            colorPalette="green"
            size="lg"
            onClick={generateQuiz}
            w="100%"
          >
            <Icon asChild boxSize={5}>
              <LuFileQuestion />
            </Icon>
            <Text mr={isRTL ? 0 : 2} ml={isRTL ? 2 : 0}>
              {isRTL ? "بدء الاختبار" : "Start Quiz"}
            </Text>
          </Button>
        </VStack>
      )}

      {isLoading && (
        <Flex align="center" justify="center" py={8} gap={3} color="gray.400">
          <Spinner size="md" color="green.400" />
          <Text>{isRTL ? "جاري إنشاء الاختبار..." : "Generating quiz..."}</Text>
        </Flex>
      )}

      {error && (
        <Flex direction="column" align="center" justify="center" py={6} gap={3}>
          <Text color="red.400">{error}</Text>
          <Button size="sm" variant="outline" colorPalette="red" onClick={generateQuiz}>
            <Icon asChild boxSize={4}><LuRefreshCw /></Icon>
            <Text mr={isRTL ? 0 : 2} ml={isRTL ? 2 : 0}>
              {isRTL ? "إعادة المحاولة" : "Retry"}
            </Text>
          </Button>
        </Flex>
      )}

      {/* Quiz Question */}
      {quiz && !showResults && currentQ && (
        <VStack gap={4} align="stretch">
          {/* Progress */}
          <Progress.Root value={(currentQuestion / quiz.quiz.questions.length) * 100} size="sm">
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>

          {/* Question */}
          <Box bg="gray.700" p={4} borderRadius="lg">
            <HStack justify="space-between" mb={3}>
              <Badge
                colorPalette={
                  currentQ.difficulty === "easy" ? "green" :
                  currentQ.difficulty === "hard" ? "red" : "yellow"
                }
                size="sm"
              >
                {currentQ.difficulty}
              </Badge>
            </HStack>
            <Text color="white" fontSize="lg" fontWeight="medium">
              {currentQ.question}
            </Text>
          </Box>

          {/* Options */}
          <VStack gap={2} align="stretch">
            {currentQ.options?.map((option, idx) => {
              const isSelected = answers[currentQ.id] === idx;
              return (
                <Button
                  key={idx}
                  variant={isSelected ? "solid" : "outline"}
                  colorPalette={isSelected ? "accent" : "gray"}
                  justifyContent="flex-start"
                  h="auto"
                  py={3}
                  px={4}
                  onClick={() => selectAnswer(currentQ.id, idx)}
                  textAlign={isRTL ? "right" : "left"}
                >
                  <HStack gap={3} w="100%">
                    <Badge
                      size="sm"
                      colorPalette={isSelected ? "accent" : "gray"}
                      borderRadius="full"
                      w={6}
                      h={6}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {String.fromCharCode(65 + idx)}
                    </Badge>
                    <Text flex={1} whiteSpace="normal">
                      {option}
                    </Text>
                  </HStack>
                </Button>
              );
            })}
          </VStack>

          {/* Navigation */}
          <Flex justify="space-between" mt={4}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
            >
              <Icon asChild boxSize={4}>
                {isRTL ? <LuChevronRight /> : <LuChevronLeft />}
              </Icon>
              <Text>{isRTL ? "السابق" : "Previous"}</Text>
            </Button>

            {currentQuestion === quiz.quiz.questions.length - 1 ? (
              <Button
                colorPalette="green"
                size="sm"
                onClick={() => setShowResults(true)}
                disabled={Object.keys(answers).length < quiz.quiz.questions.length}
              >
                <Icon asChild boxSize={4}><LuCheck /></Icon>
                <Text>{isRTL ? "إنهاء" : "Finish"}</Text>
              </Button>
            ) : (
              <Button
                colorPalette="accent"
                size="sm"
                onClick={() => setCurrentQuestion((prev) => prev + 1)}
                disabled={!answers[currentQ.id] && answers[currentQ.id] !== 0}
              >
                <Text>{isRTL ? "التالي" : "Next"}</Text>
                <Icon asChild boxSize={4}>
                  {isRTL ? <LuChevronLeft /> : <LuChevronRight />}
                </Icon>
              </Button>
            )}
          </Flex>
        </VStack>
      )}

      {/* Results */}
      {quiz && showResults && (
        <VStack gap={4} align="center" py={4}>
          <Icon asChild boxSize={16} color={score.percentage >= 70 ? "green.400" : "orange.400"}>
            <LuTrophy />
          </Icon>
          <Heading size="2xl" color="white">
            {score.percentage}%
          </Heading>
          <Text color="gray.400">
            {score.correct} / {score.total} {isRTL ? "إجابة صحيحة" : "correct"}
          </Text>
          <Badge
            size="lg"
            colorPalette={
              score.percentage >= 80 ? "green" :
              score.percentage >= 60 ? "yellow" : "red"
            }
          >
            {score.percentage >= 80
              ? (isRTL ? "ممتاز!" : "Excellent!")
              : score.percentage >= 60
              ? (isRTL ? "جيد" : "Good")
              : (isRTL ? "يحتاج تحسين" : "Needs Improvement")}
          </Badge>

          {/* Review Answers */}
          <VStack gap={2} w="100%" mt={4}>
            {quiz.quiz.questions.map((q, idx) => {
              const isCorrect = answers[q.id] === q.correctAnswer;
              return (
                <Box
                  key={q.id}
                  w="100%"
                  bg="gray.700"
                  p={3}
                  borderRadius="lg"
                  borderRight={isRTL ? "3px solid" : undefined}
                  borderLeft={!isRTL ? "3px solid" : undefined}
                  borderColor={isCorrect ? "green.500" : "red.500"}
                >
                  <HStack justify="space-between" mb={2}>
                    <Text color="white" fontWeight="medium" fontSize="sm">
                      {idx + 1}. {q.question}
                    </Text>
                    <Icon
                      asChild
                      boxSize={5}
                      color={isCorrect ? "green.400" : "red.400"}
                    >
                      {isCorrect ? <LuCheck /> : <LuX />}
                    </Icon>
                  </HStack>
                  {!isCorrect && q.options && (
                    <Text color="green.400" fontSize="xs">
                      {isRTL ? "الإجابة الصحيحة: " : "Correct: "}
                      {q.options[q.correctAnswer as number]}
                    </Text>
                  )}
                  {q.explanation && (
                    <Text color="gray.400" fontSize="xs" mt={1}>
                      {q.explanation}
                    </Text>
                  )}
                </Box>
              );
            })}
          </VStack>

          <Button colorPalette="accent" onClick={generateQuiz} mt={4}>
            <Icon asChild boxSize={4}><LuRefreshCw /></Icon>
            <Text>{isRTL ? "اختبار جديد" : "New Quiz"}</Text>
          </Button>
        </VStack>
      )}
    </Box>
  );
}
