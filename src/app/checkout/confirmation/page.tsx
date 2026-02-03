"use client";

import {
  Box,
  Button,
  Container,
  Heading,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PremiumCard from "@/components/ui/PremiumCard";

export default function CheckoutConfirmationPage() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("payment");

  return (
    <Box as="main" bg="background" minH="100vh">
      <Container maxW="3xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }}>
        <PremiumCard p={{ base: 8, md: 12 }} textAlign="center">
          <Stack gap={6} align="center">
            <Text fontSize="6xl">🎉</Text>
            
            <Stack gap={2}>
              <Heading size="xl" color="text">
                تم استلام طلبك بنجاح!
              </Heading>
              <Text color="muted" fontSize="lg">
                شكراً لتسجيلك في معهد تبيان
              </Text>
            </Stack>

            {paymentId && (
              <PremiumCard p={4} bg="#0A0A0A" w="100%">
                <Text fontSize="sm" color="muted">
                  رقم الطلب: <Text as="span" fontWeight="700" color="text" dir="ltr">{paymentId}</Text>
                </Text>
              </PremiumCard>
            )}

            <Stack gap={3} w="100%">
              <PremiumCard p={4} variant="bordered">
                <Stack gap={4} textAlign="right">
                  <Heading size="sm" color="text">الخطوات التالية:</Heading>
                  <Stack gap={3}>
                    <Text fontSize="sm" color="text">
                      <Text as="span" fontWeight="700">1.</Text> تم إرسال تفاصيل الدفع إلى بريدك الإلكتروني
                    </Text>
                    <Text fontSize="sm" color="text">
                      <Text as="span" fontWeight="700">2.</Text> قم بإتمام عملية الدفع حسب الطريقة المختارة
                    </Text>
                    <Text fontSize="sm" color="text">
                      <Text as="span" fontWeight="700">3.</Text> سيتم تفعيل حسابك تلقائياً خلال 24 ساعة من استلام الدفع
                    </Text>
                    <Text fontSize="sm" color="text">
                      <Text as="span" fontWeight="700">4.</Text> ستصلك رسالة ترحيبية مع بيانات الدخول
                    </Text>
                  </Stack>
                </Stack>
              </PremiumCard>

              <PremiumCard p={4} bg="accentSubtle" borderColor="borderAccent" borderWidth="1px">
                <Stack gap={2}>
                  <Text fontWeight="700" color="primary">بيانات التحويل البنكي:</Text>
                  <Stack gap={1} fontSize="sm" color="text">
                    <Text>البنك: مصرف الراجحي</Text>
                    <Text>اسم الحساب: معهد تبيان للعلوم الشرعية</Text>
                    <Text dir="ltr">IBAN: SA0000000000000000000000</Text>
                  </Stack>
                  <Text fontSize="xs" color="muted" pt={2}>
                    * يرجى إرسال إيصال التحويل على الواتساب للتفعيل السريع
                  </Text>
                </Stack>
              </PremiumCard>
            </Stack>

            <Stack gap={3} direction={{ base: "column", sm: "row" }} w="100%" pt={4}>
              <Button
                asChild
                variant="outline"
                colorPalette="brand"
                w="100%"
              >
                <Link href="/">العودة للرئيسية</Link>
              </Button>
              <Button
                asChild
                bg="primary"
                color="white"
                w="100%"
                _hover={{ bg: "primaryHover" }}
              >
                <Link href="/courses">تصفح الدورات</Link>
              </Button>
            </Stack>

            <Text fontSize="sm" color="muted" pt={4}>
              لأي استفسار تواصل معنا: support@tibyan.com
            </Text>
          </Stack>
        </PremiumCard>
      </Container>
    </Box>
  );
}
