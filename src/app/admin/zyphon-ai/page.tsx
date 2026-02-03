"use client";

import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Stack,
  Table,
  Tabs,
  Text,
  Textarea,
  IconButton,
  HStack,
} from "@chakra-ui/react";
import { useState, useEffect, useCallback } from "react";
import PremiumCard from "@/components/ui/PremiumCard";

// Types
interface ZyphonApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  isActive: boolean;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

interface ZyphonSettings {
  defaultLanguageMode: "auto" | "locked_ar" | "locked_en";
  strictNoThirdLanguage: boolean;
  defaultMaxTokens: number;
  externalEndpointEnabled: boolean;
}

interface ZyphonAuditLog {
  id: string;
  action: string;
  keyPrefix: string | null;
  ip: string | null;
  userAgent: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
  actorUserId: string | null;
}

// Available scopes
const AVAILABLE_SCOPES = [
  { value: "chat:read", label: "قراءة المحادثات" },
  { value: "chat:write", label: "إرسال رسائل" },
  { value: "knowledge:read", label: "قراءة قاعدة المعرفة" },
];

export default function ZyphonAIPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<"keys" | "settings" | "logs">("keys");

  // Keys state
  const [keys, setKeys] = useState<ZyphonApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScopes, setNewKeyScopes] = useState<string[]>(["chat:write"]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createdRawKey, setCreatedRawKey] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState<ZyphonSettings>({
    defaultLanguageMode: "auto",
    strictNoThirdLanguage: true,
    defaultMaxTokens: 2048,
    externalEndpointEnabled: true,
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Logs state
  const [logs, setLogs] = useState<ZyphonAuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsFilter, setLogsFilter] = useState<{ action?: string; keyPrefix?: string }>({});

  // Fetch keys
  const fetchKeys = useCallback(async () => {
    setKeysLoading(true);
    try {
      const res = await fetch("/api/admin/zyphon-ai/keys");
      const data = await res.json();
      if (data.ok) {
        setKeys(data.data.keys);
      }
    } catch (error) {
      console.error("Failed to fetch keys:", error);
    } finally {
      setKeysLoading(false);
    }
  }, []);

  // Fetch settings
  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/admin/zyphon-ai/settings");
      const data = await res.json();
      if (data.ok) {
        setSettings(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams();
      if (logsFilter.action) params.set("action", logsFilter.action);
      if (logsFilter.keyPrefix) params.set("keyPrefix", logsFilter.keyPrefix);
      const res = await fetch(`/api/admin/zyphon-ai/logs?${params.toString()}`);
      const data = await res.json();
      if (data.ok) {
        setLogs(data.data.logs);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLogsLoading(false);
    }
  }, [logsFilter]);

  // Effects
  useEffect(() => {
    fetchKeys();
    fetchSettings();
  }, [fetchKeys, fetchSettings]);

  useEffect(() => {
    if (activeTab === "logs") {
      fetchLogs();
    }
  }, [activeTab, fetchLogs]);

  // Create new key
  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    setActionLoading("create");
    try {
      const res = await fetch("/api/admin/zyphon-ai/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName, scopes: newKeyScopes }),
      });
      const data = await res.json();
      if (data.ok) {
        setCreatedRawKey(data.data.rawKey);
        setNewKeyName("");
        setNewKeyScopes(["chat:write"]);
        await fetchKeys();
      } else {
        alert(data.error || "فشل في إنشاء المفتاح");
      }
    } catch (error) {
      console.error("Failed to create key:", error);
      alert("فشل في إنشاء المفتاح");
    } finally {
      setActionLoading(null);
    }
  };

  // Revoke key
  const handleRevokeKey = async (id: string) => {
    if (!confirm("هل أنت متأكد من إلغاء هذا المفتاح؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    setActionLoading(`revoke-${id}`);
    try {
      const res = await fetch(`/api/admin/zyphon-ai/keys/${id}/revoke`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.ok) {
        await fetchKeys();
      } else {
        alert(data.error || "فشل في إلغاء المفتاح");
      }
    } catch (error) {
      console.error("Failed to revoke key:", error);
      alert("فشل في إلغاء المفتاح");
    } finally {
      setActionLoading(null);
    }
  };

  // Rotate key
  const handleRotateKey = async (id: string) => {
    if (!confirm("هل أنت متأكد من تدوير هذا المفتاح؟ سيتم إنشاء مفتاح جديد وإلغاء القديم.")) return;
    setActionLoading(`rotate-${id}`);
    try {
      const res = await fetch(`/api/admin/zyphon-ai/keys/${id}/rotate`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.ok) {
        setCreatedRawKey(data.data.rawKey);
        await fetchKeys();
      } else {
        alert(data.error || "فشل في تدوير المفتاح");
      }
    } catch (error) {
      console.error("Failed to rotate key:", error);
      alert("فشل في تدوير المفتاح");
    } finally {
      setActionLoading(null);
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    setSettingsSaving(true);
    try {
      const res = await fetch("/api/admin/zyphon-ai/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.ok) {
        alert("تم حفظ الإعدادات بنجاح");
      } else {
        alert(data.error || "فشل في حفظ الإعدادات");
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("فشل في حفظ الإعدادات");
    } finally {
      setSettingsSaving(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("تم النسخ!");
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      alert("تم النسخ!");
    }
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("ar-EG");
  };

  // Mask key
  const maskKey = (prefix: string) => `${prefix}••••••••`;

  return (
    <Stack gap={10}>
      {/* Header */}
      <Flex direction={{ base: "column", md: "row" }} gap={6} justify="space-between">
        <Stack gap={3}>
          <Badge
            bg="purple.500"
            color="white"
            px={3}
            py={1}
            borderRadius="badge"
            fontSize="xs"
            fontWeight="600"
            w="fit-content"
          >
            🤖 Zyphon AI
          </Badge>
          <Heading size="2xl" color="text">
            إدارة Zyphon AI
          </Heading>
          <Text color="muted" fontSize="lg" lineHeight="1.7">
            إدارة مفاتيح API والتكاملات الخارجية وسجلات الاستخدام.
          </Text>
        </Stack>
      </Flex>

      {/* Tabs */}
      <Box>
        <Tabs.Root value={activeTab} onValueChange={(e) => setActiveTab(e.value as typeof activeTab)}>
          <Tabs.List mb={6}>
            <Tabs.Trigger value="keys" px={6} py={3}>
              🔑 مفاتيح API
            </Tabs.Trigger>
            <Tabs.Trigger value="settings" px={6} py={3}>
              ⚙️ الإعدادات
            </Tabs.Trigger>
            <Tabs.Trigger value="logs" px={6} py={3}>
              📊 السجلات
            </Tabs.Trigger>
          </Tabs.List>

          {/* API Keys Tab */}
          <Tabs.Content value="keys">
            <Stack gap={6}>
              {/* Create Key Section */}
              <PremiumCard variant="bordered" p={6}>
                <Stack gap={4}>
                  <Text fontWeight="700" fontSize="lg">إنشاء مفتاح جديد</Text>
                  {!showCreateModal ? (
                    <Button
                      bg="purple.500"
                      color="white"
                      _hover={{ bg: "purple.600" }}
                      onClick={() => setShowCreateModal(true)}
                      w="fit-content"
                    >
                      + إنشاء مفتاح API
                    </Button>
                  ) : (
                    <Stack gap={4}>
                      <Box>
                        <Text mb={2} fontWeight="600">اسم المفتاح</Text>
                        <Input
                          value={newKeyName}
                          onChange={(e) => setNewKeyName(e.target.value)}
                          placeholder="مثال: تطبيق الجوال"
                          maxLength={100}
                        />
                      </Box>
                      <Box>
                        <Text mb={2} fontWeight="600">الصلاحيات</Text>
                        <HStack gap={3} flexWrap="wrap">
                          {AVAILABLE_SCOPES.map((scope) => (
                            <Button
                              key={scope.value}
                              size="sm"
                              variant={newKeyScopes.includes(scope.value) ? "solid" : "outline"}
                              bg={newKeyScopes.includes(scope.value) ? "purple.500" : undefined}
                              color={newKeyScopes.includes(scope.value) ? "white" : undefined}
                              onClick={() => {
                                if (newKeyScopes.includes(scope.value)) {
                                  setNewKeyScopes(newKeyScopes.filter((s) => s !== scope.value));
                                } else {
                                  setNewKeyScopes([...newKeyScopes, scope.value]);
                                }
                              }}
                            >
                              {scope.label}
                            </Button>
                          ))}
                        </HStack>
                      </Box>
                      <HStack gap={3}>
                        <Button
                          bg="purple.500"
                          color="white"
                          _hover={{ bg: "purple.600" }}
                          onClick={handleCreateKey}
                          loading={actionLoading === "create"}
                          disabled={!newKeyName.trim() || newKeyScopes.length === 0}
                        >
                          إنشاء
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowCreateModal(false);
                            setNewKeyName("");
                            setNewKeyScopes(["chat:write"]);
                          }}
                        >
                          إلغاء
                        </Button>
                      </HStack>
                    </Stack>
                  )}
                </Stack>
              </PremiumCard>

              {/* Created Key Modal */}
              {createdRawKey && (
                <PremiumCard variant="bordered" p={6} bg="green.50" borderColor="green.500">
                  <Stack gap={4}>
                    <HStack>
                      <Text fontSize="xl">✅</Text>
                      <Text fontWeight="700" fontSize="lg" color="green.700">تم إنشاء المفتاح بنجاح!</Text>
                    </HStack>
                    <Box bg="white" p={4} borderRadius="md" border="1px solid" borderColor="green.300">
                      <Text fontWeight="600" mb={2} color="red.600">⚠️ احفظ هذا المفتاح الآن! لن يظهر مرة أخرى.</Text>
                      <Textarea
                        value={createdRawKey}
                        readOnly
                        fontFamily="mono"
                        fontSize="sm"
                        rows={2}
                        bg="gray.50"
                      />
                    </Box>
                    <HStack gap={3}>
                      <Button
                        bg="green.500"
                        color="white"
                        _hover={{ bg: "green.600" }}
                        onClick={() => copyToClipboard(createdRawKey)}
                      >
                        📋 نسخ المفتاح
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setCreatedRawKey(null)}
                      >
                        إغلاق
                      </Button>
                    </HStack>
                  </Stack>
                </PremiumCard>
              )}

              {/* Keys Table */}
              <PremiumCard variant="bordered" p={6}>
                <Stack gap={4}>
                  <Text fontWeight="700" fontSize="lg">المفاتيح الحالية</Text>
                  {keysLoading ? (
                    <Text color="muted">جاري التحميل...</Text>
                  ) : keys.length === 0 ? (
                    <Text color="muted">لا توجد مفاتيح API بعد.</Text>
                  ) : (
                    <Box overflowX="auto">
                      <Table.Root size="sm">
                        <Table.Header>
                          <Table.Row>
                            <Table.ColumnHeader>الاسم</Table.ColumnHeader>
                            <Table.ColumnHeader>المفتاح</Table.ColumnHeader>
                            <Table.ColumnHeader>الصلاحيات</Table.ColumnHeader>
                            <Table.ColumnHeader>الحالة</Table.ColumnHeader>
                            <Table.ColumnHeader>تاريخ الإنشاء</Table.ColumnHeader>
                            <Table.ColumnHeader>آخر استخدام</Table.ColumnHeader>
                            <Table.ColumnHeader>الإجراءات</Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {keys.map((key) => (
                            <Table.Row key={key.id}>
                              <Table.Cell fontWeight="600">{key.name}</Table.Cell>
                              <Table.Cell fontFamily="mono" fontSize="sm">{maskKey(key.prefix)}</Table.Cell>
                              <Table.Cell>
                                <HStack gap={1} flexWrap="wrap">
                                  {key.scopes.map((scope) => (
                                    <Badge key={scope} size="sm" colorPalette="purple">
                                      {scope}
                                    </Badge>
                                  ))}
                                </HStack>
                              </Table.Cell>
                              <Table.Cell>
                                <Badge colorPalette={key.isActive && !key.revokedAt ? "green" : "red"}>
                                  {key.isActive && !key.revokedAt ? "نشط" : "ملغى"}
                                </Badge>
                              </Table.Cell>
                              <Table.Cell fontSize="sm">{formatDate(key.createdAt)}</Table.Cell>
                              <Table.Cell fontSize="sm">{formatDate(key.lastUsedAt)}</Table.Cell>
                              <Table.Cell>
                                {key.isActive && !key.revokedAt ? (
                                  <HStack gap={2}>
                                    <IconButton
                                      aria-label="تدوير المفتاح"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRotateKey(key.id)}
                                      loading={actionLoading === `rotate-${key.id}`}
                                    >
                                      🔄
                                    </IconButton>
                                    <IconButton
                                      aria-label="إلغاء المفتاح"
                                      size="sm"
                                      variant="outline"
                                      colorPalette="red"
                                      onClick={() => handleRevokeKey(key.id)}
                                      loading={actionLoading === `revoke-${key.id}`}
                                    >
                                      🗑️
                                    </IconButton>
                                  </HStack>
                                ) : (
                                  <Text color="muted" fontSize="sm">—</Text>
                                )}
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                    </Box>
                  )}
                </Stack>
              </PremiumCard>
            </Stack>
          </Tabs.Content>

          {/* Settings Tab */}
          <Tabs.Content value="settings">
            <PremiumCard variant="bordered" p={6}>
              <Stack gap={6}>
                <Text fontWeight="700" fontSize="lg">إعدادات التكامل الخارجي</Text>
                
                {settingsLoading ? (
                  <Text color="muted">جاري التحميل...</Text>
                ) : (
                  <Stack gap={5}>
                    {/* External Endpoint Toggle */}
                    <Box>
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="600">تفعيل نقطة النهاية الخارجية</Text>
                        <Button
                          size="sm"
                          variant={settings.externalEndpointEnabled ? "solid" : "outline"}
                          bg={settings.externalEndpointEnabled ? "green.500" : undefined}
                          color={settings.externalEndpointEnabled ? "white" : undefined}
                          onClick={() => setSettings({ ...settings, externalEndpointEnabled: !settings.externalEndpointEnabled })}
                        >
                          {settings.externalEndpointEnabled ? "مفعل" : "معطل"}
                        </Button>
                      </HStack>
                      <Text fontSize="sm" color="muted">
                        يتحكم في إمكانية الوصول إلى API من التطبيقات الخارجية.
                      </Text>
                    </Box>

                    {/* Language Mode */}
                    <Box>
                      <Text fontWeight="600" mb={2}>وضع اللغة الافتراضي</Text>
                      <HStack gap={3}>
                        {[
                          { value: "auto", label: "تلقائي" },
                          { value: "locked_ar", label: "عربي فقط" },
                          { value: "locked_en", label: "إنجليزي فقط" },
                        ].map((mode) => (
                          <Button
                            key={mode.value}
                            size="sm"
                            variant={settings.defaultLanguageMode === mode.value ? "solid" : "outline"}
                            bg={settings.defaultLanguageMode === mode.value ? "purple.500" : undefined}
                            color={settings.defaultLanguageMode === mode.value ? "white" : undefined}
                            onClick={() => setSettings({ ...settings, defaultLanguageMode: mode.value as ZyphonSettings["defaultLanguageMode"] })}
                          >
                            {mode.label}
                          </Button>
                        ))}
                      </HStack>
                    </Box>

                    {/* Strict No Third Language */}
                    <Box>
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="600">منع اللغات الأخرى (CJK)</Text>
                        <Button
                          size="sm"
                          variant={settings.strictNoThirdLanguage ? "solid" : "outline"}
                          bg={settings.strictNoThirdLanguage ? "green.500" : undefined}
                          color={settings.strictNoThirdLanguage ? "white" : undefined}
                          onClick={() => setSettings({ ...settings, strictNoThirdLanguage: !settings.strictNoThirdLanguage })}
                        >
                          {settings.strictNoThirdLanguage ? "مفعل" : "معطل"}
                        </Button>
                      </HStack>
                      <Text fontSize="sm" color="muted">
                        يمنع الردود بلغات غير العربية والإنجليزية (مثل الصينية واليابانية).
                      </Text>
                    </Box>

                    {/* Max Tokens */}
                    <Box>
                      <Text fontWeight="600" mb={2}>الحد الأقصى للرموز (tokens)</Text>
                      <Input
                        type="number"
                        value={settings.defaultMaxTokens}
                        onChange={(e) => setSettings({ ...settings, defaultMaxTokens: Math.min(4096, Math.max(256, parseInt(e.target.value) || 2048)) })}
                        min={256}
                        max={4096}
                        w="150px"
                      />
                      <Text fontSize="sm" color="muted" mt={1}>
                        256 - 4096
                      </Text>
                    </Box>

                    {/* Save Button */}
                    <Button
                      bg="purple.500"
                      color="white"
                      _hover={{ bg: "purple.600" }}
                      onClick={handleSaveSettings}
                      loading={settingsSaving}
                      w="fit-content"
                    >
                      حفظ الإعدادات
                    </Button>
                  </Stack>
                )}
              </Stack>
            </PremiumCard>
          </Tabs.Content>

          {/* Logs Tab */}
          <Tabs.Content value="logs">
            <PremiumCard variant="bordered" p={6}>
              <Stack gap={6}>
                <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
                  <Text fontWeight="700" fontSize="lg">سجلات الاستخدام</Text>
                  <HStack gap={3}>
                    <Input
                      placeholder="فلتر حسب الإجراء"
                      value={logsFilter.action || ""}
                      onChange={(e) => setLogsFilter({ ...logsFilter, action: e.target.value || undefined })}
                      w="180px"
                      size="sm"
                    />
                    <Input
                      placeholder="فلتر حسب المفتاح"
                      value={logsFilter.keyPrefix || ""}
                      onChange={(e) => setLogsFilter({ ...logsFilter, keyPrefix: e.target.value || undefined })}
                      w="150px"
                      size="sm"
                    />
                    <Button size="sm" onClick={fetchLogs} variant="outline">
                      🔄 تحديث
                    </Button>
                  </HStack>
                </Flex>

                {logsLoading ? (
                  <Text color="muted">جاري التحميل...</Text>
                ) : logs.length === 0 ? (
                  <Text color="muted">لا توجد سجلات بعد.</Text>
                ) : (
                  <Box overflowX="auto">
                    <Table.Root size="sm">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader>الوقت</Table.ColumnHeader>
                          <Table.ColumnHeader>الإجراء</Table.ColumnHeader>
                          <Table.ColumnHeader>المفتاح</Table.ColumnHeader>
                          <Table.ColumnHeader>IP</Table.ColumnHeader>
                          <Table.ColumnHeader>التفاصيل</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {logs.map((log) => (
                          <Table.Row key={log.id}>
                            <Table.Cell fontSize="sm">{formatDate(log.createdAt)}</Table.Cell>
                            <Table.Cell>
                              <Badge
                                colorPalette={
                                  log.action.includes("denied") || log.action.includes("revoked")
                                    ? "red"
                                    : log.action.includes("created") || log.action.includes("request")
                                    ? "green"
                                    : "gray"
                                }
                              >
                                {log.action}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell fontFamily="mono" fontSize="sm">
                              {log.keyPrefix ? maskKey(log.keyPrefix) : "—"}
                            </Table.Cell>
                            <Table.Cell fontFamily="mono" fontSize="sm">{log.ip || "—"}</Table.Cell>
                            <Table.Cell fontSize="sm" maxW="200px" overflow="hidden" textOverflow="ellipsis">
                              {log.meta ? JSON.stringify(log.meta).slice(0, 50) : "—"}
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                )}
              </Stack>
            </PremiumCard>
          </Tabs.Content>
        </Tabs.Root>
      </Box>
    </Stack>
  );
}
