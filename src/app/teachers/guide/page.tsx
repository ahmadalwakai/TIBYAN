import { Box, Container, Heading, List, Stack, Text } from "@chakra-ui/react";
import type { Metadata } from "next";
import PremiumCard from "@/components/ui/PremiumCard";

export const metadata: Metadata = {
  title: "دليل المدرس – كيف نعمل في تِبيان | Teacher Guide",
  description: "دليل شامل للمدرسين الجدد والحاليين في معهد تبيان. يوضح التوقعات، طريقة العمل، والتواصل.",
};

export default function TeacherGuidePage() {
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
        maxW="4xl"
        py={{ base: 12, md: 20 }}
        px={{ base: 6, md: 8 }}
        position="relative"
        zIndex={1}
      >
        <Stack gap={10}>
          {/* SECTION 1 — Introduction */}
          <Stack gap={4}>
            <Heading size="2xl" color="white" lineHeight="1.4">
              مرحبًا بك في فريق تِبيان
            </Heading>
            <Text color="gray.300" fontSize="lg" lineHeight="1.9">
              التدريس في تبيان مسؤولية مشتركة. نحن نعمل معًا لنقدّم تجربة تعليمية
              واضحة ومتّسقة. نثق بقدراتك، ونتوقع منك الالتزام والوضوح. هذا الدليل
              يوضح طريقة العمل، ليس للمراقبة، بل لتسهيل مهمتك.
            </Text>
          </Stack>

          {/* SECTION 2 — What a Teaching Day Looks Like */}
          <PremiumCard variant="bordered" p={{ base: 6, md: 8 }} hoverEffect={false}>
            <Stack gap={5}>
              <Heading size="lg" color="white">
                كيف يبدو يوم المدرس في تِبيان؟
              </Heading>
              <List.Root gap={4} color="gray.300" fontSize="md" lineHeight="1.8">
                <List.Item>
                  <Text as="span" color="#00FF2A" fontWeight="500">قبل الحصة:</Text>{" "}
                  مراجعة سريعة لما سبق تدريسه.
                </List.Item>
                <List.Item>
                  <Text as="span" color="#00FF2A" fontWeight="500">أثناء الحصة:</Text>{" "}
                  شرح، تصحيح، وتفاعل مع الطالب.
                </List.Item>
                <List.Item>
                  <Text as="span" color="#00FF2A" fontWeight="500">بعد الحصة:</Text>{" "}
                  ملاحظة قصيرة عن تقدم الطالب.
                </List.Item>
                <List.Item>
                  <Text as="span" color="#00FF2A" fontWeight="500">بين الحصص:</Text>{" "}
                  متابعة بسيطة عند الحاجة فقط.
                </List.Item>
              </List.Root>
            </Stack>
          </PremiumCard>

          {/* SECTION 3 — What Is Expected From You */}
          <PremiumCard variant="default" p={{ base: 6, md: 8 }} hoverEffect={false}>
            <Stack gap={5}>
              <Heading size="lg" color="white">
                ما المتوقع منك كمدرس؟
              </Heading>
              <List.Root gap={3} color="gray.300" fontSize="md" lineHeight="1.8">
                <List.Item>الالتزام بالوقت المحدد للحصص.</List.Item>
                <List.Item>الوضوح في الشرح والتوجيه.</List.Item>
                <List.Item>كتابة ملاحظة مختصرة بعد كل حصة.</List.Item>
                <List.Item>احترام وتيرة تعلّم كل طالب.</List.Item>
              </List.Root>
            </Stack>
          </PremiumCard>

          {/* SECTION 4 — What You Are NOT Expected to Do */}
          <PremiumCard variant="default" p={{ base: 6, md: 8 }} hoverEffect={false}>
            <Stack gap={5}>
              <Heading size="lg" color="white">
                ما الذي لا يُطلب منك؟
              </Heading>
              <Text color="gray.400" fontSize="md" lineHeight="1.8">
                نريدك أن تركّز على التدريس فقط. هذه أمور ليست من مسؤولياتك:
              </Text>
              <List.Root gap={3} color="gray.300" fontSize="md" lineHeight="1.8">
                <List.Item>لا تقارير طويلة أو تفصيلية.</List.Item>
                <List.Item>لا تسويق أو ترويج للمنصة.</List.Item>
                <List.Item>لا متابعة خارج نطاق المنهج.</List.Item>
                <List.Item>لا وعود للطلاب أو الأهالي.</List.Item>
              </List.Root>
            </Stack>
          </PremiumCard>

          {/* SECTION 5 — How Your Work Is Seen */}
          <PremiumCard variant="bordered" p={{ base: 6, md: 8 }} hoverEffect={false}>
            <Stack gap={5}>
              <Heading size="lg" color="white">
                كيف نعرف أن عملك مؤثر؟
              </Heading>
              <Text color="gray.300" fontSize="md" lineHeight="1.8">
                نحن لا نقيس الأداء بالأرقام اللحظية. بدلاً من ذلك:
              </Text>
              <List.Root gap={3} color="gray.300" fontSize="md" lineHeight="1.8">
                <List.Item>نراجع ملخصات النشاط أسبوعيًا.</List.Item>
                <List.Item>ملاحظاتك تنعكس في تحديثات الأكاديمية.</List.Item>
                <List.Item>نتابع تقدم الطلاب على المدى البعيد، لا بالحصة الواحدة.</List.Item>
              </List.Root>
              <Text color="gray.400" fontSize="md" lineHeight="1.8">
                جهدك ملاحَظ، والنتائج تتراكم مع الوقت.
              </Text>
            </Stack>
          </PremiumCard>

          {/* SECTION 6 — Communication */}
          <PremiumCard variant="default" p={{ base: 6, md: 8 }} hoverEffect={false}>
            <Stack gap={5}>
              <Heading size="lg" color="white">
                التواصل
              </Heading>
              <Text color="gray.300" fontSize="md" lineHeight="1.8">
                التواصل مع الإدارة بسيط ومباشر:
              </Text>
              <List.Root gap={3} color="gray.300" fontSize="md" lineHeight="1.8">
                <List.Item>تواصل عند وجود مشكلة تقنية أو تأخير.</List.Item>
                <List.Item>أبلغ عن أي موقف يحتاج تدخل إداري.</List.Item>
                <List.Item>اجعل رسائلك قصيرة وواضحة.</List.Item>
              </List.Root>
              <Text color="gray.400" fontSize="md" lineHeight="1.8">
                لا حاجة للتفسيرات الطويلة. الوضوح أهم.
              </Text>
            </Stack>
          </PremiumCard>

          {/* SECTION 7 — Closing Statement */}
          <Stack gap={4} pt={4}>
            <Box
              borderTop="1px solid"
              borderColor="rgba(0, 255, 42, 0.2)"
              pt={6}
            >
              <Text color="gray.300" fontSize="lg" lineHeight="1.9">
                شكرًا لانضمامك إلى فريق تبيان. نحن نعمل كفريق واحد، ونجاح الطالب
                هو نجاحنا جميعًا. إذا احتجت أي توضيح، تواصل معنا بكل بساطة.
              </Text>
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
