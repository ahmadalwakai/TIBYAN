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
import NeonCard from "@/components/ui/NeonCard";
import { allCourses } from "@/content/courses.ar";

// Animated counter hook
function useCountUp(end: number, duration: number = 3000, startOnView: boolean = true) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!startOnView) {
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
      <Text fontSize="3xl" fontWeight="800" color="brand.900">
        <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>
      </Text>
      <Text color="muted" fontSize="sm">{label}</Text>
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

  const getNeonColor = (index: number) => {
    const colors: Array<"blue" | "gold" | "green" | "purple"> = ["blue", "gold", "green", "purple"];
    return colors[index % colors.length];
  };

  return (
    <Box as="main" bg="background" minH="100vh" position="relative" dir="rtl" lang="ar">
      {/* Decorative background elements */}
      <Box
        position="absolute"
        top="0"
        right="0"
        width="500px"
        height="500px"
        bgGradient="radial(circle, brand.50 0%, transparent 70%)"
        opacity={0.3}
        pointerEvents="none"
        zIndex={0}
      />
      <Container maxW="6xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }} position="relative" zIndex={1}>
        <Stack gap={10}>
          {/* Header */}
          <Stack gap={4} textAlign={{ base: "center", md: "start" }}>
            <Heading 
              size="2xl"
              bgGradient="linear(135deg, text 0%, brand.900 100%)"
              bgClip="text"
            >
              📚 البرامج التعليمية
            </Heading>
            <Text color="muted" fontSize="lg">
              برامج معهد تبيان الافتراضي - رحلة علمية متكاملة في العلوم الإسلامية واللغة العربية
            </Text>
          </Stack>

          {/* Department Filters */}
          <Box>
            <Text fontWeight="700" color="text" mb={4}>الأقسام العلمية</Text>
            <Flex gap={3} flexWrap="wrap">
              {departments.map((dept) => (
                <Button
                  key={dept.id}
                  onClick={() => setSelectedDept(dept.id)}
                  bg={selectedDept === dept.id ? "brand.900" : "white"}
                  color={selectedDept === dept.id ? "white" : "text"}
                  borderWidth="2px"
                  borderColor={selectedDept === dept.id ? "brand.900" : "border"}
                  px={5}
                  py={2}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="600"
                  transition="all 0.3s ease"
                  _hover={{
                    transform: "translateY(-2px)",
                    borderColor: "brand.500",
                    boxShadow: "md",
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
              <NeonCard
                key={course.id}
                neonColor={getNeonColor(index)}
                glowIntensity="medium"
                animationSpeed="medium"
              >
                <Box p={6}>
                  <Stack gap={4}>
                    <Flex justify="space-between" align="start">
                      <Badge 
                        bg="brand.900"
                        color="white" 
                        px={3} 
                        py={1}
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="600"
                      >
                        {course.level}
                      </Badge>
                    </Flex>
                    
                    <Heading size="md" color="text" lineHeight="1.4">
                      {course.title}
                    </Heading>
                    
                    <Text 
                      color="muted" 
                      fontSize="sm" 
                      lineHeight="1.7"
                      css={{ 
                        display: "-webkit-box", 
                        WebkitLineClamp: 3, 
                        WebkitBoxOrient: "vertical", 
                        overflow: "hidden" 
                      }}
                    >
                      {course.description}
                    </Text>
                    
                    <SimpleGrid columns={2} gap={3} fontSize="sm" color="muted">
                      <Flex align="center" gap={2}>
                        <Text>⏱️</Text>
                        <Text>{course.duration}</Text>
                      </Flex>
                      <Flex align="center" gap={2}>
                        <Text>📚</Text>
                        <Text>{course.sessions} حصة</Text>
                      </Flex>
                      <Flex align="center" gap={2}>
                        <Text>🎓</Text>
                        <Text>شهادة معتمدة</Text>
                      </Flex>
                    </SimpleGrid>
                    
                    <Box pt={3} borderTop="1px solid" borderColor="gray.100">
                      <Flex align="center" justify="space-between" mb={3}>
                        <Stack gap={0}>
                          <Flex align="baseline" gap={1}>
                            <Text fontWeight="800" fontSize="xl" color="brand.900">
                              {course.price}
                            </Text>
                            <Text fontSize="xs" color="muted">/شهر</Text>
                          </Flex>
                          <Text fontSize="xs" color="muted">
                            المجموع: {course.totalPrice}
                          </Text>
                        </Stack>
                      </Flex>
                      
                      <Stack gap={2}>
                        <Button 
                          asChild
                          size="sm" 
                          w="full"
                          bg="brand.900"
                          color="white" 
                          _hover={{ 
                            bg: "brand.700",
                            transform: "translateY(-2px)",
                          }}
                          transition="all 0.3s ease"
                        >
                          <Link href={`/courses/${course.slug}`}>عرض التفاصيل</Link>
                        </Button>
                        <Button 
                          asChild
                          size="sm" 
                          w="full"
                          variant="outline"
                          borderColor="brand.500"
                          color="brand.900"
                          _hover={{ 
                            bg: "brand.50",
                            transform: "translateY(-2px)",
                          }}
                          transition="all 0.3s ease"
                        >
                          <Link href={`/checkout/${course.slug}`}>سجّل الآن 🚀</Link>
                        </Button>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              </NeonCard>
            ))}
          </SimpleGrid>

          {/* Empty State */}
          {filteredCourses.length === 0 && (
            <Box textAlign="center" py={12}>
              <Text fontSize="4xl" mb={4}>🔍</Text>
              <Text color="muted" fontSize="lg">
                لا توجد برامج في هذا القسم حالياً
              </Text>
              <Button 
                mt={4} 
                onClick={() => setSelectedDept("all")}
                colorPalette="brand"
              >
                عرض جميع البرامج
              </Button>
            </Box>
          )}

          {/* Stats Banner */}
          <NeonCard neonColor="gold" glowIntensity="low" animationSpeed="slow">
            <SimpleGrid columns={{ base: 2, md: 4 }} gap={6} p={8} textAlign="center">
              <AnimatedStat value={5000} prefix="+" label="طالب مسجل" />
              <AnimatedStat value={15} suffix="+" label="برنامج تعليمي" />
              <AnimatedStat value={50} suffix="+" label="مدرس متخصص" />
              <AnimatedStat value={98} suffix="%" label="نسبة الرضا" />
            </SimpleGrid>
          </NeonCard>
        </Stack>
      </Container>
    </Box>
  );
}
