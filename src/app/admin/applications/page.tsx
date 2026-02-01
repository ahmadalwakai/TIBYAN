"use client";

import { Badge, Box, Button, Flex, Heading, Input, SimpleGrid, Stack, Text, Spinner } from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";
import { useEffect, useState } from "react";

interface TeacherApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subjectsToTeach: string;
  yearsExperience: string | null;
  quranMemorization: string | null;
  tajweedLevel: string | null;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  createdAt: string;
}

const statusColors: Record<string, string> = {
  PENDING: "yellow",
  UNDER_REVIEW: "blue",
  APPROVED: "green",
  REJECTED: "red",
};

const statusLabels: Record<string, string> = {
  PENDING: "قيد الانتظار",
  UNDER_REVIEW: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
};

const statusIcons: Record<string, string> = {
  PENDING: "⏳",
  UNDER_REVIEW: "🔍",
  APPROVED: "✅",
  REJECTED: "❌",
};

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<TeacherApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedApp, setSelectedApp] = useState<TeacherApplication | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);

      const response = await fetch(`/api/admin/applications?${params}`, {
        credentials: "include",
      });
      const data = await response.json();

      if (data.ok) {
        setApplications(data.data.applications);
      } else {
        setError(data.error);
      }
    } catch {
      setError("حدث خطأ في جلب الطلبات");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, reviewNotes?: string) => {
    setUpdating(true);
    try {
      const response = await fetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNotes }),
        credentials: "include",
      });
      const data = await response.json();

      if (data.ok) {
        fetchApplications();
        setSelectedApp(null);
      } else {
        setError(data.error);
      }
    } catch {
      setError("حدث خطأ في تحديث الطلب");
    } finally {
      setUpdating(false);
    }
  };

  const filteredApplications = applications.filter((app) =>
    app.fullName.toLowerCase().includes(search.toLowerCase()) ||
    app.email.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Box>
      <Stack gap={6}>
        {/* Header */}
        <Flex justify="space-between" align="center" wrap="wrap" gap={4}>
          <Stack gap={1}>
            <Heading size="lg" color="text">طلبات الانضمام كمدرّس 📝</Heading>
            <Text color="muted">إدارة طلبات المدرسين الجدد</Text>
          </Stack>
          <Badge colorPalette="brand" fontSize="md" px={3} py={1}>
            {applications.length} طلب
          </Badge>
        </Flex>

        {/* Filters */}
        <PremiumCard p={4}>
          <Flex gap={4} wrap="wrap">
            <Input
              placeholder="🔍 البحث بالاسم أو البريد..."
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
              {Object.entries(statusLabels).map(([key, label]) => (
                <Button
                  key={key}
                  size="sm"
                  variant={statusFilter === key ? "solid" : "outline"}
                  colorPalette={statusColors[key]}
                  onClick={() => setStatusFilter(key)}
                >
                  {statusIcons[key]} {label}
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

        {/* Loading */}
        {loading ? (
          <Flex justify="center" py={10}>
            <Spinner size="xl" color="spinner" />
          </Flex>
        ) : filteredApplications.length === 0 ? (
          <PremiumCard p={8}>
            <Text textAlign="center" color="muted">
              لا توجد طلبات {statusFilter && `بحالة "${statusLabels[statusFilter]}"`}
            </Text>
          </PremiumCard>
        ) : (
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
            {filteredApplications.map((app) => (
              <PremiumCard key={app.id} p={5}>
                <Stack gap={4}>
                  {/* Header */}
                  <Flex justify="space-between" align="start">
                    <Stack gap={1}>
                      <Text fontWeight="700" fontSize="lg" color="text">
                        {app.fullName}
                      </Text>
                      <Text fontSize="sm" color="muted">{app.email}</Text>
                      <Text fontSize="sm" color="muted">{app.phone}</Text>
                    </Stack>
                    <Badge colorPalette={statusColors[app.status]} fontSize="sm">
                      {statusIcons[app.status]} {statusLabels[app.status]}
                    </Badge>
                  </Flex>

                  {/* Details */}
                  <Stack gap={2} fontSize="sm">
                    <Flex gap={2}>
                      <Text color="muted">المواد:</Text>
                      <Text color="text">{app.subjectsToTeach}</Text>
                    </Flex>
                    {app.yearsExperience && (
                      <Flex gap={2}>
                        <Text color="muted">الخبرة:</Text>
                        <Text color="text">{app.yearsExperience}</Text>
                      </Flex>
                    )}
                    {app.quranMemorization && (
                      <Flex gap={2}>
                        <Text color="muted">حفظ القرآن:</Text>
                        <Text color="text">{app.quranMemorization}</Text>
                      </Flex>
                    )}
                    {app.tajweedLevel && (
                      <Flex gap={2}>
                        <Text color="muted">مستوى التجويد:</Text>
                        <Text color="text">{app.tajweedLevel}</Text>
                      </Flex>
                    )}
                    <Flex gap={2}>
                      <Text color="muted">تاريخ التقديم:</Text>
                      <Text color="text">{formatDate(app.createdAt)}</Text>
                    </Flex>
                  </Stack>

                  {/* Actions */}
                  {app.status === "PENDING" && (
                    <Flex gap={2} pt={2}>
                      <Button
                        size="sm"
                        colorPalette="blue"
                        onClick={() => updateStatus(app.id, "UNDER_REVIEW")}
                        disabled={updating}
                      >
                        🔍 مراجعة
                      </Button>
                      <Button
                        size="sm"
                        colorPalette="green"
                        onClick={() => updateStatus(app.id, "APPROVED")}
                        disabled={updating}
                      >
                        ✅ قبول
                      </Button>
                      <Button
                        size="sm"
                        colorPalette="red"
                        variant="outline"
                        onClick={() => updateStatus(app.id, "REJECTED")}
                        disabled={updating}
                      >
                        ❌ رفض
                      </Button>
                    </Flex>
                  )}
                  {app.status === "UNDER_REVIEW" && (
                    <Flex gap={2} pt={2}>
                      <Button
                        size="sm"
                        colorPalette="green"
                        onClick={() => updateStatus(app.id, "APPROVED")}
                        disabled={updating}
                      >
                        ✅ قبول
                      </Button>
                      <Button
                        size="sm"
                        colorPalette="red"
                        variant="outline"
                        onClick={() => updateStatus(app.id, "REJECTED")}
                        disabled={updating}
                      >
                        ❌ رفض
                      </Button>
                    </Flex>
                  )}
                </Stack>
              </PremiumCard>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Box>
  );
}
