"use client";

import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PremiumCard from "@/components/ui/PremiumCard";
import { allCourses } from "@/content/courses.ar";

interface CourseData {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  monthlyPayment: number;
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    paymentMethod: "bank_transfer",
    couponCode: "",
  });

  useEffect(() => {
    const found = allCourses.find((c) => c.slug === params.slug);
    if (found) {
      setCourse(found);
    }
  }, [params.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!course) return;

    if (!formData.customerName || !formData.customerEmail || !formData.customerPhone) {
      setNotice({
        type: "error",
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
      });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.ok) {
        setNotice({
          type: "success",
          title: "تم إنشاء طلب الدفع بنجاح! 🎉",
          description: "سيتم إرسال تفاصيل الدفع إلى بريدك الإلكتروني. بعد إتمام الدفع سيتم تفعيل حسابك تلقائياً.",
        });
        // Redirect to confirmation page after delay
        setTimeout(() => {
          router.push(`/checkout/confirmation?payment=${data.data.paymentId}`);
        }, 2000);
      } else {
        setNotice({
          type: "error",
          title: "حدث خطأ",
          description: data.error || "يرجى المحاولة مرة أخرى",
        });
      }
    } catch {
      setNotice({
        type: "error",
        title: "حدث خطأ",
        description: "يرجى التحقق من اتصالك بالإنترنت",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!course) {
    return (
      <Box as="main" bg="background" minH="100vh">
        <Container maxW="5xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }}>
          <PremiumCard p={8} textAlign="center">
            <Text color="muted" fontSize="lg">جاري تحميل بيانات الدورة...</Text>
          </PremiumCard>
        </Container>
      </Box>
    );
  }

  return (
    <Box as="main" bg="background" minH="100vh">
      <Container maxW="5xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }}>
        <form onSubmit={handleSubmit}>
          <Stack gap={8}>
            {/* Back Button */}
            <Link href={`/courses/${course.slug}`}>
              <Button variant="ghost" size="sm">
                → العودة للدورة
              </Button>
            </Link>

            {/* Header */}
            <Stack gap={2} textAlign="center">
              <Badge colorPalette="green" fontSize="sm" w="fit-content" mx="auto">
                إتمام التسجيل
              </Badge>
              <Heading size="xl" color="text">
                التسجيل في {course.name} 📝
              </Heading>
              <Text color="muted">
                أكمل بياناتك لإتمام عملية التسجيل
              </Text>
            </Stack>

            {/* Notice */}
            {notice && (
              <PremiumCard
                p={4}
                bg={notice.type === "success" ? "green.50" : "red.50"}
                borderColor={notice.type === "success" ? "green.200" : "red.200"}
                borderWidth="1px"
              >
                <Stack gap={1}>
                  <Text fontWeight="700" color={notice.type === "success" ? "green.700" : "red.700"}>
                    {notice.title}
                  </Text>
                  <Text color={notice.type === "success" ? "green.600" : "red.600"}>
                    {notice.description}
                  </Text>
                </Stack>
              </PremiumCard>
            )}

            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={8}>
              {/* Form */}
              <Stack gap={6}>
                <PremiumCard p={{ base: 6, md: 8 }}>
                  <Stack gap={5}>
                    <Heading size="md" color="text">بيانات الطالب 👤</Heading>
                    
                    <Stack gap={4}>
                      <Box>
                        <Text mb={2} fontWeight="600" color="text">
                          الاسم الكامل <Text as="span" color="red.500">*</Text>
                        </Text>
                        <Input
                          value={formData.customerName}
                          onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                          placeholder="أدخل اسمك الكامل"
                          bg="white"
                          size="lg"
                        />
                      </Box>

                      <Box>
                        <Text mb={2} fontWeight="600" color="text">
                          البريد الإلكتروني <Text as="span" color="red.500">*</Text>
                        </Text>
                        <Input
                          type="email"
                          value={formData.customerEmail}
                          onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                          placeholder="example@email.com"
                          bg="white"
                          size="lg"
                          dir="ltr"
                        />
                      </Box>

                      <Box>
                        <Text mb={2} fontWeight="600" color="text">
                          رقم الهاتف <Text as="span" color="red.500">*</Text>
                        </Text>
                        <Input
                          type="tel"
                          value={formData.customerPhone}
                          onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                          placeholder="+966 5XX XXX XXXX"
                          bg="white"
                          size="lg"
                          dir="ltr"
                        />
                      </Box>
                    </Stack>
                  </Stack>
                </PremiumCard>

                <PremiumCard p={{ base: 6, md: 8 }}>
                  <Stack gap={5}>
                    <Heading size="md" color="text">طريقة الدفع 💳</Heading>
                    
                    <Stack gap={3}>
                      {[
                        { id: "bank_transfer", label: "تحويل بنكي", icon: "🏦", desc: "تحويل مباشر للحساب البنكي" },
                        { id: "stripe", label: "بطاقة ائتمان", icon: "💳", desc: "Visa, Mastercard" },
                        { id: "paypal", label: "PayPal", icon: "🅿️", desc: "الدفع عبر PayPal" },
                      ].map((method) => (
                        <Box
                          key={method.id}
                          as="label"
                          cursor="pointer"
                          p={4}
                          borderRadius="lg"
                          borderWidth="2px"
                          borderColor={formData.paymentMethod === method.id ? "brand.500" : "gray.200"}
                          bg={formData.paymentMethod === method.id ? "brand.50" : "white"}
                          transition="all 0.2s"
                          _hover={{ borderColor: "brand.300" }}
                        >
                          <Flex align="center" gap={3}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={method.id}
                              checked={formData.paymentMethod === method.id}
                              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                              style={{ display: "none" }}
                            />
                            <Text fontSize="2xl">{method.icon}</Text>
                            <Stack gap={0}>
                              <Text fontWeight="600" color="text">{method.label}</Text>
                              <Text fontSize="sm" color="muted">{method.desc}</Text>
                            </Stack>
                          </Flex>
                        </Box>
                      ))}
                    </Stack>
                  </Stack>
                </PremiumCard>

                <PremiumCard p={{ base: 6, md: 8 }}>
                  <Stack gap={4}>
                    <Heading size="md" color="text">كود الخصم 🎁</Heading>
                    <Flex gap={3}>
                      <Input
                        value={formData.couponCode}
                        onChange={(e) => setFormData({ ...formData, couponCode: e.target.value })}
                        placeholder="أدخل كود الخصم"
                        bg="white"
                        flex={1}
                      />
                      <Button variant="outline" colorPalette="brand">
                        تطبيق
                      </Button>
                    </Flex>
                  </Stack>
                </PremiumCard>
              </Stack>

              {/* Order Summary */}
              <Stack gap={6}>
                <PremiumCard p={{ base: 6, md: 8 }} position="sticky" top={6}>
                  <Stack gap={5}>
                    <Heading size="md" color="text">ملخص الطلب 🧾</Heading>
                    
                    <Stack gap={3} pb={4} borderBottom="1px solid" borderColor="gray.100">
                      <Flex justify="space-between">
                        <Text color="text">{course.name}</Text>
                        <Text fontWeight="600" color="text">
                          {course.price} {course.currency}
                        </Text>
                      </Flex>
                      <Flex justify="space-between">
                        <Text color="muted">الخصم</Text>
                        <Text color="green.500">- 0 {course.currency}</Text>
                      </Flex>
                    </Stack>

                    <Flex justify="space-between" align="center">
                      <Text fontWeight="700" fontSize="lg" color="text">الإجمالي</Text>
                      <Stack gap={0} align="end">
                        <Text fontWeight="800" fontSize="2xl" color="brand.900">
                          {course.price} {course.currency}
                        </Text>
                        <Text fontSize="sm" color="green.600">
                          أو {course.monthlyPayment} {course.currency}/شهر
                        </Text>
                      </Stack>
                    </Flex>

                    <Button
                      type="submit"
                      bg="brand.900"
                      color="white"
                      size="lg"
                      w="100%"
                      py={7}
                      fontSize="lg"
                      fontWeight="700"
                      loading={isSubmitting}
                      loadingText="جاري المعالجة..."
                      _hover={{ bg: "brand.700" }}
                    >
                      إتمام الدفع 🚀
                    </Button>

                    <Stack gap={2} pt={3}>
                      <Flex gap={2} align="center" justify="center">
                        <Text fontSize="sm" color="muted">🔒 دفع آمن ومشفر</Text>
                      </Flex>
                      <Text fontSize="xs" color="muted" textAlign="center">
                        بالضغط على "إتمام الدفع" أنت توافق على شروط الاستخدام وسياسة الخصوصية
                      </Text>
                    </Stack>
                  </Stack>
                </PremiumCard>

                {/* Trust Badges */}
                <PremiumCard p={4} variant="bordered">
                  <SimpleGrid columns={3} gap={4} textAlign="center">
                    <Stack gap={1}>
                      <Text fontSize="2xl">🛡️</Text>
                      <Text fontSize="xs" color="muted">ضمان استرداد</Text>
                    </Stack>
                    <Stack gap={1}>
                      <Text fontSize="2xl">🔐</Text>
                      <Text fontSize="xs" color="muted">دفع آمن</Text>
                    </Stack>
                    <Stack gap={1}>
                      <Text fontSize="2xl">💬</Text>
                      <Text fontSize="xs" color="muted">دعم 24/7</Text>
                    </Stack>
                  </SimpleGrid>
                </PremiumCard>
              </Stack>
            </SimpleGrid>
          </Stack>
        </form>
      </Container>
    </Box>
  );
}
