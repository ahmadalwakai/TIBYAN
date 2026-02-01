"use client";

import { Badge, Button, Flex, Heading, SimpleGrid, Stack, Text, Table } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import PremiumCard from "@/components/ui/PremiumCard";

interface OverviewData {
  users: { total: number; new: number; growthRate: string };
  courses: { total: number; published: number; publishRate: string };
  enrollments: { total: number; new: number; averageCompletionRate: string };
  revenue: { total: number; period: number; currency: string };
}

interface RevenueData {
  total: { amount: number; transactions: number };
  period: { amount: number; transactions: number };
  byStatus: { status: string; count: number; amount: number }[];
  recentPayments: {
    id: string;
    amount: number;
    status: string;
    customerName: string | null;
    course: { title: string };
    createdAt: string;
  }[];
  currency: string;
}

interface CoursesData {
  byStatus: { status: string; count: number }[];
  byLevel: { level: string; count: number }[];
  topCourses: { id: string; title: string; enrollments: number }[];
  averageRating: string;
}

type ReportType = "overview" | "revenue" | "courses" | "users" | "engagement";

const reportTypes: { key: ReportType; label: string; icon: string }[] = [
  { key: "overview", label: "نظرة عامة", icon: "📊" },
  { key: "revenue", label: "الإيرادات", icon: "💰" },
  { key: "courses", label: "الدورات", icon: "📚" },
  { key: "users", label: "المستخدمين", icon: "👥" },
  { key: "engagement", label: "التفاعل", icon: "⭐" },
];

const periodOptions = [
  { value: "7", label: "آخر 7 أيام" },
  { value: "30", label: "آخر 30 يوم" },
  { value: "90", label: "آخر 3 أشهر" },
  { value: "365", label: "آخر سنة" },
];

const statusLabels: Record<string, string> = {
  PENDING: "قيد الانتظار",
  PROCESSING: "قيد المعالجة",
  COMPLETED: "مكتمل",
  FAILED: "فاشل",
  REFUNDED: "مسترد",
  CANCELLED: "ملغي",
  DRAFT: "مسودة",
  REVIEW: "مراجعة",
  PUBLISHED: "منشور",
  ARCHIVED: "مؤرشف",
};

