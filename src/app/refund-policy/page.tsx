"use client";

import {
  Box,
  Container,
  Heading,
  Stack,
  Text,
  Flex,
  Button,
} from "@chakra-ui/react";
import Link from "next/link";
import PremiumCard from "@/components/ui/PremiumCard";

export default function RefundPolicyPage() {
  return (
    <Box as="main" bg="background" minH="100vh">
      <Container maxW="4xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }}>
        <Stack gap={8}>
          {/* Header */}
          <Stack gap={3}>
            <Button asChild variant="ghost" size="sm" w="fit-content">
              <Link href="/pricing">→ العودة للأسعار</Link>
            </Button>
            <Heading as="h1" size="2xl" color="text">
              سياسة استرداد الأموال 💰
            </Heading>
            <Text fontSize="lg" color="muted">
              آخر تحديث: 31 يناير 2026
            </Text>
          </Stack>

          {/* Policy Details */}
          <PremiumCard p={{ base: 6, md: 8 }}>
            <Stack gap={6}>
              <Box>
                <Heading size="lg" color="text" mb={3}>
                  ضمان استرداد كامل لمدة 14 يوماً
                </Heading>
                <Text fontSize="md" color="textBody" lineHeight="1.8">
                  في معهد التبيان، نحرص على توفير تجربة تعليمية استثنائية. لذلك نوفر لك <strong>ضمان استرداد كامل للمبلغ المدفوع</strong> خلال الأسبوعين الأولين (14 يوماً) من تاريخ التسجيل في أي برنامج تعليمي، في حال عدم رضاك التام عن جودة المحتوى أو طريقة التدريس.
                </Text>
              </Box>

              <Box
                borderRadius="lg"
                bg="rgba(18, 183, 106, 0.1)"
                border="1px solid"
                borderColor="rgba(18, 183, 106, 0.3)"
                p={5}
              >
                <Stack gap={4}>
                  <Heading size="md" color="success">
                    ✓ شروط الاستحقاق
                  </Heading>
                  <Stack gap={2}>
                    <Flex gap={2} align="start">
                      <Text color="success">•</Text>
                      <Text fontSize="md" color="textBody" lineHeight="1.7">
                        يجب تقديم طلب الاسترداد خلال <strong>14 يوماً من تاريخ التسجيل</strong>
                      </Text>
                    </Flex>
                    <Flex gap={2} align="start">
                      <Text color="success">•</Text>
                      <Text fontSize="md" color="textBody" lineHeight="1.7">
                        لم يتجاوز المتعلم <strong>25% من المحتوى الدراسي</strong> الإجمالي
                      </Text>
                    </Flex>
                    <Flex gap={2} align="start">
                      <Text color="success">•</Text>
                      <Text fontSize="md" color="textBody" lineHeight="1.7">
                        الطلب يتم من خلال <strong>البريد الإلكتروني الرسمي</strong>: support@ti-by-an.com
                      </Text>
                    </Flex>
                  </Stack>
                </Stack>
              </Box>

              <Box>
                <Heading size="md" color="text" mb={3}>
                  إجراءات طلب الاسترداد
                </Heading>
                <Stack gap={3}>
                  <Box
                    borderRadius="lg"
                    bg="backgroundAlt"
                    border="1px solid"
                    borderColor="border"
                    p={4}
                  >
                    <Flex gap={3} align="start">
                      <Box
                        bg="primary"
                        color="white"
                        borderRadius="full"
                        w={8}
                        h={8}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontWeight="700"
                        flexShrink={0}
                      >
                        1
                      </Box>
                      <Stack gap={1}>
                        <Text fontWeight="700" color="text">
                          أرسل طلب استرداد
                        </Text>
                        <Text fontSize="sm" color="muted" lineHeight="1.7">
                          قم بإرسال رسالة إلكترونية إلى support@ti-by-an.com مع ذكر اسمك الكامل ورقم التسجيل والبرنامج المسجل به.
                        </Text>
                      </Stack>
                    </Flex>
                  </Box>

                  <Box
                    borderRadius="lg"
                    bg="backgroundAlt"
                    border="1px solid"
                    borderColor="border"
                    p={4}
                  >
                    <Flex gap={3} align="start">
                      <Box
                        bg="primary"
                        color="white"
                        borderRadius="full"
                        w={8}
                        h={8}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontWeight="700"
                        flexShrink={0}
                      >
                        2
                      </Box>
                      <Stack gap={1}>
                        <Text fontWeight="700" color="text">
                          مراجعة الطلب
                        </Text>
                        <Text fontSize="sm" color="muted" lineHeight="1.7">
                          يقوم فريقنا بمراجعة الطلب والتأكد من استيفاء الشروط خلال <strong>48 ساعة عمل</strong>.
                        </Text>
                      </Stack>
                    </Flex>
                  </Box>

                  <Box
                    borderRadius="lg"
                    bg="backgroundAlt"
                    border="1px solid"
                    borderColor="border"
                    p={4}
                  >
                    <Flex gap={3} align="start">
                      <Box
                        bg="primary"
                        color="white"
                        borderRadius="full"
                        w={8}
                        h={8}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        fontWeight="700"
                        flexShrink={0}
                      >
                        3
                      </Box>
                      <Stack gap={1}>
                        <Text fontWeight="700" color="text">
                          استلام المبلغ
                        </Text>
                        <Text fontSize="sm" color="muted" lineHeight="1.7">
                          بعد الموافقة، يتم تحويل المبلغ المدفوع إلى نفس طريقة الدفع الأصلية خلال <strong>5-7 أيام عمل</strong>.
                        </Text>
                      </Stack>
                    </Flex>
                  </Box>
                </Stack>
              </Box>

              <Box
                borderRadius="lg"
                bg="rgba(245, 101, 101, 0.1)"
                border="1px solid"
                borderColor="rgba(245, 101, 101, 0.3)"
                p={5}
              >
                <Stack gap={3}>
                  <Heading size="md" color="error">
                    ⚠️ حالات عدم الاستحقاق
                  </Heading>
                  <Stack gap={2}>
                    <Flex gap={2} align="start">
                      <Text color="error">✗</Text>
                      <Text fontSize="sm" color="textBody">
                        طلبات الاسترداد بعد مرور 14 يوماً من تاريخ التسجيل
                      </Text>
                    </Flex>
                    <Flex gap={2} align="start">
                      <Text color="error">✗</Text>
                      <Text fontSize="sm" color="textBody">
                        إذا تجاوز الطالب 25% من المحتوى الدراسي
                      </Text>
                    </Flex>
                    <Flex gap={2} align="start">
                      <Text color="error">✗</Text>
                      <Text fontSize="sm" color="textBody">
                        استخدام الشهادة الرسمية أو إتمام البرنامج
                      </Text>
                    </Flex>
                  </Stack>
                </Stack>
              </Box>

              <Box>
                <Heading size="md" color="text" mb={3}>
                  الأسئلة الشائعة
                </Heading>
                <Stack gap={3}>
                  <Box>
                    <Text fontWeight="700" color="text" mb={1}>
                      هل يمكن طلب استرداد جزئي؟
                    </Text>
                    <Text fontSize="sm" color="muted" lineHeight="1.7">
                      لا، نوفر فقط استرداد كامل للمبلغ المدفوع وفقاً للشروط المذكورة.
                    </Text>
                  </Box>
                  <Box>
                    <Text fontWeight="700" color="text" mb={1}>
                      ماذا عن الدفعات الشهرية؟
                    </Text>
                    <Text fontSize="sm" color="muted" lineHeight="1.7">
                      في حال الدفع على دفعات شهرية، يتم استرداد الدفعة الأولى فقط إذا كان الطلب ضمن الفترة المحددة.
                    </Text>
                  </Box>
                  <Box>
                    <Text fontWeight="700" color="text" mb={1}>
                      هل أحتاج لتقديم سبب محدد؟
                    </Text>
                    <Text fontSize="sm" color="muted" lineHeight="1.7">
                      لا، لكن نحب أن نسمع ملاحظاتك لتحسين خدماتنا بشكل مستمر.
                    </Text>
                  </Box>
                </Stack>
              </Box>

              <Box pt={4} borderTop="1px solid" borderColor="border" textAlign="center">
                <Text fontSize="sm" color="muted" mb={3}>
                  لديك استفسار؟ تواصل معنا عبر
                </Text>
                <Flex gap={4} justify="center" wrap="wrap">
                  <Link href="mailto:support@ti-by-an.com" style={{ color: "var(--chakra-colors-link)", fontWeight: 600 }}>
                    📧 support@ti-by-an.com
                  </Link>
                  <Link href="/help" style={{ color: "var(--chakra-colors-link)", fontWeight: 600 }}>
                    💬 مركز المساعدة
                  </Link>
                </Flex>
              </Box>
            </Stack>
          </PremiumCard>

          {/* CTA back to pricing */}
          <Box textAlign="center">
            <Button asChild bg="primary" color="white" size="lg" _hover={{ bg: "primaryHover" }}>
              <Link href="/pricing">عرض الباقات والأسعار</Link>
            </Button>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
