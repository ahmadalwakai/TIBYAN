"use client";

import { useState, type ComponentType } from "react";
import {
  Box,
  Button as ChakraButton,
  Container,
  Heading,
  Stack,
  Text,
  Textarea,
  Input,
  type ButtonProps,
} from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import PremiumCard from "@/components/ui/PremiumCard";
import { toaster } from "@/components/ui/toaster";

export default function MemberSupportPage() {
  const [formData, setFormData] = useState({ subject: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("/api/member/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });
      const json = await res.json();
      if (json.ok) {
        toaster.success({
          title: "تم استلام طلبك بنجاح",
          description: json.data.emailSent
            ? "سيقوم فريق الدعم بالرد قريباً."
            : "تم تسجيل الطلب. إذا لم يصلك رد، تواصل معنا مجدداً.",
        });
        setFormData({ subject: "", message: "" });
      } else {
        toaster.error({ title: json.error || "تعذر إرسال الطلب" });
      }
    } catch {
      toaster.error({ title: "حدث خطأ في الاتصال" });
    } finally {
      setSending(false);
    }
  };

  type SupportButtonProps = ButtonProps & { isDisabled?: boolean; isLoading?: boolean };
  const SupportButton = ChakraButton as unknown as ComponentType<SupportButtonProps>;

  return (
    <Container maxW="4xl" px={{ base: 4, md: 6 }}>
      <Stack gap={6}>
        <Heading size="lg">الدعم والمساعدة</Heading>
        <Text color="muted">
          أرسل لنا طلبك وسنقوم بالمتابعة معك بأقرب وقت ممكن.
        </Text>

        <PremiumCard variant="elevated" p={{ base: 6, md: 8 }}>
          <Box as="form" onSubmit={handleSubmit}>
            <Stack gap={4}>
              <Field label="الموضوع" required inputId="support-subject">
                <Input
                  id="support-subject"
                  value={formData.subject}
                  onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="موضوع الطلب"
                />
              </Field>

              <Field label="تفاصيل الطلب" required inputId="support-message">
                <Textarea
                  id="support-message"
                  value={formData.message}
                  onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                  placeholder="اكتب تفاصيل طلبك هنا"
                  minH="140px"
                />
              </Field>

              <SupportButton
                type="submit"
                bg="primary"
                color="primaryText"
                isDisabled={sending}
                isLoading={sending}
              >
                إرسال الطلب
              </SupportButton>
            </Stack>
          </Box>
        </PremiumCard>
      </Stack>
    </Container>
  );
}