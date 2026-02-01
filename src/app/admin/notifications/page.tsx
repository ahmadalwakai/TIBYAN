"use client";

import { Badge, Button, Flex, Heading, Input, SimpleGrid, Stack, Text, Table } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import PremiumCard from "@/components/ui/PremiumCard";

interface Notification {
  id: string;
  title: string;
  content: string;
  channel: "EMAIL" | "IN_APP" | "SMS" | "PUSH";
  status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "FAILED";
  targetType: "ALL_USERS" | "STUDENTS" | "TEACHERS" | "SPECIFIC_USERS";
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

interface Stats {
  draft: number;
  scheduled: number;
  sent: number;
  failed: number;
}

const channelLabels: Record<string, string> = {
  EMAIL: "📧 البريد",
  IN_APP: "🔔 داخل المنصة",
  SMS: "📱 SMS",
  PUSH: "📲 إشعار فوري",
};

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "مسودة", color: "gray" },
  SCHEDULED: { label: "مجدول", color: "blue" },
  SENDING: { label: "جاري الإرسال", color: "yellow" },
  SENT: { label: "مُرسل", color: "green" },
  FAILED: { label: "فشل", color: "red" },
};

const targetLabels: Record<string, string> = {
  ALL_USERS: "جميع المستخدمين",
  STUDENTS: "الطلاب",
  TEACHERS: "المعلمين",
  SPECIFIC_USERS: "مستخدمين محددين",
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<Stats>({ draft: 0, scheduled: 0, sent: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [channel, setChannel] = useState<string>("EMAIL");
  const [targetType, setTargetType] = useState<string>("ALL_USERS");
  const [scheduledAt, setScheduledAt] = useState("");

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set("status", filter);
      
      const response = await fetch(`/api/admin/notifications?${params}`, {
        credentials: "include",
      });
      const data = await response.json();
      if (data.ok) {
        setNotifications(data.data.notifications);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setChannel("EMAIL");
    setTargetType("ALL_USERS");
    setScheduledAt("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    try {
      const body = {
        title,
        content,
        channel,
        targetType,
        scheduledAt: scheduledAt || undefined,
        ...(editingId && { id: editingId }),
      };

      const response = await fetch("/api/admin/notifications", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.ok) {
        fetchNotifications();
        resetForm();
      }
    } catch (error) {
      console.error("Error saving notification:", error);
    }
  };

  const handleEdit = (notification: Notification) => {
    setTitle(notification.title);
    setContent(notification.content);
    setChannel(notification.channel);
    setTargetType(notification.targetType);
    setScheduledAt(notification.scheduledAt ? notification.scheduledAt.split("T")[0] : "");
    setEditingId(notification.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإشعار؟")) return;
    
    try {
      const response = await fetch(`/api/admin/notifications?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (data.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleSend = async (id: string) => {
    try {
      const response = await fetch("/api/admin/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "SENT", sentAt: new Date().toISOString() }),
        credentials: "include",
      });
      const data = await response.json();
      if (data.ok) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error sending notification:", error);
    }
  };

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
            الإشعارات
          </Badge>
          <Heading size="2xl" bgGradient="linear(135deg, text 0%, brand.900 100%)" bgClip="text">
            إدارة الإشعارات
          </Heading>
          <Text color="muted" fontSize="lg" lineHeight="1.7">
            إدارة قنوات الإرسال وقوالب الإشعارات والحملات.
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
          {showForm ? "إلغاء" : "➕ إنشاء حملة"}
        </Button>
      </Flex>

      {/* Stats */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4}>
        <PremiumCard p={4} textAlign="center">
          <Text fontSize="2xl" fontWeight="bold">{stats.draft}</Text>
          <Text color="muted" fontSize="sm">مسودة</Text>
        </PremiumCard>
        <PremiumCard p={4} textAlign="center">
          <Text fontSize="2xl" fontWeight="bold" color="blue.500">{stats.scheduled}</Text>
          <Text color="muted" fontSize="sm">مجدول</Text>
        </PremiumCard>
        <PremiumCard p={4} textAlign="center">
          <Text fontSize="2xl" fontWeight="bold" color="green.500">{stats.sent}</Text>
          <Text color="muted" fontSize="sm">مُرسل</Text>
        </PremiumCard>
        <PremiumCard p={4} textAlign="center">
          <Text fontSize="2xl" fontWeight="bold" color="red.500">{stats.failed}</Text>
          <Text color="muted" fontSize="sm">فشل</Text>
        </PremiumCard>
      </SimpleGrid>

      {/* Form */}
      {showForm && (
        <PremiumCard p={6}>
          <Stack gap={4}>
            <Heading size="md">{editingId ? "تعديل الإشعار" : "إنشاء إشعار جديد"}</Heading>
            
            <Stack gap={2}>
              <Text fontWeight="500">العنوان</Text>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="عنوان الإشعار"
              />
            </Stack>

            <Stack gap={2}>
              <Text fontWeight="500">المحتوى</Text>
              <Input 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="محتوى الإشعار"
              />
            </Stack>

            <Flex gap={4} wrap="wrap">
              <Stack gap={2} flex={1} minW="200px">
                <Text fontWeight="500">القناة</Text>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #e2e8f0" }}
                >
                  <option value="EMAIL">البريد الإلكتروني</option>
                  <option value="IN_APP">داخل المنصة</option>
                  <option value="SMS">رسالة نصية</option>
                  <option value="PUSH">إشعار فوري</option>
                </select>
              </Stack>

              <Stack gap={2} flex={1} minW="200px">
                <Text fontWeight="500">المستهدفون</Text>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #e2e8f0" }}
                >
                  <option value="ALL_USERS">جميع المستخدمين</option>
                  <option value="STUDENTS">الطلاب</option>
                  <option value="TEACHERS">المعلمين</option>
                </select>
              </Stack>

              <Stack gap={2} flex={1} minW="200px">
                <Text fontWeight="500">جدولة الإرسال (اختياري)</Text>
                <Input 
                  type="datetime-local" 
                  value={scheduledAt} 
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </Stack>
            </Flex>

            <Flex gap={4} justify="flex-end">
              <Button variant="ghost" onClick={resetForm}>إلغاء</Button>
              <Button 
                bg="primary" 
                color="white" 
                onClick={handleSubmit}
                _hover={{ bg: "brand.700" }}
              >
                {editingId ? "تحديث" : "إنشاء"}
              </Button>
            </Flex>
          </Stack>
        </PremiumCard>
      )}

      {/* Filters */}
      <Flex gap={2} wrap="wrap">
        <Button 
          size="sm" 
          variant={filter === null ? "solid" : "outline"}
          onClick={() => setFilter(null)}
        >
          الكل
        </Button>
        <Button 
          size="sm" 
          variant={filter === "DRAFT" ? "solid" : "outline"}
          onClick={() => setFilter("DRAFT")}
        >
          مسودة
        </Button>
        <Button 
          size="sm" 
          variant={filter === "SCHEDULED" ? "solid" : "outline"}
          onClick={() => setFilter("SCHEDULED")}
        >
          مجدول
        </Button>
        <Button 
          size="sm" 
          variant={filter === "SENT" ? "solid" : "outline"}
          onClick={() => setFilter("SENT")}
        >
          مُرسل
        </Button>
      </Flex>

      {/* Notifications Table */}
      <PremiumCard p={0} overflow="hidden">
        {loading ? (
          <Flex justify="center" p={8}>
            <Text color="muted">جاري التحميل...</Text>
          </Flex>
        ) : notifications.length === 0 ? (
          <Flex justify="center" p={8}>
            <Text color="muted">لا توجد إشعارات</Text>
          </Flex>
        ) : (
          <Table.Root size="sm">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>العنوان</Table.ColumnHeader>
                <Table.ColumnHeader>القناة</Table.ColumnHeader>
                <Table.ColumnHeader>المستهدفون</Table.ColumnHeader>
                <Table.ColumnHeader>الحالة</Table.ColumnHeader>
                <Table.ColumnHeader>التاريخ</Table.ColumnHeader>
                <Table.ColumnHeader>الإجراءات</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {notifications.map((notification) => (
                <Table.Row key={notification.id}>
                  <Table.Cell fontWeight="500">{notification.title}</Table.Cell>
                  <Table.Cell>{channelLabels[notification.channel]}</Table.Cell>
                  <Table.Cell>{targetLabels[notification.targetType]}</Table.Cell>
                  <Table.Cell>
                    <Badge 
                      colorPalette={statusLabels[notification.status].color}
                      px={2}
                      py={1}
                      borderRadius="md"
                    >
                      {statusLabels[notification.status].label}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {new Date(notification.createdAt).toLocaleDateString("ar-SA")}
                  </Table.Cell>
                  <Table.Cell>
                    <Flex gap={2}>
                      {notification.status === "DRAFT" && (
                        <>
                          <Button size="xs" variant="outline" onClick={() => handleEdit(notification)}>
                            تعديل
                          </Button>
                          <Button 
                            size="xs" 
                            bg="green.500" 
                            color="white"
                            onClick={() => handleSend(notification.id)}
                            _hover={{ bg: "green.600" }}
                          >
                            إرسال
                          </Button>
                        </>
                      )}
                      <Button 
                        size="xs" 
                        variant="outline" 
                        colorPalette="red"
                        onClick={() => handleDelete(notification.id)}
                      >
                        حذف
                      </Button>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </PremiumCard>
    </Stack>
  );
}
