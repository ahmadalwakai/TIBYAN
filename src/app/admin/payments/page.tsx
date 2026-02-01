"use client";

import { Badge, Box, Button, Flex, Heading, Input, SimpleGrid, Stack, Text, Spinner } from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";
import StatCard from "@/components/ui/StatCard";
import { useEffect, useState } from "react";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED" | "CANCELLED";
  paymentMethod: string | null;
  customerName: string | null;
  customerEmail: string | null;
  createdAt: string;
  paidAt: string | null;
  course: {
    id: string;
    title: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface Stats {
  total: number;
  pending: number;
  completed: number;
  totalRevenue: number;
}

const statusColors: Record<string, string> = {
  PENDING: "yellow",
  PROCESSING: "blue",
  COMPLETED: "green",
  FAILED: "red",
  REFUNDED: "purple",
  CANCELLED: "gray",
};

const statusLabels: Record<string, string> = {
  PENDING: "معلّقة",
  PROCESSING: "قيد المعالجة",
  COMPLETED: "مكتملة",
  FAILED: "فاشلة",
  REFUNDED: "مستردة",
  CANCELLED: "ملغاة",
};

const statusIcons: Record<string, string> = {
  PENDING: "⏳",
  PROCESSING: "🔄",
  COMPLETED: "✅",
  FAILED: "❌",
  REFUNDED: "↩️",
  CANCELLED: "🚫",
};

const methodLabels: Record<string, string> = {
  cash: "نقدًا",
  bank_transfer: "تحويل بنكي",
  stripe: "بطاقة ائتمان",
  paypal: "PayPal",
  tap: "Tap",
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, completed: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/admin/payments?${params}`);
      const data = await response.json();

      if (data.ok) {
        setPayments(data.data.payments);
        setStats(data.data.stats);
      } else {
        setError(data.error);
      }
    } catch {
      setError("حدث خطأ في جلب المدفوعات");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      const response = await fetch(`/api/payments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (data.ok) {
        fetchPayments();
      } else {
        setError(data.error);
      }
    } catch {
      setError("حدث خطأ في تحديث الدفعة");
    } finally {
      setUpdating(null);
    }
  };

  const filteredPayments = payments.filter((p) =>
    (p.customerName?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (p.customerEmail?.toLowerCase() || "").includes(search.toLowerCase()) ||
    p.course.title.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  return (
    <Stack gap={8}>
      {/* Header */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
        <Stack gap={1}>
          <Heading size="lg" color="text">المدفوعات والفواتير 💳</Heading>
          <Text color="muted">متابعة جميع عمليات الدفع والتسجيلات</Text>
        </Stack>
      </Flex>

      {/* Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        <StatCard>
          <Stack gap={1}>
            <Text fontSize="sm" color="muted">إجمالي المعاملات</Text>
            <Text fontSize="2xl" fontWeight="700" color="text">{stats.total}</Text>
          </Stack>
        </StatCard>
        <StatCard>
          <Stack gap={1}>
            <Text fontSize="sm" color="muted">معلّقة</Text>
            <Text fontSize="2xl" fontWeight="700" color="yellow.500">{stats.pending}</Text>
          </Stack>
        </StatCard>
        <StatCard>
          <Stack gap={1}>
            <Text fontSize="sm" color="muted">مكتملة</Text>
            <Text fontSize="2xl" fontWeight="700" color="green.500">{stats.completed}</Text>
          </Stack>
        </StatCard>
        <StatCard>
          <Stack gap={1}>
            <Text fontSize="sm" color="muted">إجمالي الإيرادات</Text>
            <Text fontSize="2xl" fontWeight="700" color="accent">
              {formatCurrency(stats.totalRevenue, "SAR")}
            </Text>
          </Stack>
        </StatCard>
      </SimpleGrid>

      {/* Filters */}
      <PremiumCard p={4}>
        <Flex gap={4} wrap="wrap">
          <Input
            placeholder="🔍 البحث بالاسم، البريد، أو الدورة..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxW="300px"
            bg="white"
          />
          <Flex gap={2} wrap="wrap">
            <Button
              size="sm"
              variant={statusFilter === "" ? "solid" : "outline"}
              colorPalette="brand"
              onClick={() => setStatusFilter("")}
            >
              الكل
            </Button>
            {["PENDING", "COMPLETED", "FAILED", "REFUNDED"].map((status) => (
              <Button
                key={status}
                size="sm"
                variant={statusFilter === status ? "solid" : "outline"}
                colorPalette={statusColors[status]}
                onClick={() => setStatusFilter(status)}
              >
                {statusIcons[status]} {statusLabels[status]}
              </Button>
            ))}
          </Flex>
        </Flex>
      </PremiumCard>

      {/* Error */}
      {error && (
        <PremiumCard p={4} bg="red.50">
          <Text color="red.600">{error}</Text>
        </PremiumCard>
      )}

      {/* Payments List */}
      {loading ? (
        <Flex justify="center" py={10}>
          <Spinner size="xl" color="spinner" />
        </Flex>
      ) : filteredPayments.length === 0 ? (
        <PremiumCard p={8}>
          <Text textAlign="center" color="muted">
            لا توجد مدفوعات {statusFilter && `بحالة "${statusLabels[statusFilter]}"`}
          </Text>
        </PremiumCard>
      ) : (
        <Stack gap={4}>
          {filteredPayments.map((payment) => (
            <PremiumCard key={payment.id} p={5}>
              <Flex
                direction={{ base: "column", md: "row" }}
                justify="space-between"
                align={{ base: "start", md: "center" }}
                gap={4}
              >
                {/* Payment Info */}
                <Stack gap={2} flex={1}>
                  <Flex align="center" gap={3}>
                    <Text fontWeight="700" fontSize="lg" color="text">
                      {payment.course.title}
                    </Text>
                    <Badge colorPalette={statusColors[payment.status]} fontSize="xs">
                      {statusIcons[payment.status]} {statusLabels[payment.status]}
                    </Badge>
                  </Flex>
                  <Flex gap={4} wrap="wrap" fontSize="sm" color="muted">
                    <Text>👤 {payment.customerName || payment.user.name}</Text>
                    <Text>📧 {payment.customerEmail || payment.user.email}</Text>
                    <Text>📅 {formatDate(payment.createdAt)}</Text>
                    {payment.paymentMethod && (
                      <Text>💳 {methodLabels[payment.paymentMethod] || payment.paymentMethod}</Text>
                    )}
                  </Flex>
                </Stack>

                {/* Amount & Actions */}
                <Flex align="center" gap={4}>
                  <Stack gap={0} align="end">
                    <Text fontSize="xl" fontWeight="700" color="accent">
                      {formatCurrency(payment.amount, payment.currency)}
                    </Text>
                    {payment.paidAt && (
                      <Text fontSize="xs" color="green.500">
                        تم الدفع: {formatDate(payment.paidAt)}
                      </Text>
                    )}
                  </Stack>

                  {payment.status === "PENDING" && (
                    <Flex gap={2}>
                      <Button
                        size="sm"
                        colorPalette="green"
                        onClick={() => updateStatus(payment.id, "COMPLETED")}
                        disabled={updating === payment.id}
                      >
                        ✅ تأكيد
                      </Button>
                      <Button
                        size="sm"
                        colorPalette="red"
                        variant="outline"
                        onClick={() => updateStatus(payment.id, "CANCELLED")}
                        disabled={updating === payment.id}
                      >
                        إلغاء
                      </Button>
                    </Flex>
                  )}
                  {payment.status === "COMPLETED" && (
                    <Button
                      size="sm"
                      colorPalette="purple"
                      variant="outline"
                      onClick={() => updateStatus(payment.id, "REFUNDED")}
                      disabled={updating === payment.id}
                    >
                      ↩️ استرداد
                    </Button>
                  )}
                </Flex>
              </Flex>
            </PremiumCard>
          ))}
        </Stack>
      )}
    </Stack>
  );
}