const levelLabels: Record<string, string> = {
  BEGINNER: "مبتدئ",
  INTERMEDIATE: "متوسط",
  ADVANCED: "متقدم",
};

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("overview");
  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OverviewData | RevenueData | CoursesData | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/reports?type=${reportType}&period=${period}`, {
        credentials: "include",
      });
      const result = await response.json();
      if (result.ok) {
        setData(result.data.metrics);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, period]);

  const formatCurrency = (amount: number, currency: string = "EUR") => {
    return new Intl.NumberFormat("ar-SA", { style: "currency", currency }).format(amount);
  };

  const renderOverview = (metrics: OverviewData) => (
    <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap={6}>
      <PremiumCard p={6} textAlign="center">
        <Text fontSize="3xl">👥</Text>
        <Text fontSize="3xl" fontWeight="bold" mt={2}>{metrics.users.total}</Text>
        <Text color="muted">إجمالي المستخدمين</Text>
        <Badge colorPalette="green" mt={2}>+{metrics.users.new} جديد</Badge>
      </PremiumCard>

      <PremiumCard p={6} textAlign="center">
        <Text fontSize="3xl">📚</Text>
        <Text fontSize="3xl" fontWeight="bold" mt={2}>{metrics.courses.total}</Text>
        <Text color="muted">إجمالي الدورات</Text>
        <Badge colorPalette="blue" mt={2}>{metrics.courses.published} منشور</Badge>
      </PremiumCard>

      <PremiumCard p={6} textAlign="center">
        <Text fontSize="3xl">🎓</Text>
        <Text fontSize="3xl" fontWeight="bold" mt={2}>{metrics.enrollments.total}</Text>
        <Text color="muted">إجمالي التسجيلات</Text>
        <Badge colorPalette="purple" mt={2}>+{metrics.enrollments.new} جديد</Badge>
      </PremiumCard>

      <PremiumCard p={6} textAlign="center">
        <Text fontSize="3xl">💰</Text>
        <Text fontSize="3xl" fontWeight="bold" mt={2}>
          {formatCurrency(metrics.revenue.total, metrics.revenue.currency)}
        </Text>
        <Text color="muted">إجمالي الإيرادات</Text>
        <Badge colorPalette="green" mt={2}>
          +{formatCurrency(metrics.revenue.period, metrics.revenue.currency)}
        </Badge>
      </PremiumCard>

      <PremiumCard p={6} gridColumn={{ md: "span 2" }}>
        <Heading size="sm" mb={4}>📈 معدلات النمو</Heading>
        <Stack gap={3}>
          <Flex justify="space-between">
            <Text>معدل نمو المستخدمين</Text>
            <Text fontWeight="bold" color="green.500">{metrics.users.growthRate}%</Text>
          </Flex>
          <Flex justify="space-between">
            <Text>معدل نشر الدورات</Text>
            <Text fontWeight="bold" color="blue.500">{metrics.courses.publishRate}%</Text>
          </Flex>
          <Flex justify="space-between">
            <Text>متوسط إكمال الدورات</Text>
            <Text fontWeight="bold" color="purple.500">{metrics.enrollments.averageCompletionRate}%</Text>
          </Flex>
        </Stack>
      </PremiumCard>
    </SimpleGrid>
  );

  const renderRevenue = (metrics: RevenueData) => (
    <Stack gap={6}>
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        <PremiumCard p={6}>
          <Heading size="sm" mb={4}>💵 ملخص الإيرادات</Heading>
          <Stack gap={3}>
            <Flex justify="space-between">
              <Text>إجمالي الإيرادات</Text>
              <Text fontWeight="bold">{formatCurrency(metrics.total.amount, metrics.currency)}</Text>
            </Flex>
            <Flex justify="space-between">
              <Text>عدد المعاملات</Text>
              <Text fontWeight="bold">{metrics.total.transactions}</Text>
            </Flex>
            <Flex justify="space-between" borderTop="1px solid" borderColor="gray.100" pt={2}>
              <Text>إيرادات الفترة</Text>
              <Text fontWeight="bold" color="green.500">{formatCurrency(metrics.period.amount, metrics.currency)}</Text>
            </Flex>
          </Stack>
        </PremiumCard>

        <PremiumCard p={6}>
          <Heading size="sm" mb={4}>📊 حسب الحالة</Heading>
          <Stack gap={2}>
            {metrics.byStatus.map((item) => (
              <Flex key={item.status} justify="space-between">
                <Text>{statusLabels[item.status] || item.status}</Text>
                <Text fontWeight="bold">{item.count} ({formatCurrency(item.amount, metrics.currency)})</Text>
              </Flex>
            ))}
          </Stack>
        </PremiumCard>
      </SimpleGrid>

      <PremiumCard p={6}>
        <Heading size="sm" mb={4}>🧾 آخر المدفوعات</Heading>
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>العميل</Table.ColumnHeader>
              <Table.ColumnHeader>الدورة</Table.ColumnHeader>
              <Table.ColumnHeader>المبلغ</Table.ColumnHeader>
              <Table.ColumnHeader>الحالة</Table.ColumnHeader>
              <Table.ColumnHeader>التاريخ</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {metrics.recentPayments.map((payment) => (
              <Table.Row key={payment.id}>
                <Table.Cell>{payment.customerName || "غير معروف"}</Table.Cell>
                <Table.Cell>{payment.course.title}</Table.Cell>
                <Table.Cell>{formatCurrency(payment.amount, metrics.currency)}</Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={payment.status === "COMPLETED" ? "green" : "yellow"}>
                    {statusLabels[payment.status] || payment.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>{new Date(payment.createdAt).toLocaleDateString("ar-SA")}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </PremiumCard>
    </Stack>
  );

  const renderCourses = (metrics: CoursesData) => (
    <Stack gap={6}>
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
        <PremiumCard p={6}>
          <Heading size="sm" mb={4}>📋 حسب الحالة</Heading>
          <Stack gap={2}>
            {metrics.byStatus.map((item) => (
              <Flex key={item.status} justify="space-between">
                <Text>{statusLabels[item.status] || item.status}</Text>
                <Text fontWeight="bold">{item.count}</Text>
              </Flex>
            ))}
          </Stack>
        </PremiumCard>

        <PremiumCard p={6}>
          <Heading size="sm" mb={4}>📊 حسب المستوى</Heading>
          <Stack gap={2}>
            {metrics.byLevel.map((item) => (
              <Flex key={item.level} justify="space-between">
                <Text>{levelLabels[item.level] || item.level}</Text>
                <Text fontWeight="bold">{item.count}</Text>
              </Flex>
            ))}
          </Stack>
        </PremiumCard>

        <PremiumCard p={6}>
          <Heading size="sm" mb={4}>⭐ التقييم العام</Heading>
          <Text fontSize="4xl" fontWeight="bold" textAlign="center">
            {metrics.averageRating}/5
          </Text>
          <Text textAlign="center" color="muted">متوسط تقييم الدورات</Text>
        </PremiumCard>
      </SimpleGrid>

      <PremiumCard p={6}>
        <Heading size="sm" mb={4}>🏆 أفضل الدورات (حسب التسجيلات)</Heading>
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>#</Table.ColumnHeader>
              <Table.ColumnHeader>الدورة</Table.ColumnHeader>
              <Table.ColumnHeader>التسجيلات</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {metrics.topCourses.map((course, index) => (
              <Table.Row key={course.id}>
                <Table.Cell>{index + 1}</Table.Cell>
                <Table.Cell fontWeight="500">{course.title}</Table.Cell>
                <Table.Cell>
                  <Badge colorPalette="green">{course.enrollments}</Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </PremiumCard>
    </Stack>
  );

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
            مركز التقارير
          </Badge>
          <Heading size="2xl" bgGradient="linear(135deg, text 0%, brand.900 100%)" bgClip="text">
            التقارير والإحصائيات
          </Heading>
          <Text color="muted" fontSize="lg" lineHeight="1.7">
            تحليلات شاملة لأداء المنصة والمؤشرات الرئيسية.
          </Text>
        </Stack>

        <Flex gap={2} align="center">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #e2e8f0" }}
          >
            {periodOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </Flex>
      </Flex>

      {/* Report Type Tabs */}
      <Flex gap={2} wrap="wrap">
        {reportTypes.map((type) => (
          <Button
            key={type.key}
            size="sm"
            variant={reportType === type.key ? "solid" : "outline"}
            bg={reportType === type.key ? "brand.900" : undefined}
            color={reportType === type.key ? "white" : undefined}
            onClick={() => setReportType(type.key)}
          >
            {type.icon} {type.label}
          </Button>
        ))}
      </Flex>

      {/* Report Content */}
      {loading ? (
        <Flex justify="center" p={12}>
          <Text color="muted">جاري تحميل التقرير...</Text>
        </Flex>
      ) : data ? (
        <>
          {reportType === "overview" && renderOverview(data as OverviewData)}
          {reportType === "revenue" && renderRevenue(data as RevenueData)}
          {reportType === "courses" && renderCourses(data as CoursesData)}
          {(reportType === "users" || reportType === "engagement") && (
            <PremiumCard p={6}>
              <Text textAlign="center" color="muted">
                تقرير {reportTypes.find(t => t.key === reportType)?.label} - البيانات متوفرة عبر API
              </Text>
            </PremiumCard>
          )}
        </>
      ) : (
        <PremiumCard p={6}>
          <Text textAlign="center" color="muted">لا توجد بيانات</Text>
        </PremiumCard>
      )}
    </Stack>
  );
}
