"use client";

import { Badge, Button, Flex, Heading, Input, SimpleGrid, Stack, Text, Checkbox } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import PremiumCard from "@/components/ui/PremiumCard";

interface Permission {
  key: string;
  label: string;
  category: string;
}

interface AdminRole {
  id: string;
  name: string;
  nameAr: string;
  description: string | null;
  permissions: string[];
  isSystem: boolean;
  status: string;
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  users: "👥 المستخدمين",
  courses: "📚 الدورات",
  payments: "💳 المدفوعات",
  content: "📋 المحتوى",
  reports: "📊 التقارير",
  settings: "⚙️ الإعدادات",
  notifications: "🔔 الإشعارات",
  audit: "📝 التدقيق",
  roles: "🔐 الأدوار",
};

export default function AdminPermissionsPage() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<AdminRole | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/permissions", {
        credentials: "include",
      });
      const data = await response.json();
      if (data.ok) {
        setRoles(data.data.roles);
        setAvailablePermissions(data.data.availablePermissions);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const resetForm = () => {
    setName("");
    setNameAr("");
    setDescription("");
    setSelectedPermissions([]);
    setEditingRole(null);
    setShowForm(false);
  };

  const handleEdit = (role: AdminRole) => {
    setName(role.name);
    setNameAr(role.nameAr);
    setDescription(role.description || "");
    setSelectedPermissions(role.permissions);
    setEditingRole(role);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    try {
      const body = editingRole
        ? { id: editingRole.id, nameAr, description, permissions: selectedPermissions }
        : { name, nameAr, description, permissions: selectedPermissions };

      const response = await fetch("/api/admin/permissions", {
        method: editingRole ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.ok) {
        fetchRoles();
        resetForm();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error saving role:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الدور؟")) return;

    try {
      const response = await fetch(`/api/admin/permissions?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (data.ok) {
        fetchRoles();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error deleting role:", error);
    }
  };

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const toggleCategory = (category: string) => {
    const categoryPerms = availablePermissions
      .filter((p) => p.category === category)
      .map((p) => p.key);
    const allSelected = categoryPerms.every((p) => selectedPermissions.includes(p));

    if (allSelected) {
      setSelectedPermissions((prev) => prev.filter((p) => !categoryPerms.includes(p)));
    } else {
      setSelectedPermissions((prev) => [...new Set([...prev, ...categoryPerms])]);
    }
  };

  const groupedPermissions = availablePermissions.reduce<Record<string, Permission[]>>((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {});

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
            الصلاحيات والأدوار
          </Badge>
          <Heading size="2xl" bgGradient="linear(135deg, text 0%, brand.900 100%)" bgClip="text">
            إدارة الصلاحيات
          </Heading>
          <Text color="muted" fontSize="lg" lineHeight="1.7">
            تخصيص الصلاحيات حسب فرق العمل والأدوار المختلفة.
          </Text>
        </Stack>
        <Button
          bgGradient="linear(135deg, brand.900 0%, brand.700 100%)"
          color="white"
          _hover={{ transform: "translateY(-2px)", boxShadow: "cardHover" }}
          transition="all 0.3s ease"
          h="fit-content"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "إلغاء" : "➕ إنشاء دور جديد"}
        </Button>
      </Flex>

      {/* Form */}
      {showForm && (
        <PremiumCard p={6}>
          <Stack gap={6}>
            <Heading size="md">{editingRole ? "تعديل الدور" : "إنشاء دور جديد"}</Heading>

            <Flex gap={4} wrap="wrap">
              {!editingRole && (
                <Stack gap={2} flex={1} minW="200px">
                  <Text fontWeight="500">اسم الدور (لاتيني)</Text>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="content_manager"
                    dir="ltr"
                  />
                </Stack>
              )}
              <Stack gap={2} flex={1} minW="200px">
                <Text fontWeight="500">الاسم العربي</Text>
                <Input
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder="مدير المحتوى"
                />
              </Stack>
              <Stack gap={2} flex={1} minW="200px">
                <Text fontWeight="500">الوصف</Text>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف الدور..."
                />
              </Stack>
            </Flex>

            <Stack gap={4}>
              <Text fontWeight="600" fontSize="lg">
                الصلاحيات ({selectedPermissions.length} محددة)
              </Text>

              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
                {Object.entries(groupedPermissions).map(([category, perms]) => {
                  const allSelected = perms.every((p) => selectedPermissions.includes(p.key));
                  const someSelected = perms.some((p) => selectedPermissions.includes(p.key));

                  return (
                    <PremiumCard key={category} p={4} variant="bordered">
                      <Stack gap={3}>
                        <Flex align="center" gap={2}>
                          <Checkbox.Root
                            checked={allSelected ? true : someSelected ? "indeterminate" : false}
                            onCheckedChange={() => toggleCategory(category)}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control>
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                          </Checkbox.Root>
                          <Text fontWeight="600">{categoryLabels[category] || category}</Text>
                        </Flex>
                        <Stack gap={2} ps={6}>
                          {perms.map((perm) => (
                            <Flex key={perm.key} align="center" gap={2}>
                              <Checkbox.Root
                                checked={selectedPermissions.includes(perm.key)}
                                onCheckedChange={() => togglePermission(perm.key)}
                              >
                                <Checkbox.HiddenInput />
                                <Checkbox.Control>
                                  <Checkbox.Indicator />
                                </Checkbox.Control>
                              </Checkbox.Root>
                              <Text fontSize="sm">{perm.label}</Text>
                            </Flex>
                          ))}
                        </Stack>
                      </Stack>
                    </PremiumCard>
                  );
                })}
              </SimpleGrid>
            </Stack>

            <Flex gap={4} justify="flex-end">
              <Button variant="ghost" onClick={resetForm}>
                إلغاء
              </Button>
              <Button
                bg="primary"
                color="white"
                onClick={handleSubmit}
                disabled={selectedPermissions.length === 0 || (!editingRole && !name)}
                _hover={{ bg: "primaryHover" }}
              >
                {editingRole ? "تحديث" : "إنشاء"}
              </Button>
            </Flex>
          </Stack>
        </PremiumCard>
      )}

      {/* Roles List */}
      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        {roles.map((role) => (
          <PremiumCard key={role.id} variant="bordered" p={6}>
            <Stack gap={4}>
              <Flex justify="space-between" align="center">
                <Text fontWeight="700" fontSize="lg">
                  {role.nameAr}
                </Text>
                <Flex gap={2}>
                  {role.isSystem && (
                    <Badge colorPalette="blue" px={2} py={1} borderRadius="md">
                      أساسي
                    </Badge>
                  )}
                  <Badge
                    colorPalette={role.status === "active" ? "green" : "gray"}
                    px={2}
                    py={1}
                    borderRadius="md"
                  >
                    {role.status === "active" ? "نشط" : "معطل"}
                  </Badge>
                </Flex>
              </Flex>

              {role.description && (
                <Text color="muted" lineHeight="1.7">
                  {role.description}
                </Text>
              )}

              <Text fontSize="sm" color="muted">
                {role.permissions.length} صلاحية
              </Text>

              <Flex gap={2} wrap="wrap">
                <Button
                  size="sm"
                  variant="outline"
                  borderColor="outlineBorder"
                  borderWidth="2px"
                  color="outlineText"
                  onClick={() => handleEdit(role)}
                  _hover={{ bg: "brand.50", borderColor: "brand.600" }}
                  transition="all 0.3s ease"
                >
                  إدارة الصلاحيات
                </Button>
                {!role.isSystem && (
                  <Button
                    size="sm"
                    variant="outline"
                    colorPalette="red"
                    onClick={() => handleDelete(role.id)}
                  >
                    حذف
                  </Button>
                )}
              </Flex>
            </Stack>
          </PremiumCard>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
