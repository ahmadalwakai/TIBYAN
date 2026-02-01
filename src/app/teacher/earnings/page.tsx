"use client";

import {
  Box,
  Grid,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Button,
  Table,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import PremiumCard from "@/components/ui/PremiumCard";
import StatCard from "@/components/ui/StatCard";

interface Earning {
  id: string;
  courseName: string;
  studentName: string;
  amount: number;
  platformFee: number;
  netAmount: number;
  status: "PENDING" | "COMPLETED" | "WITHDRAWN";
  paidAt: string | null;
  createdAt: string;
}

interface EarningStats {
  totalEarnings: number;
  pendingEarnings: number;
  withdrawnEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  platformFees: number;
}

interface PayoutInfo {
  nextPayoutDate: string;
  minimumPayout: number;
  payoutMethod: string | null;
}

export default function TeacherEarningsPage() {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [stats, setStats] = useState<EarningStats | null>(null);
  const [payoutInfo, setPayoutInfo] = useState<PayoutInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEarnings() {
      try {
        const res = await fetch("/api/teacher/earnings", {
          credentials: "include",
        });
        const data = await res.json();
        if (data.ok) {
          setEarnings(data.data.earnings);
          setStats(data.data.stats);
          setPayoutInfo(data.data.payoutInfo);
        }
      } catch (error) {
        console.error("Failed to fetch earnings:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchEarnings();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; color: string; label: string }> = {
      PENDING: { bg: "yellow.100", color: "yellow.700", label: "معلق" },
      COMPLETED: { bg: "green.100", color: "green.700", label: "مكتمل" },
      WITHDRAWN: { bg: "blue.100", color: "blue.700", label: "تم السحب" },
    };
    const s = statusMap[status] || statusMap.PENDING;
    return <Badge bg={s.bg} color={s.color}>{s.label}</Badge>;
  };

  if (loading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" color="spinner" />
        <Text mt={4} color="muted">جاري تحميل الأرباح...</Text>
      </Box>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between" flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="xl" color="text" mb={2}>
            الأرباح 💰
          </Heading>
          <Text color="muted">
            تتبع أرباحك من مبيعات الدورات
          </Text>
        </Box>
        <Button
          colorPalette="green"
          disabled={!stats || stats.pendingEarnings < (payoutInfo?.minimumPayout || 100)}
        >
          💸 طلب سحب
        </Button>
      </HStack>

      {/* Stats */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={4}>
        <StatCard
          title="إجمالي الأرباح"
          value={`${stats?.totalEarnings ?? 0} ر.س`}
          icon="💰"
          color="green.500"
        />
        <StatCard
          title="أرباح معلقة"
          value={`${stats?.pendingEarnings ?? 0} ر.س`}
          icon="⏳"
          color="yellow.500"
        />
        <StatCard
          title="أرباح هذا الشهر"
          value={`${stats?.thisMonthEarnings ?? 0} ر.س`}
          icon="📈"
          color="blue.500"
        />
        <StatCard
          title="أرباح الشهر الماضي"
          value={`${stats?.lastMonthEarnings ?? 0} ر.س`}
          icon="📅"
          color="purple.500"
        />
        <StatCard
          title="تم سحبها"
          value={`${stats?.withdrawnEarnings ?? 0} ر.س`}
          icon="💸"
          color="teal.500"
        />
        <StatCard
          title="رسوم المنصة"
          value={`${stats?.platformFees ?? 0} ر.س`}
          icon="🏷️"
          color="gray.500"
        />
      </Grid>

      {/* Payout Info */}
      <PremiumCard variant="elevated">
        <Box p={6}>
          <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
            <Box>
              <Text color="muted" fontSize="sm">موعد الصرف القادم</Text>
              <Text fontWeight="700" fontSize="lg">{payoutInfo?.nextPayoutDate || "غير محدد"}</Text>
            </Box>
            <Box>
              <Text color="muted" fontSize="sm">الحد الأدنى للسحب</Text>
              <Text fontWeight="700" fontSize="lg">{payoutInfo?.minimumPayout || 100} ر.س</Text>
            </Box>
            <Box>
              <Text color="muted" fontSize="sm">طريقة الدفع</Text>
              <HStack>
                <Text fontWeight="700" fontSize="lg">
                  {payoutInfo?.payoutMethod || "غير محدد"}
                </Text>
                {!payoutInfo?.payoutMethod && (
                  <Button size="xs" variant="outline">
                    إضافة
                  </Button>
                )}
              </HStack>
            </Box>
          </Grid>
        </Box>
      </PremiumCard>

      {/* Earnings Table */}
      <PremiumCard variant="elevated">
        <Box p={6}>
          <Heading size="md" mb={4}>سجل الأرباح</Heading>
          
          {earnings.length === 0 ? (
            <Box textAlign="center" py={12}>
              <Text fontSize="5xl" mb={4}>💰</Text>
              <Heading size="md" color="text" mb={2}>
                لا توجد أرباح بعد
              </Heading>
              <Text color="muted">
                ستظهر هنا أرباحك عندما يشتري الطلاب دوراتك
              </Text>
            </Box>
          ) : (
            <Box overflowX="auto">
              <Table.Root variant="outline" size="sm">
                <Table.Header>
                  <Table.Row bg="backgroundAlt">
                    <Table.ColumnHeader>الدورة</Table.ColumnHeader>
                    <Table.ColumnHeader>الطالب</Table.ColumnHeader>
                    <Table.ColumnHeader>المبلغ الإجمالي</Table.ColumnHeader>
                    <Table.ColumnHeader>رسوم المنصة</Table.ColumnHeader>
                    <Table.ColumnHeader>صافي الربح</Table.ColumnHeader>
                    <Table.ColumnHeader>الحالة</Table.ColumnHeader>
                    <Table.ColumnHeader>التاريخ</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {earnings.map((earning) => (
                    <Table.Row key={earning.id}>
                      <Table.Cell>
                        <Text fontWeight="600" fontSize="sm" lineClamp={1}>
                          {earning.courseName}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text fontSize="sm">{earning.studentName}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text fontWeight="600">{earning.amount} ر.س</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text color="red.600" fontSize="sm">
                          -{earning.platformFee} ر.س
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text fontWeight="700" color="green.600">
                          {earning.netAmount} ر.س
                        </Text>
                      </Table.Cell>
                      <Table.Cell>{getStatusBadge(earning.status)}</Table.Cell>
                      <Table.Cell>
                        <Text fontSize="sm" color="muted">
                          {earning.createdAt}
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}
        </Box>
      </PremiumCard>

      {/* Info Box */}
      <Box p={4} bg="blue.50" borderRadius="card">
        <Heading size="sm" color="blue.800" mb={2}>ℹ️ معلومات هامة</Heading>
        <VStack gap={2} align="start" fontSize="sm" color="blue.700">
          <Text>• نسبة المنصة: 20% من سعر الدورة</Text>
          <Text>• يتم صرف الأرباح في اليوم الأول من كل شهر</Text>
          <Text>• الحد الأدنى للسحب: 100 ر.س</Text>
          <Text>• يمكنك إضافة حساب بنكي لاستلام الأرباح</Text>
        </VStack>
      </Box>
    </VStack>
  );
}
