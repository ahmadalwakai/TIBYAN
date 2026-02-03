"use client";

import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CourseCard, BaseCard } from "@/components/ui/cards";
import { allCourses } from "@/content/courses.ar";

// Animated counter hook
function useCountUp(end: number, duration: number = 3000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!startOnView) {
      // Initial state based on prop - legitimate setState in effect
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHasStarted(true);
    }
  }, [startOnView]);

  useEffect(() => {
    if (startOnView && ref.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !hasStarted) {
            setHasStarted(true);
          }
        },
        { threshold: 0.5 }
      );
      observer.observe(ref.current);
      return () => observer.disconnect();
    }
  }, [startOnView, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing function for smoother animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [end, duration, hasStarted]);

  return { count, ref };
}

// Animated stat component
function AnimatedStat({ value, suffix = "", prefix = "", label }: { 
  value: number; 
  suffix?: string; 
  prefix?: string;
  label: string;
}) {
  const { count, ref } = useCountUp(value, 3000);
  
  return (
    <Stack gap={1}>
      <Text fontSize="3xl" fontWeight="800" color="#00FF2A">
        <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
      </Text>
      <Text color="gray.400" fontSize="sm">{label}</Text>
    </Stack>
  );
}

// Departments configuration
const departments = [
  { id: "all", name: "جميع البرامج", icon: "📚", color: "blue" as const },
  { id: "shariah", name: "العلوم الشرعية", icon: "🕌", color: "gold" as const },
  { id: "quran", name: "القرآن والتجويد", icon: "📖", color: "green" as const },
  { id: "arabic", name: "اللغة العربية", icon: "✍️", color: "purple" as const },
  { id: "hadith", name: "الحديث والسنة", icon: "📜", color: "blue" as const },
  { id: "fiqh", name: "الفقه وأصوله", icon: "⚖️", color: "gold" as const },
];

// Map courses to departments
const getDepartment = (courseId: string) => {
  if (courseId.includes("reading") || courseId.includes("arabic")) return "arabic";
  if (courseId.includes("preparatory")) return "shariah";
  return "shariah";
};

// Format course data for display
const coursesDisplay = allCourses.map((course) => ({
  id: course.id,
  slug: course.slug,
  title: course.name,
  level: course.level,
  duration: course.duration,
  price: `€ ${course.monthlyPayment}`,
  totalPrice: `€ ${course.price}`,
  category: "علوم شرعية",
  description: course.description,
  sessions: course.totalSessions,
  department: getDepartment(course.id),
}));

export default function CoursesPage() {
  const [selectedDept, setSelectedDept] = useState("all");

  const filteredCourses = selectedDept === "all" 
    ? coursesDisplay 
    : coursesDisplay.filter(c => c.department === selectedDept);

  return (
    <Box as="main" bg="#000000" minH="100vh" position="relative" dir="rtl" lang="ar">
      {/* Decorative background elements */}
      <Box
        position="absolute"
        top="0"
        right="0"
        width="500px"
        height="500px"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.15) 0%, transparent 70%)"
        filter="blur(60px)"
        pointerEvents="none"
        zIndex={0}
        borderRadius="full"
      />
      <Box
        position="absolute"
        bottom="20%"
        left="5%"
        width="400px"
        height="400px"
        bg="radial-gradient(circle, rgba(0, 255, 42, 0.1) 0%, transparent 70%)"
        filter="blur(50px)"
        pointerEvents="none"
        zIndex={0}
        borderRadius="full"
      />
      <Container maxW="6xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }} position="relative" zIndex={1}>
        <Stack gap={10}>
          {/* Header */}
          <Stack gap={4} textAlign={{ base: "center", md: "start" }}>
            <Heading 
              size="2xl"
              color="white"
            >
              📚 البرامج التعليمية
            </Heading>
            <Text color="gray.400" fontSize="lg">
              برامج معهد تبيان الافتراضي - رحلة علمية متكاملة في العلوم الإسلامية واللغة العربية
            </Text>
          </Stack>

          {/* Department Filters */}
          <Box>
            <Text fontWeight="700" color="white" mb={4}>الأقسام العلمية</Text>
            <Flex gap={3} flexWrap="wrap">
              {departments.map((dept) => (
                <Button
                  key={dept.id}
                  onClick={() => setSelectedDept(dept.id)}
                  bg={selectedDept === dept.id ? "#00FF2A" : "#050505"}
                  color={selectedDept === dept.id ? "#000000" : "white"}
                  border="1px solid"
                  borderColor={selectedDept === dept.id ? "#00FF2A" : "rgba(0, 255, 42, 0.3)"}
                  px={5}
                  py={2}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="600"
                  transition="all 0.3s ease"
                  _hover={{
                    transform: "translateY(-2px)",
                    borderColor: "#00FF2A",
                    boxShadow: "0 0 20px rgba(0, 255, 42, 0.3)",
                    bg: selectedDept === dept.id ? "#4DFF6A" : "rgba(0, 255, 42, 0.1)",
                  }}
                >
                  {dept.icon} {dept.name}
                </Button>
              ))}
            </Flex>
          </Box>

          {/* Courses Grid */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={8}>
            {filteredCourses.map((course, index) => (
              <CourseCard
                key={course.id}
                title={course.title}
                description={course.description}
                level={course.level}
                duration={course.duration}
                sessions={course.sessions}
                price={course.price}
                totalPrice={course.totalPrice}
                category={course.category}
                slug={course.slug}
                accentColor={["gold", "blue", "green", "purple"][index % 4] as "gold" | "blue" | "green" | "purple"}
              />
            ))}
          </SimpleGrid>

          {/* Empty State */}
          {filteredCourses.length === 0 && (
            <Box textAlign="center" py={12}>
              <Text fontSize="4xl" mb={4}>🔍</Text>
              <Text color="gray.400" fontSize="lg">
                لا توجد برامج في هذا القسم حالياً
              </Text>
              <Button 
                mt={4} 
                onClick={() => setSelectedDept("all")}
                bg="#00FF2A"
                color="#000000"
                fontWeight="700"
                _hover={{ bg: "#4DFF6A", boxShadow: "0 0 20px rgba(0, 255, 42, 0.4)" }}
              >
                عرض جميع البرامج
              </Button>
            </Box>
          )}

          {/* Stats Banner */}
          <BaseCard variant="elevated" hoverLift={false}>
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={6} p={8} textAlign="center">
              <AnimatedStat value={5000} prefix="+" label="طالب مسجل" />
              <AnimatedStat value={15} suffix="+" label="برنامج تعليمي" />
              <AnimatedStat value={50} suffix="+" label="مدرس متخصص" />
              <AnimatedStat value={98} suffix="%" label="نسبة الرضا" />
            </SimpleGrid>
          </BaseCard>
        </Stack>
      </Container>
    </Box>
  );
}
