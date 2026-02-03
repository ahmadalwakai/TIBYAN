"use client";

import {
  Box,
  Grid,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
  Button,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import PremiumCard from "@/components/ui/PremiumCard";

interface Certificate {
  id: string;
  courseId: string;
  courseName: string;
  issuedAt: string;
  certificateNumber: string;
  instructorName: string;
}

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCertificates() {
      try {
        const res = await fetch("/api/student/certificates", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.ok) {
          setCertificates(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch certificates:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCertificates();
  }, []);

  if (loading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" color="spinner" />
        <Text mt={4} color="muted">جاري تحميل الشهادات...</Text>
      </Box>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <Box>
        <Heading size="xl" color="text" mb={2}>
          الشهادات 🏆
        </Heading>
        <Text color="muted">
          شهادات إتمام الدورات التي حصلت عليها
        </Text>
      </Box>

      {/* Certificates Grid */}
      {certificates.length === 0 ? (
        <PremiumCard variant="elevated">
          <Box textAlign="center" py={12}>
            <Text fontSize="5xl" mb={4}>🏆</Text>
            <Heading size="md" color="text" mb={2}>
              لم تحصل على شهادات بعد
            </Heading>
            <Text color="muted" mb={4}>
              أكمل دوراتك للحصول على شهادات معتمدة
            </Text>
          </Box>
        </PremiumCard>
      ) : (
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
          {certificates.map((cert) => (
            <PremiumCard
              key={cert.id}
              variant="gradient"
              _hover={{ transform: "translateY(-4px)" }}
              transition="all 0.3s"
            >
              <Box p={6} textAlign="center">
                <Text fontSize="5xl" mb={3}>🏆</Text>
                <Heading size="md" color="white" mb={2}>
                  شهادة إتمام
                </Heading>
                <Text color="whiteAlpha.900" fontWeight="700" fontSize="lg" mb={4}>
                  {cert.courseName}
                </Text>
                <VStack gap={2} color="whiteAlpha.800" fontSize="sm" mb={4}>
                  <Text>المدرس: {cert.instructorName}</Text>
                  <Text>تاريخ الإصدار: {cert.issuedAt}</Text>
                  <Text dir="ltr">رقم الشهادة: {cert.certificateNumber}</Text>
                </VStack>
                <HStack justify="center" gap={2}>
                  <Button size="sm" bg="#00FF2A" color="#000000">
                    📥 تحميل
                  </Button>
                  <Button size="sm" variant="outline" borderColor="#00FF2A" color="#00FF2A">
                    🔗 مشاركة
                  </Button>
                </HStack>
              </Box>
            </PremiumCard>
          ))}
        </Grid>
      )}
    </VStack>
  );
}
