"use client";

import { Badge, Button, Flex, Heading, Input, SimpleGrid, Stack, Text, Switch, IconButton, HStack, Box } from "@chakra-ui/react";
import { useEffect, useState, useCallback } from "react";
import PremiumCard from "@/components/ui/PremiumCard";

interface SettingsCategory {
  key: string;
  title: string;
  icon: string;
  description: string;
  fields: SettingField[];
}

interface SettingField {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "select";
  options?: string[];
}

const settingsCategories: SettingsCategory[] = [
  {
    key: "platform",
    title: "إعدادات المنصة",
    icon: "⚙️",
    description: "الشعار، الهوية، اللغة الافتراضية، والاتجاه.",
    fields: [
      { key: "siteName", label: "اسم الموقع", type: "text" },
      { key: "siteDescription", label: "وصف الموقع", type: "text" },
      { key: "defaultLanguage", label: "اللغة الافتراضية", type: "select", options: ["ar", "en"] },
      { key: "maintenanceMode", label: "وضع الصيانة", type: "boolean" },
      { key: "registrationEnabled", label: "السماح بالتسجيل", type: "boolean" },
    ],
  },
  {
    key: "payments",
    title: "المدفوعات والاشتراكات",
    icon: "💳",
    description: "بوابات الدفع، الخطط، السياسات الضريبية.",
    fields: [
      { key: "currency", label: "العملة", type: "select", options: ["EUR", "USD", "SAR", "AED"] },
      { key: "taxRate", label: "نسبة الضريبة %", type: "number" },
      { key: "cashEnabled", label: "الدفع النقدي", type: "boolean" },
      { key: "bankTransferEnabled", label: "التحويل البنكي", type: "boolean" },
      { key: "refundPolicy", label: "سياسة الاسترداد", type: "text" },
    ],
  },
  {
    key: "email",
    title: "البريد والإشعارات",
    icon: "📧",
    description: "SMTP، قوالب الرسائل، وجدولة التنبيهات.",
    fields: [
      { key: "fromEmail", label: "البريد المرسل", type: "text" },
      { key: "fromName", label: "اسم المرسل", type: "text" },
      { key: "smtpHost", label: "خادم SMTP", type: "text" },
      { key: "smtpPort", label: "منفذ SMTP", type: "number" },
      { key: "templatesEnabled", label: "تفعيل القوالب", type: "boolean" },
    ],
  },
  {
    key: "content",
    title: "سياسات المحتوى",
    icon: "📋",
    description: "ضوابط النشر، إجراءات المراجعة، وسياسات المجتمع.",
    fields: [
      { key: "autoPublish", label: "النشر التلقائي", type: "boolean" },
      { key: "requireReview", label: "مراجعة المحتوى", type: "boolean" },
      { key: "maxUploadSizeMB", label: "حد الرفع (MB)", type: "number" },
      { key: "enableComments", label: "تفعيل التعليقات", type: "boolean" },
      { key: "enableRatings", label: "تفعيل التقييمات", type: "boolean" },
    ],
  },
  {
    key: "security",
    title: "الأمان والوصول",
    icon: "🔐",
    description: "الأدوار، الصلاحيات، سجلات التدقيق.",
    fields: [
      { key: "sessionTimeoutMinutes", label: "مهلة الجلسة (دقيقة)", type: "number" },
      { key: "maxLoginAttempts", label: "محاولات الدخول", type: "number" },
      { key: "lockoutDurationMinutes", label: "مدة الحظر (دقيقة)", type: "number" },
      { key: "require2FA", label: "تفعيل 2FA", type: "boolean" },
      { key: "passwordMinLength", label: "طول كلمة المرور", type: "number" },
    ],
  },
  {
    key: "notifications",
    title: "الإشعارات",
    icon: "🔔",
    description: "إعدادات البريد والإشعارات.",
    fields: [
      { key: "emailNotifications", label: "إشعارات البريد", type: "boolean" },
      { key: "enrollmentEmails", label: "رسائل التسجيل", type: "boolean" },
      { key: "paymentEmails", label: "رسائل الدفع", type: "boolean" },
      { key: "marketingEmails", label: "رسائل تسويقية", type: "boolean" },
    ],
  },
  {
    key: "admins",
    title: "إدارة المشرفين",
    icon: "👑",
    description: "إضافة وإدارة المشرفين المصرح لهم بالوصول.",
    fields: [], // Custom UI, no standard fields
  },
];

