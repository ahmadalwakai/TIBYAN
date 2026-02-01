"use client";

import { Badge, Button, Flex, Heading, Input, SimpleGrid, Stack, Text, Table } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import PremiumCard from "@/components/ui/PremiumCard";
import { getActionLabel, getEntityLabel } from "@/lib/audit";

interface AuditLog {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
}

interface Stats {
  total: number;
  actionBreakdown: Array<{ action: string; count: number }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const actionColors: Record<string, string> = {
  USER_CREATE: "green",
  USER_UPDATE: "blue",
  USER_DELETE: "red",
  USER_STATUS_CHANGE: "orange",
  COURSE_CREATE: "green",
  COURSE_UPDATE: "blue",
  COURSE_DELETE: "red",
  COURSE_PUBLISH: "green",
  PAYMENT_UPDATE: "blue",
  PAYMENT_REFUND: "orange",
  APPLICATION_APPROVE: "green",
  APPLICATION_REJECT: "red",
  ADMIN_LOGIN: "purple",
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, actionBreakdown: [] });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("limit", pagination.limit.toString());
      if (search) params.set("search", search);
      if (actionFilter) params.set("action", actionFilter);

      const response = await fetch(`/api/admin/audit-logs?${params}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (data.ok) {
        setLogs(data.data.logs);
        setStats(data.data.stats);
        setPagination(data.data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, actionFilter]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `قبل ${diffMins} دقيقة`;
    if (diffHours < 24) return `قبل ${diffHours} ساعة`;
    if (diffDays < 7) return `قبل ${diffDays} يوم`;
    return date.toLocaleDateString("ar-SA");
  };

  const getActionIcon = (action: string) => {
    if (action.includes("CREATE")) return "➕";
    if (action.includes("DELETE")) return "🗑️";
    if (action.includes("UPDATE")) return "✏️";
    if (action.includes("APPROVE")) return "✅";
    if (action.includes("REJECT")) return "❌";
    if (action.includes("LOGIN")) return "🔐";
    if (action.includes("LOGOUT")) return "🚪";
    if (action.includes("PUBLISH")) return "📢";
    return "📋";
  };

  return (
    <Stack gap={10}>
      {/* Header */}
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
          سجلات التدقيق
        </Badge>
        <Heading size="2xl" bgGradient="linear(135deg, text 0%, brand.900 100%)" bgClip="text">
          متابعة الأنشطة الإدارية
        </Heading>
        <Text color="muted" fontSize="lg" lineHeight="1.7">
          متابعة شاملة ومفصلة لكل الأنشطة الإدارية الحساسة.
        </Text>
      </Stack>

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={6}>
        <PremiumCard p={6} textAlign="center">
          <Text fontSize="3xl" fontWeight="800" color="primary">{stats.total}</Text>
          <Text color="muted" fontSize="sm">إجمالي السجلات</Text>
        </PremiumCard>
        {stats.actionBreakdown.slice(0, 3).map((stat) => (
          <PremiumCard key={stat.action} p={6} textAlign="center">
            <Text fontSize="3xl" fontWeight="800" color="primary">{stat.count}</Text>
            <Text color="muted" fontSize="sm">{getActionLabel(stat.action)}</Text>
          </PremiumCard>
        ))}
      </SimpleGrid>

      {/* Filters */}
      <PremiumCard p={6}>
        <Flex gap={4} direction={{ base: "column", md: "row" }}>
          <Input
            placeholder="بحث في السجلات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            flex={1}
          />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              backgroundColor: "white",
              minWidth: "200px",
            }}
          >
            <option value="">جميع الإجراءات</option>
            <option value="USER_CREATE">إنشاء مستخدم</option>
            <option value="USER_UPDATE">تحديث مستخدم</option>
            <option value="USER_DELETE">حذف مستخدم</option>
            <option value="COURSE_CREATE">إنشاء دورة</option>
            <option value="COURSE_UPDATE">تحديث دورة</option>
            <option value="COURSE_DELETE">حذف دورة</option>
            <option value="PAYMENT_UPDATE">تحديث دفعة</option>
            <option value="APPLICATION_APPROVE">قبول طلب</option>
            <option value="APPLICATION_REJECT">رفض طلب</option>
            <option value="ADMIN_LOGIN">تسجيل دخول</option>
          </select>
          <Button
            bg="primary"
            color="white"
            onClick={handleSearch}
            _hover={{ bg: "primaryHover" }}
          >
            بحث
          </Button>
        </Flex>
      </PremiumCard>

      {/* Logs Table */}
      <PremiumCard p={0} overflow="hidden">
        {loading ? (
          <Flex justify="center" align="center" py={20}>
            <Text color="muted">جاري التحميل...</Text>
          </Flex>
        ) : logs.length === 0 ? (
          <Flex justify="center" align="center" py={20} direction="column" gap={4}>
            <Text fontSize="4xl">📋</Text>
            <Text color="muted">لا توجد سجلات تدقيق بعد</Text>
          </Flex>
        ) : (
          <Table.Root size="lg">
            <Table.Header>
              <Table.Row bg="gray.50">
                <Table.ColumnHeader fontWeight="700" color="text">الإجراء</Table.ColumnHeader>
                <Table.ColumnHeader fontWeight="700" color="text">المنفّذ</Table.ColumnHeader>
                <Table.ColumnHeader fontWeight="700" color="text">النوع</Table.ColumnHeader>
                <Table.ColumnHeader fontWeight="700" color="text">التفاصيل</Table.ColumnHeader>
                <Table.ColumnHeader fontWeight="700" color="text">الوقت</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {logs.map((log) => (
                <Table.Row key={log.id} _hover={{ bg: "gray.50" }}>
                  <Table.Cell>
                    <Flex align="center" gap={2}>
                      <Text fontSize="lg">{getActionIcon(log.action)}</Text>
                      <Badge
                        colorPalette={actionColors[log.action] || "gray"}
                        px={2}
                        py={1}
                        borderRadius="md"
                        fontSize="xs"
                      >
                        {getActionLabel(log.action)}
                      </Badge>
                    </Flex>
                  </Table.Cell>
                  <Table.Cell>
                    <Stack gap={0}>
                      <Text fontWeight="600" fontSize="sm">
                        {log.actor?.name || "نظام"}
                      </Text>
                      <Text color="muted" fontSize="xs">
                        {log.actor?.email || "-"}
                      </Text>
                    </Stack>
                  </Table.Cell>
                  <Table.Cell>
                    {log.entityType ? (
                      <Badge variant="outline" colorPalette="brand" fontSize="xs">
                        {getEntityLabel(log.entityType)}
                      </Badge>
                    ) : (
                      <Text color="muted">-</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Text fontSize="sm" color="muted" maxW="200px" truncate>
                      {log.entityId ? `ID: ${log.entityId.substring(0, 12)}...` : "-"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text color="muted" fontSize="sm">{formatDate(log.createdAt)}</Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Flex justify="center" gap={2} p={4} borderTop="1px solid" borderColor="gray.100">
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
            >
              السابق
            </Button>
            <Text alignSelf="center" color="muted" fontSize="sm">
              صفحة {pagination.page} من {pagination.totalPages}
            </Text>
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page === pagination.totalPages}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
            >
              التالي
            </Button>
          </Flex>
        )}
      </PremiumCard>
    </Stack>
  );
}
