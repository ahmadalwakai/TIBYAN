"use client";

import {
  Badge,
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  Textarea,
  SimpleGrid,
  NativeSelect,
} from "@chakra-ui/react";
import { useState } from "react";
import Link from "next/link";
import PremiumCard from "@/components/ui/PremiumCard";
import { Checkbox } from "@/components/ui/Checkbox";

export default function TeacherApplicationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<
    | {
        type: "success" | "error";
        title: string;
        description: string;
      }
    | null
  >(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    nationality: "",
    gender: "",
    degree: "",
    fieldOfStudy: "",
    university: "",
    graduationYear: "",
    yearsExperience: "",
    subjectsToTeach: "",
    quranMemorization: "",
    tajweedLevel: "",
    onlineExperience: "",
    availableDays: "",
    hoursPerWeek: "",
    startDate: "",
    motivation: "",
    expectedSalary: "",
    agreeTerms: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.email || !formData.phone || !formData.subjectsToTeach) {
      setNotice({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        type: "error",
      });
      return;
    }

    if (!formData.agreeTerms) {
      setNotice({
        title: "خطأ",
        description: "يجب الموافقة على الشروط والأحكام",
        type: "error",
      });
      return;
    }
    
    setIsSubmitting(true);
    setNotice(null);
    
    try {
      const response = await fetch("/api/instructors/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (data.ok) {
        setNotice({
          title: "تم إرسال الطلب بنجاح! 🎉",
          description: data.data.message,
          type: "success",
        });
        
        // Reset form
        setFormData({
          fullName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        nationality: "",
        gender: "",
        degree: "",
        fieldOfStudy: "",
        university: "",
        graduationYear: "",
        yearsExperience: "",
        subjectsToTeach: "",
        quranMemorization: "",
        tajweedLevel: "",
        onlineExperience: "",
        availableDays: "",
        hoursPerWeek: "",
        startDate: "",
        motivation: "",
        expectedSalary: "",
        agreeTerms: false,
      });
      } else {
        setNotice({
          title: "حدث خطأ",
          description: data.error || "يرجى المحاولة مرة أخرى",
          type: "error",
        });
      }
    } catch {
      setNotice({
        title: "حدث خطأ",
        description: "يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box as="main" bg="background" minH="100vh">
      <Container maxW="5xl" py={{ base: 12, md: 20 }} px={{ base: 6, md: 8 }}>
        <form onSubmit={handleSubmit}>
          <Stack gap={8}>
            {/* Header */}
            <Stack gap={4} textAlign="center">
              <Badge
                bg="brand.900"
                color="white"
                px={4}
                py={2}
                borderRadius="badge"
                fontSize="sm"
                fontWeight="700"
                w="fit-content"
                mx="auto"
              >
                📝 طلب الانضمام
              </Badge>
              <Heading size={{ base: "xl", md: "2xl" }} color="text">
                انضم كمعلم في منصة تبيان
              </Heading>
              <Text color="muted" fontSize="md">
                املأ النموذج أدناه وسنتواصل معك قريباً
              </Text>
            </Stack>

            {notice && (
              <PremiumCard
                p={4}
                bg={notice.type === "success" ? "green.50" : "red.50"}
                borderWidth="1px"
                borderColor={notice.type === "success" ? "green.200" : "red.200"}
              >
                <Stack gap={1} textAlign="center">
                  <Text fontWeight="800" color="text">
                    {notice.title}
                  </Text>
                  <Text color="muted">{notice.description}</Text>
                </Stack>
              </PremiumCard>
            )}

            {/* Personal Information */}
            <PremiumCard p={{ base: 6, md: 8 }}>
              <Stack gap={6}>
                <Heading size="lg" color="text">المعلومات الشخصية</Heading>

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                  <Box>
                    <Text mb={2} fontWeight="600" color="text">
                      الاسم الكامل <Text as="span" color="red.500">*</Text>
                    </Text>
                    <Input
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="أدخل اسمك الكامل"
                      size="lg"
                      required
                    />
                  </Box>

                  <Box>
                    <Text mb={2} fontWeight="600" color="text">
                      البريد الإلكتروني <Text as="span" color="red.500">*</Text>
                    </Text>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="example@email.com"
                      size="lg"
                      required
                    />
                  </Box>

                  <Box>
                    <Text mb={2} fontWeight="600" color="text">
                      رقم الهاتف <Text as="span" color="red.500">*</Text>
                    </Text>
                    <Input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+966 5X XXX XXXX"
                      size="lg"
                      required
                    />
                  </Box>

                  <Box>
                    <Text mb={2} fontWeight="600" color="text">تاريخ الميلاد</Text>
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      size="lg"
                    />
                  </Box>

                  <Box>
                    <Text mb={2} fontWeight="600" color="text">الجنسية</Text>
                    <Input
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      placeholder="مثال: السعودية"
                      size="lg"
                    />
                  </Box>

                  <Box>
                    <Text mb={2} fontWeight="600" color="text">الجنس</Text>
                    <NativeSelect.Root size="lg">
                      <NativeSelect.Field
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="">اختر</option>
                        <option value="male">ذكر</option>
                        <option value="female">أنثى</option>
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                  </Box>
                </SimpleGrid>
              </Stack>
            </PremiumCard>

            {/* Educational Background */}
            <PremiumCard p={{ base: 6, md: 8 }}>
              <Stack gap={6}>
                <Heading size="lg" color="text">المؤهلات الدراسية</Heading>

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                  <Box>
                    <Text mb={2} fontWeight="600" color="text">أعلى مؤهل دراسي</Text>
                    <NativeSelect.Root size="lg">
                      <NativeSelect.Field
                        value={formData.degree}
                        onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                      >
                        <option value="">اختر</option>
                        <option value="bachelor">بكالوريوس</option>
                        <option value="master">ماجستير</option>
                        <option value="phd">دكتوراه</option>
                        <option value="diploma">دبلوم</option>
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                  </Box>

                  <Box>
                    <Text mb={2} fontWeight="600" color="text">التخصص</Text>
                    <Input
                      value={formData.fieldOfStudy}
                      onChange={(e) => setFormData({ ...formData, fieldOfStudy: e.target.value })}
                      placeholder="مثال: الشريعة الإسلامية"
                      size="lg"
                    />
                  </Box>

                  <Box>
                    <Text mb={2} fontWeight="600" color="text">اسم الجامعة</Text>
                    <Input
                      value={formData.university}
                      onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                      placeholder="مثال: جامعة الإمام"
                      size="lg"
                    />
                  </Box>

                  <Box>
                    <Text mb={2} fontWeight="600" color="text">سنة التخرج</Text>
                    <Input
                      type="number"
                      value={formData.graduationYear}
                      onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                      placeholder="2020"
                      min="1970"
                      max="2026"
                      size="lg"
                    />
                  </Box>
                </SimpleGrid>
              </Stack>
            </PremiumCard>

            {/* Teaching Experience */}
            <PremiumCard p={{ base: 6, md: 8 }}>
              <Stack gap={6}>
                <Heading size="lg" color="text">الخبرة التدريسية</Heading>

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                  <Box>
                    <Text mb={2} fontWeight="600" color="text">سنوات الخبرة</Text>
                    <NativeSelect.Root size="lg">
                      <NativeSelect.Field
                        value={formData.yearsExperience}
                        onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                      >
                        <option value="">اختر</option>
                        <option value="0-1">أقل من سنة</option>
                        <option value="1-3">1-3 سنوات</option>
                        <option value="3-5">3-5 سنوات</option>
                        <option value="5-10">5-10 سنوات</option>
                        <option value="10+">أكثر من 10 سنوات</option>
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                  </Box>

                  <Box>
                    <Text mb={2} fontWeight="600" color="text">المواد التي تدرسها</Text>
                    <Input
                      value={formData.subjectsToTeach}
                      onChange={(e) => setFormData({ ...formData, subjectsToTeach: e.target.value })}
                      placeholder="مثال: القرآن، التجويد، الفقه"
                      size="lg"
                    />
                  </Box>
                </SimpleGrid>

                <Box>
                  <Text mb={2} fontWeight="600" color="text">حفظ القرآن الكريم</Text>
                  <NativeSelect.Root size="lg">
                    <NativeSelect.Field
                      value={formData.quranMemorization}
                      onChange={(e) => setFormData({ ...formData, quranMemorization: e.target.value })}
                    >
                      <option value="">اختر</option>
                      <option value="complete">حفظ كامل</option>
                      <option value="20+">أكثر من 20 جزء</option>
                      <option value="10-20">10-20 جزء</option>
                      <option value="5-10">5-10 أجزاء</option>
                      <option value="less">أقل من 5 أجزاء</option>
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Box>

                <Box>
                  <Text mb={2} fontWeight="600" color="text">مستوى التجويد</Text>
                  <NativeSelect.Root size="lg">
                    <NativeSelect.Field
                      value={formData.tajweedLevel}
                      onChange={(e) => setFormData({ ...formData, tajweedLevel: e.target.value })}
                    >
                      <option value="">اختر</option>
                      <option value="expert">متقن ومتخصص</option>
                      <option value="advanced">متقدم</option>
                      <option value="intermediate">متوسط</option>
                      <option value="basic">أساسي</option>
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Box>
              </Stack>
            </PremiumCard>

            {/* Online Teaching */}
            <PremiumCard p={{ base: 6, md: 8 }}>
              <Stack gap={6}>
                <Heading size="lg" color="text">التدريس عن بُعد</Heading>

                <Box>
                  <Text mb={2} fontWeight="600" color="text">خبرة التدريس عن بُعد</Text>
                  <NativeSelect.Root size="lg">
                    <NativeSelect.Field
                      value={formData.onlineExperience}
                      onChange={(e) => setFormData({ ...formData, onlineExperience: e.target.value })}
                    >
                      <option value="">اختر</option>
                      <option value="extensive">واسعة (أكثر من 3 سنوات)</option>
                      <option value="moderate">متوسطة (1-3 سنوات)</option>
                      <option value="some">بعض الخبرة</option>
                      <option value="none">لا توجد خبرة</option>
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Box>
              </Stack>
            </PremiumCard>

            {/* Availability */}
            <PremiumCard p={{ base: 6, md: 8 }}>
              <Stack gap={6}>
                <Heading size="lg" color="text">الأوقات المتاحة</Heading>

                <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
                  <Box>
                    <Text mb={2} fontWeight="600" color="text">الأيام المتاحة</Text>
                    <Input
                      value={formData.availableDays}
                      onChange={(e) => setFormData({ ...formData, availableDays: e.target.value })}
                      placeholder="مثال: السبت، الأحد، الاثنين"
                      size="lg"
                    />
                  </Box>

                  <Box>
                    <Text mb={2} fontWeight="600" color="text">الساعات الأسبوعية</Text>
                    <NativeSelect.Root size="lg">
                      <NativeSelect.Field
                        value={formData.hoursPerWeek}
                        onChange={(e) => setFormData({ ...formData, hoursPerWeek: e.target.value })}
                      >
                        <option value="">اختر</option>
                        <option value="full">دوام كامل (30+ ساعة)</option>
                        <option value="20-30">20-30 ساعة</option>
                        <option value="10-20">10-20 ساعة</option>
                        <option value="5-10">5-10 ساعات</option>
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                  </Box>

                  <Box>
                    <Text mb={2} fontWeight="600" color="text">تاريخ البدء المتوقع</Text>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      size="lg"
                    />
                  </Box>
                </SimpleGrid>
              </Stack>
            </PremiumCard>

            {/* Additional Information */}
            <PremiumCard p={{ base: 6, md: 8 }}>
              <Stack gap={6}>
                <Heading size="lg" color="text">معلومات إضافية</Heading>

                <Box>
                  <Text mb={2} fontWeight="600" color="text">لماذا تريد الانضمام؟</Text>
                  <Textarea
                    value={formData.motivation}
                    onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                    placeholder="اشرح دوافعك للانضمام إلى منصة تبيان"
                    rows={5}
                    size="lg"
                  />
                </Box>

                <Box>
                  <Text mb={2} fontWeight="600" color="text">الراتب المتوقع (ريال/ساعة)</Text>
                  <Input
                    type="number"
                    value={formData.expectedSalary}
                    onChange={(e) => setFormData({ ...formData, expectedSalary: e.target.value })}
                    placeholder="150"
                    size="lg"
                  />
                </Box>
              </Stack>
            </PremiumCard>

            {/* Terms */}
            <PremiumCard p={{ base: 6, md: 8 }}>
              <Stack gap={4}>
                <Checkbox
                  checked={formData.agreeTerms}
                  onCheckedChange={(e) => setFormData({ ...formData, agreeTerms: !!e.checked })}
                  size="lg"
                >
                  <Text fontSize="md" color="text">
                    أوافق على الشروط والأحكام الخاصة بمنصة تبيان <Text as="span" color="red.500">*</Text>
                  </Text>
                </Checkbox>
              </Stack>
            </PremiumCard>

            {/* Submit Button */}
            <Stack gap={4}>
              <Button
                type="submit"
                bg="brand.900"
                color="white"
                size="xl"
                fontSize="lg"
                fontWeight="700"
                w="100%"
                py={7}
                loading={isSubmitting}
                _hover={{ bg: "brand.700" }}
              >
                {isSubmitting ? "جاري الإرسال..." : "إرسال الطلب 🚀"}
              </Button>
              <Link href="/instructors">
                <Button
                  variant="ghost"
                  size="lg"
                  w="100%"
                >
                  رجوع
                </Button>
              </Link>
              <Text fontSize="sm" color="muted" textAlign="center">
                سنراجع طلبك ونتواصل معك خلال 3-5 أيام عمل
              </Text>
            </Stack>
          </Stack>
        </form>
      </Container>
    </Box>
  );
}
