"use client";

import { useEffect, useState } from "react";
import { Box, Container, Heading, Stack, Text, Badge } from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";

interface Announcement {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export default function MemberAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const res = await fetch("/api/member/announcements", { credentials: "include" });
        const json = await res.json();
        if (json.ok) {
          setAnnouncements(json.data.announcements ?? []);
        } else {
          setError(json.error || "تعذر تحميل الإعلانات");
        }
      } catch {
        setError("تعذر الاتصال بالخادم");
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  return (
    <Container maxW="4xl" px={{ base: 4, md: 6 }}>
      <Stack gap={6}>
        <Heading size="lg">إعلانات العضوية</Heading>
        <Text color="muted">آخر تحديثات فريق تبيان للأعضاء.</Text>

        {loading && <Text color="muted">جاري التحميل...</Text>}
        {error && <Text color="error">{error}</Text>}

        {!loading && !error && announcements.length === 0 && (
          <PremiumCard p={8} textAlign="center">
            <Text fontSize="3xl" mb={3}>
              📣
            </Text>
            <Text fontWeight="600">لا توجد إعلانات حالياً</Text>
            <Text color="muted" mt={2}>
              سيتم إشعارك عند توفر أي تحديث جديد.
            </Text>
          </PremiumCard>
        )}

        <Stack gap={4}>
          {announcements.map((announcement) => (
            <PremiumCard key={announcement.id} p={{ base: 5, md: 6 }}>
              <Stack gap={3}>
                <Stack direction={{ base: "column", md: "row" }} align={{ md: "center" }} gap={2}>
                  <Heading size="md">{announcement.title}</Heading>
                  <Badge bg="accentSubtle" color="accent" px={2} py={1} borderRadius="full">
                    {new Date(announcement.createdAt).toLocaleDateString("ar-SA")}
                  </Badge>
                </Stack>
                <Box color="muted" whiteSpace="pre-line">
                  {announcement.body}
                </Box>
              </Stack>
            </PremiumCard>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}
