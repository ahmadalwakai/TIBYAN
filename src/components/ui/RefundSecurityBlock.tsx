"use client";

import { Box, Heading, Stack, Text, Flex } from "@chakra-ui/react";
import Link from "next/link";

export default function RefundSecurityBlock() {
  return (
    <Box
      borderRadius="2xl"
      bg="surface"
      border="1px solid"
      borderColor="border"
      p={{ base: 6, md: 8 }}
      boxShadow="card"
    >
      <Stack gap={6}>
        {/* Refund Policy Section */}
        <Box>
          <Flex align="center" gap={3} mb={4}>
            <Text fontSize="3xl">💰</Text>
            <Heading size="lg" color="text">
              ضمان استرداد الأموال
            </Heading>
          </Flex>
          <Stack gap={3}>
            <Text fontSize="md" color="textBody" lineHeight="1.8">
              نوفر <strong>ضمان استرداد كامل للمبلغ المدفوع</strong> خلال أول أسبوعين (14 يوماً) من تاريخ التسجيل في البرنامج، في حال عدم رضاك عن جودة المحتوى أو طريقة التدريس.
            </Text>
            <Box
              borderRadius="lg"
              bg="rgba(18, 183, 106, 0.1)"
              border="1px solid"
              borderColor="rgba(18, 183, 106, 0.3)"
              p={4}
            >
              <Stack gap={2}>
                <Text fontSize="sm" fontWeight="700" color="success">
                  ✓ شروط الاسترداد
                </Text>
                <Text fontSize="sm" color="textBody">
                  • طلب الاسترداد خلال 14 يوم من التسجيل<br />
                  • لم يتجاوز المتعلم 25% من المحتوى الدراسي<br />
                  • الاسترداد خلال 5-7 أيام عمل
                </Text>
              </Stack>
            </Box>
            <Text fontSize="sm" color="muted">
              للمزيد من التفاصيل، راجع{" "}
              <Link href="/refund-policy" style={{ color: "var(--chakra-colors-link)", fontWeight: 600 }}>
                سياسة الاسترداد الكاملة
              </Link>
            </Text>
          </Stack>
        </Box>

        {/* Security & Payment Section */}
        <Box pt={4} borderTop="1px solid" borderColor="border">
          <Flex align="center" gap={3} mb={4}>
            <Text fontSize="3xl">🔒</Text>
            <Heading size="lg" color="text">
              الأمان وطرق الدفع
            </Heading>
          </Flex>
          <Stack gap={3}>
            <Text fontSize="md" color="textBody" lineHeight="1.8">
              نستخدم <strong>اتصال آمن مشفر (HTTPS)</strong> لحماية بياناتك الشخصية أثناء التصفح والتسجيل.
            </Text>
            <Box
              borderRadius="lg"
              bg="rgba(59, 130, 246, 0.1)"
              border="1px solid"
              borderColor="rgba(59, 130, 246, 0.3)"
              p={4}
            >
              <Stack gap={2}>
                <Text fontSize="sm" fontWeight="700" color="blue.600">
                  🔐 طرق الدفع المتاحة
                </Text>
                <Text fontSize="sm" color="textBody">
                  • التحويل البنكي (SEPA) داخل أوروبا<br />
                  • بطاقات الائتمان (Visa/Mastercard) عبر معالج دفع آمن<br />
                  • الدفع الشهري أو السنوي المقدم<br />
                  • للاستفسارات: {" "}
                  <Link href="mailto:support@ti-by-an.com" style={{ color: "var(--chakra-colors-link)", fontWeight: 600 }}>
                    support@ti-by-an.com
                  </Link>
                </Text>
              </Stack>
            </Box>
            <Text fontSize="xs" color="muted" mt={2}>
              * جميع المعاملات المالية تتم عبر قنوات مشفرة. لا نقوم بتخزين بيانات البطاقات الائتمانية على خوادمنا.
            </Text>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
