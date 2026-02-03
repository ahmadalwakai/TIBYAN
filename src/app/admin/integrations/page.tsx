"use client";

import { Badge, Button, Flex, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import PremiumCard from "@/components/ui/PremiumCard";

interface Integration {
  id: string;
  name: string;
  nameAr: string;
  icon: string;
  category: string;
  status: "connected" | "disconnected" | "error";
  description: string;
  lastChecked?: string;
}

interface Stats {
  total: number;
  connected: number;
  disconnected: number;
  error: number;
}

const categoryLabels: Record<string, string> = {
  email: "📧 البريد الإلكتروني",
  payment: "💳 المدفوعات",
  storage: "☁️ التخزين",
  monitoring: "🔍 المراقبة",
  analytics: "📊 التحليلات",
  sms: "📱 الرسائل النصية",
  video: "🎥 الفيديو",
};

const statusConfig: Record<string, { label: string; color: string }> = {
  connected: { label: "متصل", color: "green" },
  disconnected: { label: "غير متصل", color: "gray" },
  error: { label: "خطأ", color: "red" },
};

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [, setByCategory] = useState<Record<string, Integration[]>>({});
  const [stats, setStats] = useState<Stats>({ total: 0, connected: 0, disconnected: 0, error: 0 });
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/integrations", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.ok) {
        setIntegrations(data.data.integrations);
        setByCategory(data.data.byCategory);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error("Error fetching integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const handleTest = async (integrationId: string) => {
    setTesting(integrationId);
    try {
      const response = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationId }),
      });
      const data = await response.json();
      if (data.ok) {
        alert(data.data.message);
        fetchIntegrations();
      }
    } catch (error) {
      console.error("Error testing integration:", error);
    } finally {
      setTesting(null);
    }
  };

  const filteredIntegrations = filter
    ? integrations.filter((i) => i.category === filter)
    : integrations;

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Text color="muted">جاري التحميل...</Text>
      </Flex>
    );
  }

  return (
    <Stack gap={10}>
      <Flex direction={{ base: "column", md: "row" }} gap={6} justify="space-between">
        <Stack gap={3}>
          <Badge
            bgGradient="linear(135deg, brand.500 0%, brand.600 100%)"
            color="white"
            px={3}
            py={1}
            borderRadius="badge"
            fontSize="xs"
            fontWeight="600"
            w="fit-content"
          >
            التكاملات الخارجية
          </Badge>
          <Heading size="2xl" bgGradient="linear(135deg, text 0%, brand.900 100%)" bgClip="text">
            إدارة التكاملات
          </Heading>
          <Text color="muted" fontSize="lg" lineHeight="1.7">
            إدارة الربط مع الخدمات الخارجية والأنظمة المتكاملة.
          </Text>
        </Stack>
      </Flex>

      {/* Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        <PremiumCard p={4} textAlign="center">
          <Text fontSize="3xl" fontWeight="bold">{stats.total}</Text>
          <Text color="muted" fontSize="sm">إجمالي التكاملات</Text>
        </PremiumCard>
        <PremiumCard p={4} textAlign="center">
          <Text fontSize="3xl" fontWeight="bold" color="green.500">{stats.connected}</Text>
          <Text color="muted" fontSize="sm">متصل</Text>
        </PremiumCard>
        <PremiumCard p={4} textAlign="center">
          <Text fontSize="3xl" fontWeight="bold" color="gray.500">{stats.disconnected}</Text>
          <Text color="muted" fontSize="sm">غير متصل</Text>
        </PremiumCard>
        <PremiumCard p={4} textAlign="center">
          <Text fontSize="3xl" fontWeight="bold" color="red.500">{stats.error}</Text>
          <Text color="muted" fontSize="sm">خطأ</Text>
        </PremiumCard>
      </SimpleGrid>

      {/* Category Filter */}
      <Flex gap={2} wrap="wrap">
        <Button
          size="sm"
          variant={filter === null ? "solid" : "outline"}
          onClick={() => setFilter(null)}
        >
          الكل
        </Button>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={filter === key ? "solid" : "outline"}
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
      </Flex>

      {/* Integrations Grid */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
        {filteredIntegrations.map((integration) => (
          <PremiumCard key={integration.id} variant="default" p={6}>
            <Stack gap={4}>
              <Flex justify="space-between" align="start">
                <Flex align="center" gap={2}>
                  <Text fontSize="2xl">{integration.icon}</Text>
                  <Stack gap={0}>
                    <Text fontWeight="700">{integration.nameAr}</Text>
                    <Text fontSize="sm" color="muted">{integration.name}</Text>
                  </Stack>
                </Flex>
                <Badge
                  colorPalette={statusConfig[integration.status].color}
                  px={2}
                  py={1}
                  borderRadius="md"
                >
                  {statusConfig[integration.status].label}
                </Badge>
              </Flex>

              <Text color="muted" fontSize="sm" lineHeight="1.7">
                {integration.description}
              </Text>

              <Flex gap={2}>
                <Button
                  size="sm"
                  variant="outline"
                  borderColor="outlineBorder"
                  borderWidth="2px"
                  color="outlineText"
                  flex={1}
                  _hover={{ bg: "brand.50", borderColor: "brand.600" }}
                  transition="all 0.3s ease"
                  onClick={() => handleTest(integration.id)}
                  loading={testing === integration.id}
                >
                  اختبار الاتصال
                </Button>
                {integration.status === "connected" && (
                  <Button
                    size="sm"
                    bg="green.500"
                    color="white"
                    _hover={{ bg: "green.600" }}
                  >
                    ✓
                  </Button>
                )}
              </Flex>

              {integration.lastChecked && (
                <Text fontSize="xs" color="muted" textAlign="center">
                  آخر فحص: {new Date(integration.lastChecked).toLocaleString("ar-SA")}
                </Text>
              )}
            </Stack>
          </PremiumCard>
        ))}
      </SimpleGrid>

      {/* Configuration Guide */}
      <PremiumCard p={6}>
        <Heading size="sm" mb={4}>⚙️ دليل الإعداد</Heading>
        <Text color="muted" lineHeight="1.8">
          لتفعيل أي تكامل، يجب إضافة متغيرات البيئة المناسبة في ملف <code>.env</code>:
        </Text>
        <Stack gap={2} mt={4} fontFamily="mono" fontSize="sm" bg="#0A0A0A" p={4} borderRadius="md">
          <Text># البريد الإلكتروني</Text>
          <Text>RESEND_API_KEY=re_xxxxx</Text>
          <Text mt={2}># المدفوعات</Text>
          <Text>STRIPE_SECRET_KEY=sk_xxxxx</Text>
          <Text>NEXT_PUBLIC_STRIPE_PUBLIC_KEY=pk_xxxxx</Text>
          <Text mt={2}># التخزين</Text>
          <Text>AWS_S3_BUCKET=bucket-name</Text>
          <Text>AWS_ACCESS_KEY_ID=xxxxx</Text>
          <Text>AWS_SECRET_ACCESS_KEY=xxxxx</Text>
        </Stack>
      </PremiumCard>
    </Stack>
  );
}
