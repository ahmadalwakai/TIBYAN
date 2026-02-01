"use client";

import { Badge, Box, Button, Flex, Heading, Input, SimpleGrid, Stack, Text, Spinner } from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";
import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar?: string;
  lastActiveAt: string;
  _count: {
    coursesCreated: number;
    enrollments: number;
  };
}

const roleIcons: Record<string, string> = {
  STUDENT: "👩‍🎓",
  INSTRUCTOR: "👨‍🏫",
  ADMIN: "👨‍💻",
  MEMBER: "👤",
};

const roleLabels: Record<string, string> = {
  STUDENT: "طالب",
  INSTRUCTOR: "مدرّس",
  ADMIN: "مدير",
  MEMBER: "عضو",
};

const statusLabels: Record<string, string> = {
  ACTIVE: "نشط",
  INACTIVE: "غير نشط",
  SUSPENDED: "موقوف",
  PENDING: "قيد المراجعة",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);

      const response = await fetch(`/api/admin/users?${params}`);
      const result = await response.json();

      if (result.ok) {
        setUsers(result.data);
      } else {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.ok) {
        fetchUsers();
      } else {
        alert(result.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleStatus = async (user: User) => {
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();

      if (result.ok) {
        fetchUsers();
      } else {
        alert(result.error);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const formatDate = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return "منذ دقائق";
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "أمس";
    if (days < 7) return `منذ ${days} أيام`;
    return new Date(date).toLocaleDateString("ar");
  };

  return (
    <Stack gap={8}>
      <Flex direction={{ base: "column", md: "row" }} gap={4} justify="space-between">
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
            👥 إدارة المستخدمين
          </Badge>
          <Heading size="xl" bgGradient="linear(135deg, text 0%, brand.900 100%)" bgClip="text">
            إدارة المستخدمين
          </Heading>
          <Text color="muted" fontSize="lg">إدارة الأدوار، الحالات، والتحقق من الحسابات.</Text>
        </Stack>
      </Flex>

      <PremiumCard variant="bordered" p={6}>
        <Stack gap={4}>
          <Input
            placeholder="🔍 البحث عن مستخدم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            bg="background"
          />
          <Flex gap={3} flexWrap="wrap">
            <Button
              size="sm"
              variant={roleFilter === "" ? "solid" : "outline"}
              onClick={() => setRoleFilter("")}
            >
              الكل
            </Button>
            <Button
              size="sm"
              variant={roleFilter === "STUDENT" ? "solid" : "outline"}
              onClick={() => setRoleFilter("STUDENT")}
            >
              الطلاب
            </Button>
            <Button
              size="sm"
              variant={roleFilter === "INSTRUCTOR" ? "solid" : "outline"}
              onClick={() => setRoleFilter("INSTRUCTOR")}
            >
              المدرّسون
            </Button>
            <Button
              size="sm"
              variant={roleFilter === "ADMIN" ? "solid" : "outline"}
              onClick={() => setRoleFilter("ADMIN")}
            >
              المدراء
            </Button>
          </Flex>
        </Stack>
      </PremiumCard>

      {loading && (
        <Flex justify="center" py={10}>
          <Spinner size="xl" color="brand.500" />
        </Flex>
      )}

      {error && (
        <PremiumCard variant="bordered" p={6} borderColor="red.500">
          <Text color="red.500">❌ {error}</Text>
        </PremiumCard>
      )}

      {!loading && !error && users.length === 0 && (
        <PremiumCard variant="bordered" p={6}>
          <Text color="muted" textAlign="center">لا يوجد مستخدمون</Text>
        </PremiumCard>
      )}

      {!loading && !error && users.length > 0 && (
        <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
          {users.map((user) => (
            <PremiumCard key={user.id} variant="default" p={6}>
              <Stack gap={4}>
                <Flex justify="space-between" align="center">
                  <Flex align="center" gap={2}>
                    <Text fontSize="2xl">{roleIcons[user.role]}</Text>
                    <Stack gap={0}>
                      <Text fontWeight="800" fontSize="lg">{user.name}</Text>
                      <Text fontSize="sm" color="muted">{user.email}</Text>
                    </Stack>
                  </Flex>
                  <Badge 
                    bgGradient="linear(135deg, brand.500 0%, brand.600 100%)"
                    color="white"
                    px={3}
                    py={1}
                    borderRadius="badge"
                    fontWeight="600"
                  >
                    {roleLabels[user.role]}
                  </Badge>
                </Flex>

                <Flex gap={4} fontSize="sm" color="muted">
                  <Text>📚 {user._count.coursesCreated} دورة</Text>
                  <Text>🎓 {user._count.enrollments} اشتراك</Text>
                </Flex>

                <Text color="muted" fontSize="sm">
                  🕒 آخر نشاط: {formatDate(user.lastActiveAt)}
                </Text>

                <Flex justify="space-between" align="center" pt={2} borderTop="1px solid" borderColor="border">
                  <Badge
                    bg={user.status === "ACTIVE" ? "success" : user.status === "SUSPENDED" ? "red.500" : "warning"}
                    color="white"
                    px={3}
                    py={1}
                    borderRadius="badge"
                    fontWeight="600"
                  >
                    {statusLabels[user.status]}
                  </Badge>
                  <Flex gap={2}>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      borderColor="brand.500"
                      color="brand.900"
                      _hover={{ bg: "brand.50" }}
                      onClick={() => toggleStatus(user)}
                    >
                      {user.status === "ACTIVE" ? "⏸️ إيقاف" : "▶️ تفعيل"}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      borderColor="red.500"
                      color="red.500"
                      _hover={{ bg: "red.50" }}
                      onClick={() => deleteUser(user.id)}
                    >
                      🗑️ حذف
                    </Button>
                  </Flex>
                </Flex>
              </Stack>
            </PremiumCard>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