interface AdminEmail {
  email: string;
  name: string;
  isStatic: boolean;
  status: "active" | "suspended";
  addedAt: string | null;
  addedBy?: string;
  suspendedAt?: string;
  suspendedBy?: string;
  suspendReason?: string;
}

export default function AdminSettingsPage() {
  const [allSettings, setAllSettings] = useState<Record<string, Record<string, unknown>>>({});
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedSettings, setEditedSettings] = useState<Record<string, unknown>>({});
  
  // Admin management state
  const [admins, setAdmins] = useState<AdminEmail[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [newAdminName, setNewAdminName] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [editingAdmin, setEditingAdmin] = useState<AdminEmail | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [showSuspendModal, setShowSuspendModal] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "suspended">("all");

  const fetchAdmins = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/admins");
      const data = await response.json();
      if (data.ok) {
        setAdmins(data.data.admins);
      }
    } catch (error) {
      console.error("Failed to fetch admins:", error);
    }
  }, []);

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) {
      setAdminError("يرجى إدخال البريد الإلكتروني");
      return;
    }
    if (!newAdminName.trim()) {
      setAdminError("يرجى إدخال اسم المشرف");
      return;
    }
    
    setAdminLoading(true);
    setAdminError("");
    
    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: newAdminEmail.trim(),
          name: newAdminName.trim(),
        }),
      });
      
      const data = await response.json();
      if (data.ok) {
        setNewAdminEmail("");
        setNewAdminName("");
        fetchAdmins();
      } else {
        setAdminError(data.error || "فشل في إضافة المشرف");
      }
    } catch {
      setAdminError("حدث خطأ في إضافة المشرف");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleEditAdmin = async () => {
    if (!editingAdmin) return;
    
    setAdminLoading(true);
    setAdminError("");
    
    try {
      const response = await fetch("/api/admin/admins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: editingAdmin.email,
          name: editName.trim() || undefined,
          newEmail: editEmail.trim() !== editingAdmin.email ? editEmail.trim() : undefined,
        }),
      });
      
      const data = await response.json();
      if (data.ok) {
        setEditingAdmin(null);
        setEditName("");
        setEditEmail("");
        fetchAdmins();
      } else {
        setAdminError(data.error || "فشل في تحديث المشرف");
      }
    } catch {
      setAdminError("حدث خطأ في تحديث المشرف");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSuspendAdmin = async (email: string) => {
    setAdminLoading(true);
    try {
      const response = await fetch("/api/admin/admins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "suspend",
          email,
          reason: suspendReason.trim() || undefined,
        }),
      });
      
      const data = await response.json();
      if (data.ok) {
        setShowSuspendModal(null);
        setSuspendReason("");
        fetchAdmins();
      } else {
        alert(data.error || "فشل في تعليق المشرف");
      }
    } catch {
      alert("حدث خطأ في تعليق المشرف");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleActivateAdmin = async (email: string) => {
    if (!confirm(`هل أنت متأكد من تفعيل المشرف ${email}؟`)) return;
    
    setAdminLoading(true);
    try {
      const response = await fetch("/api/admin/admins", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "activate",
          email,
        }),
      });
      
      const data = await response.json();
      if (data.ok) {
        fetchAdmins();
      } else {
        alert(data.error || "فشل في تفعيل المشرف");
      }
    } catch {
      alert("حدث خطأ في تفعيل المشرف");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    if (!confirm(`هل أنت متأكد من حذف المشرف ${email} نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    
    setAdminLoading(true);
    try {
      const response = await fetch(`/api/admin/admins?email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      if (data.ok) {
        fetchAdmins();
      } else {
        alert(data.error || "فشل في حذف المشرف");
      }
    } catch {
      alert("حدث خطأ في حذف المشرف");
    } finally {
      setAdminLoading(false);
    }
  };

  const startEditing = (admin: AdminEmail) => {
    setEditingAdmin(admin);
    setEditName(admin.name);
    setEditEmail(admin.email);
    setAdminError("");
  };

  const cancelEditing = () => {
    setEditingAdmin(null);
    setEditName("");
    setEditEmail("");
    setAdminError("");
  };

  const filteredAdmins = admins.filter(admin => {
    if (filterStatus === "all") return true;
    return admin.status === filterStatus;
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/settings");
      const data = await response.json();
      if (data.ok) {
        setAllSettings(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchAdmins();
  }, [fetchAdmins]);

  useEffect(() => {
    if (activeCategory && allSettings[activeCategory]) {
      setEditedSettings({ ...allSettings[activeCategory] });
    }
    // Refresh admins when viewing admins category
    if (activeCategory === "admins") {
      fetchAdmins();
    }
  }, [activeCategory, allSettings, fetchAdmins]);

  const handleSave = async () => {
    if (!activeCategory) return;
    
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: activeCategory,
          settings: editedSettings,
        }),
      });
      
      const data = await response.json();
      if (data.ok) {
        setAllSettings((prev) => ({
          ...prev,
          [activeCategory]: { ...editedSettings },
        }));
        setActiveCategory(null);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (key: string, value: unknown) => {
    setEditedSettings((prev) => ({ ...prev, [key]: value }));
  };

  const renderField = (field: SettingField) => {
    const value = editedSettings[field.key];
    
    switch (field.type) {
      case "boolean":
        return (
          <Flex key={field.key} justify="space-between" align="center" py={3} borderBottom="1px solid" borderColor="gray.100">
            <Text fontWeight="500">{field.label}</Text>
            <Switch.Root
              checked={value as boolean}
              onCheckedChange={(e) => handleFieldChange(field.key, e.checked)}
            >
              <Switch.HiddenInput />
              <Switch.Control>
                <Switch.Thumb />
              </Switch.Control>
            </Switch.Root>
          </Flex>
        );
      case "select":
        return (
          <Flex key={field.key} justify="space-between" align="center" py={3} borderBottom="1px solid" borderColor="gray.100">
            <Text fontWeight="500">{field.label}</Text>
            <select
              value={value as string || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid #e2e8f0",
                minWidth: "150px",
              }}
            >
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </Flex>
        );
      case "number":
        return (
          <Flex key={field.key} justify="space-between" align="center" py={3} borderBottom="1px solid" borderColor="gray.100">
            <Text fontWeight="500">{field.label}</Text>
            <Input
              type="number"
              value={value as number || 0}
              onChange={(e) => handleFieldChange(field.key, parseInt(e.target.value) || 0)}
              w="150px"
              textAlign="center"
            />
          </Flex>
        );
      default:
        return (
          <Flex key={field.key} justify="space-between" align="center" py={3} borderBottom="1px solid" borderColor="gray.100" gap={4}>
            <Text fontWeight="500" whiteSpace="nowrap">{field.label}</Text>
            <Input
              value={value as string || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              flex={1}
              maxW="300px"
            />
          </Flex>
        );
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Text color="muted">جاري التحميل...</Text>
      </Flex>
    );
  }

  // Show category detail view
  if (activeCategory) {
    const category = settingsCategories.find((c) => c.key === activeCategory);
    if (!category) return null;

    // Custom view for admins management
    if (activeCategory === "admins") {
      return (
        <Stack gap={8}>
          <Flex justify="space-between" align="center">
            <Stack gap={2}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveCategory(null)}
              >
                ← العودة
              </Button>
              <Heading size="xl">{category.icon} {category.title}</Heading>
              <Text color="muted">{category.description}</Text>
            </Stack>
          </Flex>

          <PremiumCard p={6}>
            <Stack gap={6}>
              {/* Add new admin form */}
              <Box borderBottom="1px solid" borderColor="gray.200" pb={6}>
                <Text fontWeight="700" mb={4} fontSize="lg">➕ إضافة مشرف جديد</Text>
                <Stack gap={3}>
                  <HStack gap={3}>
                    <Input
                      placeholder="اسم المشرف"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      flex={1}
                    />
                    <Input
                      placeholder="البريد الإلكتروني"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      flex={1}
                      dir="ltr"
                    />
                  </HStack>
                  <Button
                    bg="primary"
                    color="white"
                    onClick={handleAddAdmin}
                    disabled={adminLoading}
                    _hover={{ bg: "brand.700" }}
                    alignSelf="start"
                  >
                    {adminLoading ? "جاري الإضافة..." : "➕ إضافة مشرف"}
                  </Button>
                </Stack>
                {adminError && (
                  <Text color="red.500" fontSize="sm" mt={2}>{adminError}</Text>
                )}
              </Box>

              {/* Filter and stats */}
              <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
                <HStack gap={4}>
                  <Text fontWeight="600">المشرفون ({filteredAdmins.length})</Text>
                  <HStack gap={2}>
                    <Badge colorPalette="green" variant="subtle">
                      نشط: {admins.filter(a => a.status === "active").length}
                    </Badge>
                    <Badge colorPalette="red" variant="subtle">
                      معلق: {admins.filter(a => a.status === "suspended").length}
                    </Badge>
                    <Badge colorPalette="yellow" variant="subtle">
                      ثابت: {admins.filter(a => a.isStatic).length}
                    </Badge>
                  </HStack>
                </HStack>
                <HStack gap={2}>
                  <Button 
                    size="sm" 
                    variant={filterStatus === "all" ? "solid" : "outline"}
                    onClick={() => setFilterStatus("all")}
                  >
                    الكل
                  </Button>
                  <Button 
                    size="sm" 
                    variant={filterStatus === "active" ? "solid" : "outline"}
                    colorPalette="green"
                    onClick={() => setFilterStatus("active")}
                  >
                    نشط
                  </Button>
                  <Button 
                    size="sm" 
                    variant={filterStatus === "suspended" ? "solid" : "outline"}
                    colorPalette="red"
                    onClick={() => setFilterStatus("suspended")}
                  >
                    معلق
                  </Button>
                </HStack>
              </Flex>

              {/* Admin list */}
              <Stack gap={3}>
                {filteredAdmins.map((admin) => (
                  <Box key={admin.email}>
                    {/* Edit mode */}
                    {editingAdmin?.email === admin.email ? (
                      <Box
                        p={4}
                        bg="blue.50"
                        borderRadius="lg"
                        border="2px solid"
                        borderColor="blue.300"
                      >
                        <Text fontWeight="600" mb={3}>✏️ تعديل المشرف</Text>
                        <Stack gap={3}>
                          <HStack gap={3}>
                            <Box flex={1}>
                              <Text fontSize="xs" color="muted" mb={1}>الاسم</Text>
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                bg="white"
                              />
                            </Box>
                            <Box flex={1}>
                              <Text fontSize="xs" color="muted" mb={1}>البريد الإلكتروني</Text>
                              <Input
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                dir="ltr"
                                bg="white"
                              />
                            </Box>
                          </HStack>
                          <HStack gap={2}>
                            <Button
                              size="sm"
                              bg="primary"
                              color="white"
                              onClick={handleEditAdmin}
                              disabled={adminLoading}
                            >
                              💾 حفظ
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelEditing}
                            >
                              إلغاء
                            </Button>
                          </HStack>
                        </Stack>
                      </Box>
                    ) : (
                      /* View mode */
                      <Flex
                        justify="space-between"
                        align="center"
                        p={4}
                        bg={admin.status === "suspended" ? "red.50" : admin.isStatic ? "yellow.50" : "gray.50"}
                        borderRadius="lg"
                        border="1px solid"
                        borderColor={admin.status === "suspended" ? "red.200" : admin.isStatic ? "yellow.200" : "gray.200"}
                        opacity={admin.status === "suspended" ? 0.8 : 1}
                      >
                        <HStack gap={4}>
                          <Box
                            w="45px"
                            h="45px"
                            bg={admin.status === "suspended" ? "red.200" : admin.isStatic ? "yellow.200" : "brand.100"}
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Text fontSize="xl">
                              {admin.status === "suspended" ? "🚫" : admin.isStatic ? "⚡" : "👤"}
                            </Text>
                          </Box>
                          <Box>
                            <HStack gap={2}>
                              <Text fontWeight="600">{admin.name || "بدون اسم"}</Text>
                              {admin.isStatic && (
                                <Badge colorPalette="yellow" size="sm">ثابت</Badge>
                              )}
                              {admin.status === "suspended" && (
                                <Badge colorPalette="red" size="sm">معلق</Badge>
                              )}
                              {admin.status === "active" && !admin.isStatic && (
                                <Badge colorPalette="green" size="sm">نشط</Badge>
                              )}
                            </HStack>
                            <Text fontSize="sm" color="muted" dir="ltr">{admin.email}</Text>
                            {admin.addedAt && (
                              <Text fontSize="xs" color="muted">
                                أُضيف: {new Date(admin.addedAt).toLocaleDateString("ar-SA")}
                                {admin.addedBy && ` بواسطة ${admin.addedBy}`}
                              </Text>
                            )}
                            {admin.suspendedAt && admin.status === "suspended" && (
                              <Text fontSize="xs" color="red.600">
                                عُلّق: {new Date(admin.suspendedAt).toLocaleDateString("ar-SA")}
                                {admin.suspendReason && ` - السبب: ${admin.suspendReason}`}
                              </Text>
                            )}
                          </Box>
                        </HStack>
                        
                        {/* Actions */}
                        <HStack gap={1}>
                          {!admin.isStatic && (
                            <>
                              {admin.status === "active" ? (
                                <>
                                  <IconButton
                                    aria-label="تعديل المشرف"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEditing(admin)}
                                    disabled={adminLoading}
                                    title="تعديل"
                                  >
                                    ✏️
                                  </IconButton>
                                  <IconButton
                                    aria-label="تعليق المشرف"
                                    variant="ghost"
                                    colorPalette="orange"
                                    size="sm"
                                    onClick={() => setShowSuspendModal(admin.email)}
                                    disabled={adminLoading}
                                    title="تعليق"
                                  >
                                    ⏸️
                                  </IconButton>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  colorPalette="green"
                                  variant="outline"
                                  onClick={() => handleActivateAdmin(admin.email)}
                                  disabled={adminLoading}
                                >
                                  تفعيل
                                </Button>
                              )}
                              <IconButton
                                aria-label="حذف المشرف"
                                variant="ghost"
                                colorPalette="red"
                                size="sm"
                                onClick={() => handleRemoveAdmin(admin.email)}
                                disabled={adminLoading}
                                title="حذف نهائي"
                              >
                                🗑️
                              </IconButton>
                            </>
                          )}
                        </HStack>
                      </Flex>
                    )}

                    {/* Suspend Modal */}
                    {showSuspendModal === admin.email && (
                      <Box
                        mt={2}
                        p={4}
                        bg="orange.50"
                        borderRadius="lg"
                        border="2px solid"
                        borderColor="orange.300"
                      >
                        <Text fontWeight="600" mb={3}>⏸️ تعليق المشرف</Text>
                        <Text fontSize="sm" color="muted" mb={3}>
                          سيتم منع هذا المشرف من الوصول إلى لوحة التحكم حتى يتم تفعيله مرة أخرى.
                        </Text>
                        <Stack gap={3}>
                          <Box>
                            <Text fontSize="xs" color="muted" mb={1}>سبب التعليق (اختياري)</Text>
                            <Input
                              value={suspendReason}
                              onChange={(e) => setSuspendReason(e.target.value)}
                              placeholder="أدخل سبب التعليق..."
                              bg="white"
                            />
                          </Box>
                          <HStack gap={2}>
                            <Button
                              size="sm"
                              colorPalette="orange"
                              onClick={() => handleSuspendAdmin(admin.email)}
                              disabled={adminLoading}
                            >
                              ⏸️ تعليق
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowSuspendModal(null);
                                setSuspendReason("");
                              }}
                            >
                              إلغاء
                            </Button>
                          </HStack>
                        </Stack>
                      </Box>
                    )}
                  </Box>
                ))}
                {filteredAdmins.length === 0 && (
                  <Text color="muted" textAlign="center" py={8}>
                    {filterStatus === "all" 
                      ? "لا يوجد مشرفون مسجلون" 
                      : filterStatus === "active" 
                        ? "لا يوجد مشرفون نشطون"
                        : "لا يوجد مشرفون معلقون"
                    }
                  </Text>
                )}
              </Stack>

              {/* Info box */}
              <Box bg="blue.50" p={4} borderRadius="lg" border="1px solid" borderColor="blue.200">
                <Text fontSize="sm" color="blue.800" fontWeight="600" mb={2}>
                  📋 دليل الإدارة
                </Text>
                <Stack gap={1} fontSize="sm" color="blue.700">
                  <Text>• <strong>إضافة:</strong> أدخل اسم وبريد المشرف الجديد ثم اضغط إضافة</Text>
                  <Text>• <strong>تعديل:</strong> اضغط ✏️ لتعديل اسم أو بريد المشرف</Text>
                  <Text>• <strong>تعليق:</strong> اضغط ⏸️ لمنع المشرف مؤقتاً من الوصول</Text>
                  <Text>• <strong>تفعيل:</strong> اضغط "تفعيل" لإعادة صلاحية مشرف معلق</Text>
                  <Text>• <strong>حذف:</strong> اضغط 🗑️ لحذف المشرف نهائياً</Text>
                  <Text color="orange.600">• المشرفون الثابتون (⚡) محددون في ملف الإعدادات ولا يمكن تعديلهم من هنا</Text>
                </Stack>
              </Box>
            </Stack>
          </PremiumCard>
        </Stack>
      );
    }

    // Standard category view
    return (
      <Stack gap={8}>
        <Flex justify="space-between" align="center">
          <Stack gap={2}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveCategory(null)}
            >
              ← العودة
            </Button>
            <Heading size="xl">{category.icon} {category.title}</Heading>
            <Text color="muted">{category.description}</Text>
          </Stack>
          <Button
            bg="primary"
            color="white"
            onClick={handleSave}
            loading={saving}
            _hover={{ bg: "brand.700" }}
          >
            💾 حفظ التغييرات
          </Button>
        </Flex>

        <PremiumCard p={6}>
          <Stack gap={0}>
            {category.fields.map(renderField)}
          </Stack>
        </PremiumCard>
      </Stack>
    );
  }

  // Show category list
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
            إعدادات المنصة
          </Badge>
          <Heading size="2xl" bgGradient="linear(135deg, text 0%, brand.900 100%)" bgClip="text">
            إعدادات الإدارة
          </Heading>
          <Text color="muted" fontSize="lg" lineHeight="1.7">
            تحكم كامل في المنصة وإعداداتها التشغيلية والبنية التحتية.
          </Text>
        </Stack>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
        {settingsCategories.map((category) => (
          <PremiumCard 
            key={category.key} 
            variant="default" 
            p={6}
            cursor="pointer"
            _hover={{ transform: "translateY(-2px)", boxShadow: "lg" }}
            transition="all 0.2s"
            onClick={() => setActiveCategory(category.key)}
          >
            <Stack gap={4}>
              <Flex align="center" gap={3}>
                <Text fontSize="2xl">{category.icon}</Text>
                <Heading size="md" fontWeight="700">{category.title}</Heading>
              </Flex>
              <Text color="muted" lineHeight="1.7">{category.description}</Text>
              <Button 
                variant="outline" 
                borderColor="outlineBorder"
                borderWidth="2px"
                color="outlineText" 
                alignSelf="start"
                _hover={{ bg: "brand.50", borderColor: "brand.600" }}
                transition="all 0.3s ease"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveCategory(category.key);
                }}
              >
                فتح الإعدادات
              </Button>
            </Stack>
          </PremiumCard>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
