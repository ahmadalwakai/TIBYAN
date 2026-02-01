"use client";

import { useEffect, useState } from "react";
import { Badge, Container, Heading, Stack, Text } from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";

interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: "OPEN" | "CLOSED";
  createdAt: string;
}

const statusLabels: Record<SupportTicket["status"], { label: string; color: string; bg: string }> = {
  OPEN: { label: "مفتوح", color: "green.500", bg: "green.500/15" },
  CLOSED: { label: "مغلق", color: "gray.500", bg: "gray.500/15" },
};

export default function MemberSupportTicketsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const res = await fetch("/api/member/support/tickets", { credentials: "include" });
        const json = await res.json();
        if (json.ok) {
          setTickets(json.data.tickets ?? []);
        } else {
          setError(json.error || "تعذر تحميل سجل الطلبات");
        }
      } catch {
        setError("تعذر الاتصال بالخادم");
      } finally {
        setLoading(false);
      }
    };

    loadTickets();
  }, []);

  return (
    <Container maxW="4xl" px={{ base: 4, md: 6 }}>
      <Stack gap={6}>
        <Heading size="lg">سجل طلبات الدعم</Heading>
        <Text color="muted">تابع حالة طلباتك السابقة مع فريق الدعم.</Text>

        {loading && <Text color="muted">جاري التحميل...</Text>}
        {error && <Text color="error">{error}</Text>}

        {!loading && !error && tickets.length === 0 && (
          <PremiumCard p={8} textAlign="center">
            <Text fontSize="3xl" mb={3}>
              🧾
            </Text>
            <Text fontWeight="600">لا توجد طلبات دعم بعد</Text>
            <Text color="muted" mt={2}>
              عند إرسال طلب جديد سيظهر هنا.
            </Text>
          </PremiumCard>
        )}

        <Stack gap={4}>
          {tickets.map((ticket) => {
            const status = statusLabels[ticket.status];
            return (
              <PremiumCard key={ticket.id} p={{ base: 5, md: 6 }}>
                <Stack gap={3}>
                  <Stack direction={{ base: "column", md: "row" }} align={{ md: "center" }} gap={2}>
                    <Heading size="md">{ticket.subject}</Heading>
                    <Badge bg={status.bg} color={status.color} px={2} py={1} borderRadius="full">
                      {status.label}
                    </Badge>
                  </Stack>
                  <Text color="muted" lineClamp={2}>
                    {ticket.message}
                  </Text>
                  <Text color="muted" fontSize="sm">
                    {new Date(ticket.createdAt).toLocaleDateString("ar-SA")}
                  </Text>
                </Stack>
              </PremiumCard>
            );
          })}
        </Stack>
      </Stack>
    </Container>
  );
}
