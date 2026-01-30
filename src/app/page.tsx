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
import { useEffect, useRef, useState } from "react";
import PremiumCard from "@/components/ui/PremiumCard";
import StatCard from "@/components/ui/StatCard";
import FeatureCard from "@/components/ui/FeatureCard";

// Animated counter hook
function useCountUp(end: number, duration: number = 3000) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
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
  }, [hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;

    const startTime = performance.now();
    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
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

// Animated stat card component
function AnimatedStatCard({ 
  value, 
  label, 
  color, 
  icon, 
  suffix = "", 
  decimals = 0 
}: { 
  value: number; 
  label: string; 
  color: string; 
  icon: string; 
  suffix?: string;
  decimals?: number;
}) {
  const { count, ref } = useCountUp(decimals > 0 ? value * 10 : value, 3000);
  const displayValue = decimals > 0 ? (count / 10).toFixed(decimals) : count;

  return (
    <StatCard 
      accentColor={color} 
      p={4}
      transition="all 0.3s ease"
      _hover={{
        transform: "translateY(-4px)",
        boxShadow: "cardHover",
      }}
    >
      <Stack gap={1} align="center">
        <Text fontSize="lg">{icon}</Text>
        <Text 
          fontSize={{ base: "xl", md: "2xl" }}
          fontWeight="900"
          color={color}
          letterSpacing="tight"
        >
          <span ref={ref}>{displayValue}{suffix}</span>
        </Text>
        <Text fontSize="xs" color="muted" fontWeight="700">
          {label}
        </Text>
      </Stack>
    </StatCard>
  );
}

export default function Home() {
  return (
    <Box 
      as="main" 
      bg="background" 
      minH="100vh" 
      position="relative"
      css={{
        "@keyframes heroFloat": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-15px)" },
        },
        "@keyframes textGlow": {
          "0%, 100%": { textShadow: "0 0 20px rgba(200, 162, 74, 0.3)" },
          "50%": { textShadow: "0 0 40px rgba(200, 162, 74, 0.6)" },
        },
        "@keyframes gradientShift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "@keyframes sparkle": {
          "0%, 100%": { opacity: 1, transform: "scale(1)" },
          "50%": { opacity: 0.5, transform: "scale(1.2)" },
        },
      }}
    >
      {/* Hero Background Decorations */}
      <Box
        position="absolute"
        top="5%"
        right="10%"
        w="300px"
        h="300px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(200, 162, 74, 0.08) 0%, transparent 70%)"
        filter="blur(40px)"
        pointerEvents="none"
        css={{ animation: "heroFloat 8s ease-in-out infinite" }}
      />
      <Box
        position="absolute"
        top="20%"
        left="5%"
        w="200px"
        h="200px"
        borderRadius="full"
        bg="radial-gradient(circle, rgba(0, 212, 255, 0.06) 0%, transparent 70%)"
        filter="blur(30px)"
        pointerEvents="none"
        css={{ animation: "heroFloat 10s ease-in-out infinite reverse" }}
      />

      <Container maxW="7xl" py={{ base: 12, md: 24 }} px={{ base: 6, md: 8 }} position="relative">
        <Stack gap={{ base: 16, md: 20 }}>
          {/* Hero Section */}
          <Stack gap={8} textAlign={{ base: "center", md: "start" }} maxW="900px">
            <Stack gap={5} align={{ base: "center", md: "flex-start" }}>
              {/* Animated Badge */}
              <Badge
                position="relative"
                overflow="hidden"
                bg="transparent"
                color="white"
                px={6}
                py={2.5}
                borderRadius="full"
                fontSize="sm"
                fontWeight="700"
                css={{
                  background: "linear-gradient(135deg, #0b1f3b, #1a365d)",
                  boxShadow: "0 4px 20px rgba(11, 31, 59, 0.4)",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    inset: 0,
                    borderRadius: "full",
                    padding: "2px",
                    background: "linear-gradient(135deg, #c8a24a, #00d4ff, #c8a24a)",
                    backgroundSize: "200% 200%",
                    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    maskComposite: "exclude",
                    animation: "gradientShift 4s ease infinite",
                  },
                }}
              >
                <Text as="span" css={{ animation: "sparkle 2s ease-in-out infinite" }}>✨</Text>
                {" "}الجيل الجديد من منصات التعليم العربي
              </Badge>

              {/* Platform Name */}
              <Text
                fontWeight="900"
                fontSize={{ base: "xl", md: "2xl" }}
                letterSpacing="tight"
                css={{
                  background: "linear-gradient(135deg, #0b1f3b 0%, #c8a24a 50%, #0b1f3b 100%)",
                  backgroundSize: "200% auto",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                  animation: "gradientShift 4s ease infinite",
                }}
              >
                منصة تبيان | Tibyan
              </Text>
            </Stack>

            {/* Main Heading with Glow Effect */}
            <Box position="relative">
              <Box
                position="absolute"
                inset="-20px"
                bg="radial-gradient(ellipse at center, rgba(200, 162, 74, 0.1) 0%, transparent 70%)"
                filter="blur(20px)"
                pointerEvents="none"
              />
              <Heading 
                position="relative"
                size={{ base: "xl", md: "2xl" }}
                lineHeight="1.15"
                fontWeight="900"
                letterSpacing="tight"
                css={{
                  background: "linear-gradient(135deg, #0b1f3b 0%, #1a365d 30%, #c8a24a 60%, #0b1f3b 100%)",
                  backgroundSize: "300% auto",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                  animation: "gradientShift 6s ease infinite",
                }}
              >
                تعلّم بمعايير احترافية<br />
                عبر مسارات معرفية موثوقة{" "}
                <Text 
                  as="span" 
                  css={{ 
                    animation: "heroFloat 3s ease-in-out infinite",
                    display: "inline-block",
                  }}
                >
                  📚
                </Text>
              </Heading>
            </Box>

            {/* Description */}
            <Text 
              color="muted" 
              fontSize={{ base: "md", md: "xl" }} 
              lineHeight="1.9" 
              maxW="700px"
              css={{
                "& strong": {
                  color: "#c8a24a",
                  fontWeight: 700,
                },
              }}
            >
              تجربة تعلم متكاملة تجمع <strong>المحتوى المنهجي</strong>، <strong>الالتزام التعليمي</strong>،
              <strong> التقييمات المتقدمة</strong>، والمجتمع التفاعلي ضمن واجهة عربية حديثة.
            </Text>

            {/* CTA Buttons */}
            <Stack
              direction={{ base: "column", sm: "row" }}
              gap={4}
              justify={{ base: "center", md: "flex-start" }}
              pt={2}
            >
              {/* Primary Button with Glow */}
              <Box position="relative">
                <Box
                  position="absolute"
                  inset="-4px"
                  borderRadius="xl"
                  background="linear-gradient(135deg, #c8a24a, #00d4ff)"
                  filter="blur(12px)"
                  opacity={0.4}
                  css={{ animation: "sparkle 3s ease-in-out infinite" }}
                />
                <Button
                  position="relative"
                  bg="brand.900"
                  color="white"
                  size="lg"
                  px={10}
                  h="56px"
                  fontSize="lg"
                  fontWeight="700"
                  boxShadow="0 8px 30px rgba(11, 31, 59, 0.4)"
                  _hover={{ 
                    bg: "brand.800",
                    transform: "translateY(-4px) scale(1.02)",
                    boxShadow: "0 12px 40px rgba(11, 31, 59, 0.5)"
                  }}
                  transition="all 0.3s ease"
                  w={{ base: "100%", sm: "auto" }}
                >
                  🚀 استكشف البرامج
                </Button>
              </Box>

              {/* Secondary Button */}
              <Button
                variant="outline"
                borderWidth="2px"
                color="text"
                size="lg"
                px={10}
                h="56px"
                fontSize="lg"
                fontWeight="700"
                bg="transparent"
                css={{
                  borderImage: "linear-gradient(135deg, #c8a24a, #0b1f3b, #00d4ff) 1",
                  borderImageSlice: 1,
                  borderRadius: "12px",
                }}
                _hover={{ 
                  bg: "surfaceHover",
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 25px rgba(200, 162, 74, 0.2)"
                }}
                transition="all 0.3s ease"
                w={{ base: "100%", sm: "auto" }}
              >
                👨‍🏫 ابدأ كمدرّس
              </Button>
            </Stack>
            
            {/* Stats Grid */}
            <SimpleGrid
              columns={{ base: 3 }}
              gap={4}
              pt={{ base: 6, md: 8 }}
              w="100%"
              maxW="600px"
            >
              <AnimatedStatCard value={5} label="برنامج" color="brand.500" icon="📖" />
              <AnimatedStatCard value={18} suffix="k+" label="طالب نشط" color="success" icon="👥" />
              <AnimatedStatCard value={4.9} suffix="★" label="تقييم" color="warning" icon="⭐" decimals={1} />
            </SimpleGrid>
          </Stack>

          {/* Features Highlight Section */}
          <Box
            position="relative"
            borderRadius="2xl"
            overflow="hidden"
            css={{
              "@keyframes floatCard": {
                "0%, 100%": { transform: "translateY(0px)" },
                "50%": { transform: "translateY(-8px)" },
              },
              "@keyframes glowPulse": {
                "0%, 100%": { boxShadow: "0 0 20px rgba(200, 162, 74, 0.3)" },
                "50%": { boxShadow: "0 0 40px rgba(200, 162, 74, 0.5)" },
              },
              "@keyframes iconBounce": {
                "0%, 100%": { transform: "scale(1)" },
                "50%": { transform: "scale(1.1)" },
              },
            }}
          >
            {/* Animated border */}
            <Box
              position="absolute"
              inset="-2px"
              borderRadius="2xl"
              background="linear-gradient(135deg, #c8a24a, #0b1f3b, #00d4ff, #0b1f3b, #c8a24a)"
              backgroundSize="400% 400%"
              css={{
                animation: "gradient 8s ease infinite",
                "@keyframes gradient": {
                  "0%": { backgroundPosition: "0% 50%" },
                  "50%": { backgroundPosition: "100% 50%" },
                  "100%": { backgroundPosition: "0% 50%" },
                },
              }}
            />
            
            <Box
              position="relative"
              bg="linear-gradient(135deg, rgba(11, 31, 59, 0.97), rgba(11, 31, 59, 0.92))"
              borderRadius="xl"
              m="2px"
              p={{ base: 8, md: 12 }}
            >
              {/* Background decorations */}
              <Box
                position="absolute"
                top="10%"
                right="5%"
                w="200px"
                h="200px"
                borderRadius="full"
                bg="radial-gradient(circle, rgba(200, 162, 74, 0.1) 0%, transparent 70%)"
                pointerEvents="none"
              />
              <Box
                position="absolute"
                bottom="10%"
                left="5%"
                w="150px"
                h="150px"
                borderRadius="full"
                bg="radial-gradient(circle, rgba(0, 212, 255, 0.08) 0%, transparent 70%)"
                pointerEvents="none"
              />

              <Stack gap={10} position="relative" zIndex={1}>
                {/* Section Header */}
                <Stack gap={3} textAlign="center">
                  <Text color="brand.500" fontWeight="700" fontSize="sm" letterSpacing="wider">
                    ✨ لماذا تبيان؟
                  </Text>
                  <Heading 
                    size={{ base: "lg", md: "xl" }} 
                    color="white"
                    css={{
                      background: "linear-gradient(135deg, #ffffff 0%, #c8a24a 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    مميزات تجعلنا الخيار الأول
                  </Heading>
                </Stack>

                <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
                  {[
                    {
                      title: "التزام أكاديمي",
                      text: "قواعد إكمال الدروس تمنع التعلّم السطحي وتضمن فهمًا حقيقيًا ومتعمقًا للمحتوى.",
                      icon: "📚",
                      gradient: "linear-gradient(135deg, #c8a24a, #ffd700)",
                      delay: "0s",
                    },
                    {
                      title: "بنك أسئلة متقدّم",
                      text: "أنواع أسئلة متعددة، محاولات متكررة، وتقييمات آلية فورية مع تغذية راجعة مفصلة.",
                      icon: "🎯",
                      gradient: "linear-gradient(135deg, #00d4ff, #0099ff)",
                      delay: "0.2s",
                    },
                    {
                      title: "مجتمع تفاعلي",
                      text: "نقاشات حية داخل الدروس مع دعم فوري من المدرّسين والإجابات المعتمدة.",
                      icon: "💬",
                      gradient: "linear-gradient(135deg, #00ff88, #00cc6a)",
                      delay: "0.4s",
                    },
                  ].map((card) => (
                    <Box
                      key={card.title}
                      position="relative"
                      bg="rgba(255, 255, 255, 0.03)"
                      backdropFilter="blur(10px)"
                      borderRadius="xl"
                      borderWidth="1px"
                      borderColor="rgba(255, 255, 255, 0.1)"
                      p={6}
                      transition="all 0.4s ease"
                      css={{
                        animation: `floatCard 4s ease-in-out infinite`,
                        animationDelay: card.delay,
                      }}
                      _hover={{
                        bg: "rgba(255, 255, 255, 0.08)",
                        borderColor: "rgba(200, 162, 74, 0.4)",
                        transform: "translateY(-12px) scale(1.02)",
                        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
                      }}
                    >
                      {/* Glow effect on hover */}
                      <Box
                        position="absolute"
                        inset="-1px"
                        borderRadius="xl"
                        background={card.gradient}
                        opacity={0}
                        filter="blur(15px)"
                        transition="opacity 0.4s ease"
                        css={{
                          "[data-hover] &, :hover > &": { opacity: 0.3 },
                        }}
                        pointerEvents="none"
                      />

                      <Stack gap={4} align="center" textAlign="center" position="relative">
                        {/* Icon with animated background */}
                        <Box position="relative">
                          <Box
                            position="absolute"
                            inset="-8px"
                            borderRadius="full"
                            background={card.gradient}
                            filter="blur(12px)"
                            opacity={0.4}
                            css={{ animation: "glowPulse 3s ease-in-out infinite" }}
                          />
                          <Box
                            position="relative"
                            bg={card.gradient}
                            w="72px"
                            h="72px"
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            fontSize="2xl"
                            boxShadow="0 8px 24px rgba(0, 0, 0, 0.3)"
                            transition="transform 0.3s ease"
                            _hover={{ transform: "scale(1.1)" }}
                          >
                            {card.icon}
                          </Box>
                        </Box>

                        <Heading 
                          size="md" 
                          color="white"
                          fontWeight="800"
                        >
                          {card.title}
                        </Heading>

                        <Text 
                          color="whiteAlpha.800" 
                          lineHeight="1.9"
                          fontSize="sm"
                        >
                          {card.text}
                        </Text>

                        {/* Bottom accent line */}
                        <Box
                          w="40px"
                          h="3px"
                          borderRadius="full"
                          background={card.gradient}
                          opacity={0.6}
                          transition="width 0.3s ease"
                          _groupHover={{ w: "60px" }}
                        />
                      </Stack>
                    </Box>
                  ))}
                </SimpleGrid>
              </Stack>
            </Box>
          </Box>

          {/* Educational Programs Section - Enhanced */}
          <Box
            position="relative"
            py={4}
            css={{
              "@keyframes slideIn": {
                "0%": { opacity: 0, transform: "translateY(30px)" },
                "100%": { opacity: 1, transform: "translateY(0)" },
              },
              "@keyframes cardFloat": {
                "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
                "50%": { transform: "translateY(-10px) rotate(1deg)" },
              },
              "@keyframes shimmerText": {
                "0%": { backgroundPosition: "200% center" },
                "100%": { backgroundPosition: "-200% center" },
              },
              "@keyframes borderGlow": {
                "0%, 100%": { opacity: 0.5 },
                "50%": { opacity: 1 },
              },
            }}
          >
            <Stack gap={10} textAlign={{ base: "center", md: "start" }}>
              {/* Section Header */}
              <Stack gap={5} align={{ base: "center", md: "flex-start" }} maxW="750px">
                <Badge
                  position="relative"
                  overflow="hidden"
                  bg="transparent"
                  color="white"
                  px={5}
                  py={2.5}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="700"
                  css={{
                    background: "linear-gradient(135deg, #0b1f3b, #1a365d)",
                    boxShadow: "0 4px 15px rgba(11, 31, 59, 0.3)",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      inset: 0,
                      borderRadius: "full",
                      padding: "2px",
                      background: "linear-gradient(135deg, #c8a24a, #00d4ff, #c8a24a)",
                      mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                      maskComposite: "exclude",
                      animation: "borderGlow 3s ease-in-out infinite",
                    },
                  }}
                >
                  🎓 مسارات تعليمية متكاملة
                </Badge>
                <Heading 
                  size={{ base: "lg", md: "xl" }} 
                  lineHeight="1.3"
                  css={{
                    background: "linear-gradient(90deg, #0b1f3b, #c8a24a, #0b1f3b, #c8a24a)",
                    backgroundSize: "200% auto",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                    animation: "shimmerText 6s linear infinite",
                  }}
                >
                  برامج مصممة بعناية للنمو المعرفي والمهني
                </Heading>
                <Text color="muted" fontSize={{ base: "md", md: "lg" }} lineHeight="1.9">
                  من السنة التمهيدية إلى البرامج المتخصصة، نوفر مسارات تجمع بين المحتوى الأصيل،
                  التطبيق العملي، والتقييم المتقدم لضمان أثر حقيقي ومستدام.
                </Text>
              </Stack>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} gap={8}>
                {[
                  { 
                    title: "السنة التمهيدية", 
                    desc: "أساس متين في العلوم الشرعية",
                    icon: "🎓", 
                    gradient: "linear-gradient(135deg, #0b1f3b, #1a365d)",
                    accentGradient: "linear-gradient(135deg, #c8a24a, #ffd700)",
                    sessions: "160 جلسة",
                    delay: "0s",
                  },
                  { 
                    title: "المسار الشرعي", 
                    desc: "تخصص عميق في الفقه والأصول",
                    icon: "📖", 
                    gradient: "linear-gradient(135deg, #065f46, #047857)",
                    accentGradient: "linear-gradient(135deg, #00ff88, #10b981)",
                    sessions: "96-112 جلسة",
                    delay: "0.15s",
                  },
                  { 
                    title: "برنامج القراءة العربية", 
                    desc: "من الحروف إلى الطلاقة",
                    icon: "✍️", 
                    gradient: "linear-gradient(135deg, #92400e, #b45309)",
                    accentGradient: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                    sessions: "112 جلسة",
                    delay: "0.3s",
                  },
                ].map((item) => (
                  <Box
                    key={item.title}
                    position="relative"
                    borderRadius="2xl"
                    overflow="hidden"
                    css={{
                      animation: `cardFloat 5s ease-in-out infinite`,
                      animationDelay: item.delay,
                    }}
                  >
                    {/* Animated border */}
                    <Box
                      position="absolute"
                      inset="-2px"
                      borderRadius="2xl"
                      background={item.accentGradient}
                      opacity={0.6}
                      transition="opacity 0.4s ease"
                      css={{
                        animation: "borderGlow 3s ease-in-out infinite",
                      }}
                    />
                    
                    <Box
                      position="relative"
                      bg="surface"
                      borderRadius="xl"
                      m="2px"
                      p={8}
                      transition="all 0.4s ease"
                      _hover={{
                        transform: "translateY(-12px) scale(1.02)",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                      }}
                    >
                      <Stack gap={5}>
                        {/* Header with icon and badge */}
                        <Flex align="center" justify="space-between">
                          <Box position="relative">
                            {/* Icon glow */}
                            <Box
                              position="absolute"
                              inset="-6px"
                              borderRadius="xl"
                              background={item.accentGradient}
                              filter="blur(12px)"
                              opacity={0.4}
                            />
                            <Box
                              position="relative"
                              background={item.gradient}
                              color="white"
                              w="64px"
                              h="64px"
                              borderRadius="xl"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontSize="2xl"
                              boxShadow="0 8px 20px rgba(0, 0, 0, 0.2)"
                              transition="transform 0.3s ease"
                              _hover={{ transform: "scale(1.1) rotate(5deg)" }}
                            >
                              {item.icon}
                            </Box>
                          </Box>
                          <Badge
                            background={item.accentGradient}
                            color="white"
                            px={4}
                            py={2}
                            borderRadius="full"
                            fontSize="xs"
                            fontWeight="800"
                            boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)"
                          >
                            {item.sessions}
                          </Badge>
                        </Flex>

                        {/* Content */}
                        <Box>
                          <Heading 
                            size="md" 
                            mb={3}
                            css={{
                              background: item.gradient,
                              backgroundClip: "text",
                              WebkitBackgroundClip: "text",
                              color: "transparent",
                            }}
                          >
                            {item.title}
                          </Heading>
                          <Text color="muted" fontSize="sm" lineHeight="1.8">
                            {item.desc}
                          </Text>
                        </Box>

                        {/* Bottom accent */}
                        <Box
                          h="4px"
                          background={item.accentGradient}
                          borderRadius="full"
                          w="50px"
                          transition="width 0.4s ease"
                          _groupHover={{ w: "80px" }}
                        />

                        {/* Learn more link */}
                        <Flex 
                          align="center" 
                          gap={2}
                          color="muted"
                          fontSize="sm"
                          fontWeight="600"
                          cursor="pointer"
                          transition="all 0.3s ease"
                          _hover={{ 
                            color: "brand.500",
                            gap: 3,
                          }}
                        >
                          <Text>اكتشف المزيد</Text>
                          <Text>←</Text>
                        </Flex>
                      </Stack>
                    </Box>
                  </Box>
                ))}
              </SimpleGrid>
            </Stack>
          </Box>

          {/* Elegant Divider */}
          <Box 
            h="1px" 
            bg="border"
            borderRadius="full"
          />

          {/* Teacher Experience Section - Enhanced */}
          <Box
            position="relative"
            css={{
              "@keyframes featureSlide": {
                "0%": { opacity: 0, transform: "translateX(20px)" },
                "100%": { opacity: 1, transform: "translateX(0)" },
              },
              "@keyframes iconSpin": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" },
              },
              "@keyframes gradientFlow": {
                "0%": { backgroundPosition: "0% 50%" },
                "50%": { backgroundPosition: "100% 50%" },
                "100%": { backgroundPosition: "0% 50%" },
              },
            }}
          >
            <Flex
              direction={{ base: "column", md: "row" }}
              gap={{ base: 10, md: 16 }}
              align="center"
            >
              {/* Left Content */}
              <Stack flex="1" gap={8}>
                <Stack gap={4}>
                  <Badge
                    position="relative"
                    overflow="hidden"
                    bg="transparent"
                    color="white"
                    px={5}
                    py={2.5}
                    borderRadius="full"
                    fontSize="sm"
                    fontWeight="700"
                    w="fit-content"
                    css={{
                      background: "linear-gradient(135deg, #0b1f3b, #1a365d)",
                      boxShadow: "0 4px 15px rgba(11, 31, 59, 0.3)",
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        inset: 0,
                        borderRadius: "full",
                        padding: "2px",
                        background: "linear-gradient(135deg, #c8a24a, #00d4ff)",
                        mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                        maskComposite: "exclude",
                      },
                    }}
                  >
                    👨‍🏫 للمدرّسين المحترفين
                  </Badge>
                  <Heading 
                    size={{ base: "lg", md: "xl" }} 
                    lineHeight="1.3"
                    css={{
                      background: "linear-gradient(135deg, #0b1f3b 0%, #c8a24a 50%, #0b1f3b 100%)",
                      backgroundSize: "200% auto",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      color: "transparent",
                      animation: "gradientFlow 4s ease infinite",
                    }}
                  >
                    أدوات قوية لتقديم<br />تجربة تعليمية استثنائية
                  </Heading>
                </Stack>
                <Text color="muted" fontSize={{ base: "md", md: "lg" }} lineHeight="1.9" maxW="500px">
                  منشئ مقررات بصري مرن، رفع محتوى متعدد الوسائط، إعداد اختبارات ذكية،
                  وتحليلات أداء شاملة تساعدك في تحسين مستوى طلابك بشكل مستمر.
                </Text>
                <Flex gap={4} pt={2}>
                  <Box position="relative">
                    <Box
                      position="absolute"
                      inset="-3px"
                      borderRadius="xl"
                      background="linear-gradient(135deg, #c8a24a, #00d4ff)"
                      filter="blur(10px)"
                      opacity={0.4}
                    />
                    <Button
                      position="relative"
                      bg="brand.900"
                      color="white"
                      size="lg"
                      px={10}
                      fontWeight="700"
                      boxShadow="0 8px 25px rgba(11, 31, 59, 0.3)"
                      _hover={{ 
                        bg: "brand.700",
                        transform: "translateY(-4px) scale(1.02)",
                        boxShadow: "0 12px 35px rgba(11, 31, 59, 0.4)"
                      }}
                      transition="all 0.3s ease"
                    >
                      ✨ ابدأ التدريس الآن
                    </Button>
                  </Box>
                </Flex>
              </Stack>
              
              {/* Right Card - Features Grid */}
              <Box
                position="relative"
                flex="1"
                w="100%"
                maxW={{ base: "100%", md: "520px" }}
                borderRadius="2xl"
                overflow="hidden"
              >
                {/* Animated border */}
                <Box
                  position="absolute"
                  inset="-2px"
                  borderRadius="2xl"
                  background="linear-gradient(135deg, #c8a24a, #0b1f3b, #00d4ff, #0b1f3b, #c8a24a)"
                  backgroundSize="300% 300%"
                  css={{ animation: "gradientFlow 6s ease infinite" }}
                />
                
                <Box
                  position="relative"
                  bg="surface"
                  borderRadius="xl"
                  m="2px"
                  p={8}
                >
                  <SimpleGrid columns={2} gap={4}>
                    {[
                      { 
                        text: "بناء المنهج بالسحب والإفلات", 
                        icon: "🎨",
                        gradient: "linear-gradient(135deg, #c8a24a, #ffd700)",
                        delay: "0s",
                      },
                      { 
                        text: "مراجعة جودة قبل النشر", 
                        icon: "✅",
                        gradient: "linear-gradient(135deg, #10b981, #34d399)",
                        delay: "0.1s",
                      },
                      { 
                        text: "تحليلات تفاعل متقدمة", 
                        icon: "📊",
                        gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                        delay: "0.2s",
                      },
                      { 
                        text: "نظام تقييم ذكي آلي", 
                        icon: "🎯",
                        gradient: "linear-gradient(135deg, #00d4ff, #0099ff)",
                        delay: "0.3s",
                      },
                    ].map((item, index) => (
                      <Box
                        key={item.text}
                        position="relative"
                        bg="backgroundAlt"
                        borderRadius="xl"
                        p={5}
                        transition="all 0.4s ease"
                        borderWidth="2px"
                        borderColor="transparent"
                        css={{
                          animation: `featureSlide 0.6s ease forwards`,
                          animationDelay: item.delay,
                        }}
                        _hover={{
                          bg: "surfaceHover",
                          borderColor: "brand.500",
                          transform: "translateY(-8px) scale(1.03)",
                          boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        <Stack gap={4} align="center" textAlign="center">
                          {/* Icon with glow */}
                          <Box position="relative">
                            <Box
                              position="absolute"
                              inset="-6px"
                              borderRadius="xl"
                              background={item.gradient}
                              filter="blur(10px)"
                              opacity={0.3}
                            />
                            <Box
                              position="relative"
                              background={item.gradient}
                              w="56px"
                              h="56px"
                              borderRadius="xl"
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              fontSize="xl"
                              boxShadow="0 6px 15px rgba(0, 0, 0, 0.15)"
                              transition="transform 0.3s ease"
                              _hover={{ transform: "rotate(10deg) scale(1.1)" }}
                            >
                              {item.icon}
                            </Box>
                          </Box>
                          <Text 
                            fontWeight="700" 
                            fontSize="sm"
                            lineHeight="1.5"
                            color="text"
                          >
                            {item.text}
                          </Text>
                        </Stack>
                      </Box>
                    ))}
                  </SimpleGrid>
                </Box>
              </Box>
            </Flex>
          </Box>

          {/* Enhanced CTA Section with Neon Effect */}
          <Box
            position="relative"
            borderRadius="2xl"
            overflow="hidden"
            css={{
              "@keyframes borderRotate": {
                "0%": { transform: "rotate(0deg)" },
                "100%": { transform: "rotate(360deg)" },
              },
              "@keyframes shimmer": {
                "0%": { backgroundPosition: "200% 0" },
                "100%": { backgroundPosition: "-200% 0" },
              },
              "@keyframes float": {
                "0%, 100%": { transform: "translateY(0px)" },
                "50%": { transform: "translateY(-10px)" },
              },
              "@keyframes pulse": {
                "0%, 100%": { opacity: 0.6 },
                "50%": { opacity: 1 },
              },
            }}
          >
            {/* Animated neon border */}
            <Box
              position="absolute"
              inset="-3px"
              borderRadius="2xl"
              background="conic-gradient(from 0deg, #00d4ff, #0099ff, #c8a24a, #ffd700, #00d4ff)"
              css={{
                animation: "borderRotate 6s linear infinite",
              }}
              zIndex={0}
            />
            
            {/* Glow effect */}
            <Box
              position="absolute"
              inset="-8px"
              borderRadius="2xl"
              background="conic-gradient(from 0deg, rgba(0, 212, 255, 0.5), rgba(0, 153, 255, 0.3), rgba(200, 162, 74, 0.3), rgba(255, 215, 0, 0.5), rgba(0, 212, 255, 0.5))"
              filter="blur(20px)"
              css={{
                animation: "borderRotate 6s linear infinite, pulse 3s ease-in-out infinite",
              }}
              zIndex={0}
            />

            {/* Main content */}
            <Box
              position="relative"
              zIndex={1}
              bg="brand.900"
              color="white"
              borderRadius="xl"
              m="3px"
              p={{ base: 10, md: 16 }}
              overflow="hidden"
            >
              {/* Animated background particles */}
              <Box
                position="absolute"
                top="10%"
                right="5%"
                width="120px"
                height="120px"
                borderRadius="full"
                bg="linear-gradient(135deg, rgba(0, 212, 255, 0.15), rgba(255, 215, 0, 0.1))"
                filter="blur(40px)"
                css={{ animation: "float 6s ease-in-out infinite" }}
                pointerEvents="none"
              />
              <Box
                position="absolute"
                bottom="15%"
                left="10%"
                width="100px"
                height="100px"
                borderRadius="full"
                bg="linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(0, 212, 255, 0.1))"
                filter="blur(40px)"
                css={{ animation: "float 8s ease-in-out infinite reverse" }}
                pointerEvents="none"
              />
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                width="400px"
                height="400px"
                borderRadius="full"
                bg="radial-gradient(circle, rgba(200, 162, 74, 0.08) 0%, transparent 70%)"
                pointerEvents="none"
              />
              
              {/* Shimmer overlay */}
              <Box
                position="absolute"
                inset={0}
                background="linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)"
                backgroundSize="200% 100%"
                css={{ animation: "shimmer 8s ease-in-out infinite" }}
                pointerEvents="none"
              />
              
              <Stack 
                gap={8} 
                textAlign="center"
                align="center"
                position="relative" 
                zIndex={1}
                maxW="800px"
                mx="auto"
              >
                {/* Icon with glow */}
                <Box
                  position="relative"
                  css={{ animation: "float 4s ease-in-out infinite" }}
                >
                  <Box
                    position="absolute"
                    inset="-10px"
                    borderRadius="full"
                    bg="linear-gradient(135deg, rgba(0, 212, 255, 0.4), rgba(255, 215, 0, 0.4))"
                    filter="blur(20px)"
                    css={{ animation: "pulse 2s ease-in-out infinite" }}
                  />
                  <Box
                    position="relative"
                    bg="linear-gradient(135deg, rgba(0, 212, 255, 0.3), rgba(255, 215, 0, 0.3))"
                    backdropFilter="blur(10px)"
                    borderWidth="2px"
                    borderColor="whiteAlpha.300"
                    color="white"
                    w="90px"
                    h="90px"
                    borderRadius="full"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="4xl"
                    boxShadow="0 8px 32px rgba(0, 212, 255, 0.3)"
                  >
                    🚀
                  </Box>
                </Box>

                <Stack gap={3}>
                  <Heading 
                    size={{ base: "lg", md: "2xl" }} 
                    letterSpacing="tight"
                    css={{
                      background: "linear-gradient(135deg, #ffffff 0%, #00d4ff 50%, #ffd700 100%)",
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      color: "transparent",
                      backgroundSize: "200% auto",
                      animation: "shimmer 4s linear infinite",
                    }}
                  >
                    ابدأ رحلتك التعليمية مع تبيان اليوم
                  </Heading>
                  <Text color="whiteAlpha.900" fontSize={{ base: "md", md: "xl" }} lineHeight="1.8" maxW="600px">
                    انضم إلى آلاف الطلاب والمعلمين في مجتمع المعرفة وابدأ ببناء مسارك 
                    التعليمي بثقة ووضوح تام.
                  </Text>
                </Stack>

                <Stack 
                  direction={{ base: "column", sm: "row" }} 
                  gap={4}
                  w={{ base: "100%", sm: "auto" }}
                >
                  <Box position="relative">
                    <Box
                      position="absolute"
                      inset="-2px"
                      borderRadius="lg"
                      bg="linear-gradient(135deg, #00d4ff, #ffd700)"
                      filter="blur(8px)"
                      opacity={0.5}
                      css={{ animation: "pulse 2s ease-in-out infinite" }}
                    />
                    <Button 
                      position="relative"
                      bg="white" 
                      color="brand.900"
                      size="lg"
                      px={10}
                      h="56px"
                      fontSize="lg"
                      fontWeight="700"
                      boxShadow="0 8px 24px rgba(0, 0, 0, 0.15)"
                      _hover={{ 
                        transform: "translateY(-4px) scale(1.02)",
                        boxShadow: "0 12px 32px rgba(0, 212, 255, 0.3)"
                      }}
                      transition="all 0.3s ease"
                      w={{ base: "100%", sm: "auto" }}
                    >
                      🎓 إنشاء حساب طالب
                    </Button>
                  </Box>
                  <Button
                    variant="outline"
                    borderColor="whiteAlpha.400"
                    borderWidth="2px"
                    color="white"
                    size="lg"
                    px={10}
                    h="56px"
                    fontSize="lg"
                    fontWeight="700"
                    bg="whiteAlpha.100"
                    backdropFilter="blur(10px)"
                    _hover={{ 
                      bg: "whiteAlpha.200",
                      transform: "translateY(-4px)",
                      borderColor: "cyan.300",
                      boxShadow: "0 8px 24px rgba(0, 212, 255, 0.2)"
                    }}
                    transition="all 0.3s ease"
                    w={{ base: "100%", sm: "auto" }}
                  >
                    💬 تواصل معنا
                  </Button>
                </Stack>
                
                {/* Trust indicators with neon style */}
                <Flex 
                  gap={{ base: 4, md: 8 }}
                  pt={6}
                  wrap="wrap"
                  justify="center"
                  fontSize="sm"
                >
                  {[
                    { icon: "✓", text: "محتوى موثوق", color: "cyan.300" },
                    { icon: "✓", text: "شهادات معتمدة", color: "yellow.300" },
                    { icon: "✓", text: "دعم مستمر", color: "green.300" },
                  ].map((item, i) => (
                    <Flex 
                      key={i}
                      align="center" 
                      gap={2}
                      bg="whiteAlpha.100"
                      px={4}
                      py={2}
                      borderRadius="full"
                      borderWidth="1px"
                      borderColor="whiteAlpha.200"
                      backdropFilter="blur(10px)"
                    >
                      <Text fontSize="lg" color={item.color}>✓</Text>
                      <Text fontWeight="600" color="whiteAlpha.900">{item.text}</Text>
                    </Flex>
                  ))}
                </Flex>
              </Stack>
            </Box>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
