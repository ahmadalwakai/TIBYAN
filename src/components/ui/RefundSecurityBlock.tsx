"use client";

import { Box, Heading, Stack, Text, Flex } from "@chakra-ui/react";
import Link from "next/link";

export default function RefundSecurityBlock() {
  return (
    <Box
      borderRadius="2xl"
      bg="#050505"
      border="1px solid"
      borderColor="rgba(0, 255, 42, 0.3)"
      p={{ base: 6, md: 8 }}
      boxShadow="0 0 30px rgba(0, 255, 42, 0.1)"
    >
      <Stack gap={6}>
        {/* Refund Policy Section */}
        <Box>
          <Flex align="center" gap={3} mb={4}>
            <Box
              w="50px"
              h="50px"
              borderRadius="lg"
              bg="#0A0A0A"
              border="1px solid"
              borderColor="rgba(0, 255, 42, 0.3)"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="2xl">💰</Text>
            </Box>
            <Heading size="lg" color="white">
              ضمان استرداد الأموال
            </Heading>
          </Flex>
          <Stack gap={3}>
            <Text fontSize="md" color="gray.300" lineHeight="1.8">
              نوفر <Text as="strong" color="#00FF2A">ضمان استرداد كامل للمبلغ المدفوع</Text> خلال أول أسبوعين (14 يوماً) من تاريخ التسجيل في البرنامج، في حال عدم رضاك عن جودة المحتوى أو طريقة التدريس.
            </Text>
            <Box
              borderRadius="lg"
              bg="rgba(0, 255, 42, 0.05)"
              border="1px solid"
              borderColor="rgba(0, 255, 42, 0.3)"
              p={4}
            >
              <Stack gap={2}>
                <Text fontSize="sm" fontWeight="700" color="#00FF2A">
                  ✓ شروط الاسترداد
                </Text>
                <Text fontSize="sm" color="gray.300">
                  • طلب الاسترداد خلال 14 يوم من التسجيل<br />
                  • لم يتجاوز المتعلم 25% من المحتوى الدراسي<br />
                  • الاسترداد خلال 5-7 أيام عمل
                </Text>
              </Stack>
            </Box>
            <Text fontSize="sm" color="gray.400">
              للمزيد من التفاصيل، راجع{" "}
              <Link href="/refund-policy" style={{ color: "#00FF2A", fontWeight: 600 }}>
                سياسة الاسترداد الكاملة
              </Link>
            </Text>
          </Stack>
        </Box>

        {/* Security & Payment Section */}
        <Box pt={4} borderTop="1px solid" borderColor="rgba(0, 255, 42, 0.2)">
          <Flex align="center" gap={3} mb={4}>
            <Box
              w="50px"
              h="50px"
              borderRadius="lg"
              bg="#0A0A0A"
              border="1px solid"
              borderColor="rgba(0, 255, 42, 0.3)"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="2xl">🔒</Text>
            </Box>
            <Heading size="lg" color="white">
              الأمان وطرق الدفع
            </Heading>
          </Flex>
          <Stack gap={3}>
            <Text fontSize="md" color="gray.300" lineHeight="1.8">
              نستخدم <Text as="strong" color="#00FF2A">اتصال آمن مشفر (HTTPS)</Text> لحماية بياناتك الشخصية أثناء التصفح والتسجيل.
            </Text>
            <Box
              borderRadius="lg"
              bg="rgba(0, 255, 42, 0.05)"
              border="1px solid"
              borderColor="rgba(0, 255, 42, 0.3)"
              p={4}
            >
              <Stack gap={2}>
                <Text fontSize="sm" fontWeight="700" color="#00FF2A">
                  🔐 طرق الدفع المتاحة
                </Text>
                <Text fontSize="sm" color="gray.300">
                  • التحويل البنكي (SEPA) داخل أوروبا<br />
                  • بطاقات الائتمان (Visa/Mastercard) عبر معالج دفع آمن<br />
                  • الدفع الشهري أو السنوي المقدم<br />
                  • للاستفسارات: {" "}
                  <Link href="mailto:support@ti-by-an.com" style={{ color: "#00FF2A", fontWeight: 600 }}>
                    support@ti-by-an.com
                  </Link>
                </Text>
              </Stack>
            </Box>
            <Text fontSize="xs" color="gray.500" mt={2}>
              * جميع المعاملات المالية تتم عبر قنوات مشفرة. لا نقوم بتخزين بيانات البطاقات الائتمانية على خوادمنا.
            </Text>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
