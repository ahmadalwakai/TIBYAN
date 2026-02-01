"use client";

import {
  Box,
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

interface Payment {
  id: string;
  courseName: string;
  courseId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  transactionId: string | null;
  discountAmount: number;
  couponCode: string | null;
  paidAt: string | null;
  createdAt: string;
}

interface PaymentStats {
  totalPaid: number;
  pendingPayments: number;
  totalCourses: number;
  averagePerCourse: number;
}

export default function StudentPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await fetch("/api/student/payments");
        const data = await res.json();
        if (data.ok) {
          setPayments(data.data.payments);
          setStats(data.data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch payments:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchPayments();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; color: string; label: string }> = {
      COMPLETED: { bg: "green.100", color: "green.700", label: "مكتمل" },
      PENDING: { bg: "yellow.100", color: "yellow.700", label: "معلق" },
      PROCESSING: { bg: "blue.100", color: "blue.700", label: "قيد المعالجة" },
      FAILED: { bg: "red.100", color: "red.700", label: "فشل" },
      REFUNDED: { bg: "purple.100", color: "purple.700", label: "مسترد" },
      CANCELLED: { bg: "gray.100", color: "gray.700", label: "ملغي" },
    };
    const s = statusMap[status] || statusMap.PENDING;
    return <Badge bg={s.bg} color={s.color}>{s.label}</Badge>;
  };

  if (loading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" color="spinner" />
        <Text mt={4} color="muted">جاري تحميل المدفوعات...</Text>
      </Box>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <Box>
        <Heading size="xl" color="text" mb={2}>
          المدفوعات 💳
        </Heading>
        <Text color="muted">
          سجل جميع مدفوعاتك والفواتير
        </Text>
      </Box>

      {/* Stats */}
      <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={4}>
        <StatCard
          title="إجمالي المدفوع"
          value={`${stats?.totalPaid ?? 0} ر.س`}
          icon="💰"
          color="green.500"
        />
        <StatCard
          title="مدفوعات معلقة"
          value={`${stats?.pendingPayments ?? 0} ر.س`}
          icon="⏳"
          color="yellow.500"
        />
        <StatCard
          title="الدورات المدفوعة"
          value={stats?.totalCourses ?? 0}
          icon="📚"
          color="blue.500"
        />
        <StatCard
          title="متوسط سعر الدورة"
          value={`${stats?.averagePerCourse ?? 0} ر.س`}
          icon="📊"
          color="purple.500"
        />
      </Box>

      {/* Payments Table */}
      <PremiumCard variant="elevated">
        <Box p={6}>
          <Heading size="md" mb={4}>سجل المدفوعات</Heading>
          
          {payments.length === 0 ? (
            <Box textAlign="center" py={12}>
              <Text fontSize="5xl" mb={4}>💳</Text>
              <Text color="muted">لا توجد مدفوعات حتى الآن</Text>
            </Box>
          ) : (
            <Box overflowX="auto">
              <Table.Root variant="outline" size="sm">
                <Table.Header>
                  <Table.Row bg="backgroundAlt">
                    <Table.ColumnHeader>الدورة</Table.ColumnHeader>
                    <Table.ColumnHeader>المبلغ</Table.ColumnHeader>
                    <Table.ColumnHeader>الخصم</Table.ColumnHeader>
                    <Table.ColumnHeader>طريقة الدفع</Table.ColumnHeader>
                    <Table.ColumnHeader>الحالة</Table.ColumnHeader>
                    <Table.ColumnHeader>التاريخ</Table.ColumnHeader>
                    <Table.ColumnHeader>الإجراءات</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {payments.map((payment) => (
                    <Table.Row key={payment.id}>
                      <Table.Cell>
                        <Text fontWeight="600" fontSize="sm">
                          {payment.courseName}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text fontWeight="700" color="accent">
                          {payment.amount} {payment.currency}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        {payment.discountAmount > 0 ? (
                          <VStack gap={0} align="start">
                            <Text fontSize="sm" color="green.600">
                              -{payment.discountAmount} {payment.currency}
                            </Text>
                            {payment.couponCode && (
                              <Badge size="sm" bg="green.100" color="green.700">
                                {payment.couponCode}
                              </Badge>
                            )}
                          </VStack>
                        ) : (
                          <Text color="muted">-</Text>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Text fontSize="sm">
                          {payment.paymentMethod || "غير محدد"}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        {getStatusBadge(payment.status)}
                      </Table.Cell>
                      <Table.Cell>
                        <Text fontSize="sm" color="muted">
                          {payment.paidAt || payment.createdAt}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <HStack gap={2}>
                          <Button size="xs" variant="outline">
                            فاتورة
                          </Button>
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}
        </Box>
      </PremiumCard>
    </VStack>
  );
}
