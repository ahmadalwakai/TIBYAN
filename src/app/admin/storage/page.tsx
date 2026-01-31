"use client";

import { Badge, Button, Flex, Heading, SimpleGrid, Stack, Text, Table } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import PremiumCard from "@/components/ui/PremiumCard";

interface StorageStats {
  database: {
    courses: { total: number; withThumbnails: number };
    lessons: { total: number; withVideos: number };
  };
  storage: {
    files: number;
    totalSizeBytes: number;
    totalSizeMB: string;
  };
  limits: {
    maxUploadSizeMB: number;
    allowedTypes: string[];
  };
}

interface FileEntry {
  name: string;
  isDirectory: boolean;
  size: number;
  modified: string;
  path: string;
}

export default function AdminStoragePage() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [currentFolder, setCurrentFolder] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"stats" | "files">("stats");

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/storage?action=stats");
      const data = await response.json();
      if (data.ok) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching storage stats:", error);
    }
  };

  const fetchFiles = async (folder: string = "") => {
    try {
      const response = await fetch(`/api/admin/storage?action=files&folder=${encodeURIComponent(folder)}`);
      const data = await response.json();
      if (data.ok) {
        setFiles(data.data.files);
        setCurrentFolder(data.data.folder);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchStats();
      await fetchFiles("");
      setLoading(false);
    };
    loadData();
  }, []);

  const handleNavigate = (folder: string) => {
    fetchFiles(folder);
  };

  const handleBack = () => {
    const parentFolder = currentFolder.split("/").slice(0, -1).join("/");
    fetchFiles(parentFolder);
  };

  const handleDelete = async (filePath: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الملف؟")) return;

    try {
      const response = await fetch(`/api/admin/storage?path=${encodeURIComponent(filePath)}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.ok) {
        fetchFiles(currentFolder);
        fetchStats();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (file: FileEntry): string => {
    if (file.isDirectory) return "📁";
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) return "🖼️";
    if (["mp4", "webm", "mov"].includes(ext || "")) return "🎥";
    if (["pdf"].includes(ext || "")) return "📄";
    if (["vtt", "srt"].includes(ext || "")) return "📝";
    return "📎";
  };

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
            التخزين والبث
          </Badge>
          <Heading size="2xl" bgGradient="linear(135deg, text 0%, brand.900 100%)" bgClip="text">
            إدارة التخزين
          </Heading>
          <Text color="muted" fontSize="lg" lineHeight="1.7">
            تحكم بالبنية التحتية للملفات والبث المرئي والتوزيع.
          </Text>
        </Stack>

        <Flex gap={2}>
          <Button
            variant={view === "stats" ? "solid" : "outline"}
            bg={view === "stats" ? "brand.900" : undefined}
            color={view === "stats" ? "white" : undefined}
            onClick={() => setView("stats")}
          >
            📊 الإحصائيات
          </Button>
          <Button
            variant={view === "files" ? "solid" : "outline"}
            bg={view === "files" ? "brand.900" : undefined}
            color={view === "files" ? "white" : undefined}
            onClick={() => setView("files")}
          >
            📁 الملفات
          </Button>
        </Flex>
      </Flex>

      {view === "stats" && stats && (
        <>
          {/* Storage Overview */}
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
            <PremiumCard p={6} textAlign="center">
              <Text fontSize="3xl">💾</Text>
              <Text fontSize="3xl" fontWeight="bold" mt={2}>{stats.storage.totalSizeMB} MB</Text>
              <Text color="muted">الحجم الإجمالي</Text>
              <Text fontSize="sm" color="muted" mt={1}>{stats.storage.files} ملف</Text>
            </PremiumCard>

            <PremiumCard p={6} textAlign="center">
              <Text fontSize="3xl">📚</Text>
              <Text fontSize="3xl" fontWeight="bold" mt={2}>{stats.database.courses.total}</Text>
              <Text color="muted">الدورات</Text>
              <Text fontSize="sm" color="green.500" mt={1}>
                {stats.database.courses.withThumbnails} مع صور
              </Text>
            </PremiumCard>

            <PremiumCard p={6} textAlign="center">
              <Text fontSize="3xl">🎥</Text>
              <Text fontSize="3xl" fontWeight="bold" mt={2}>{stats.database.lessons.total}</Text>
              <Text color="muted">الدروس</Text>
              <Text fontSize="sm" color="green.500" mt={1}>
                {stats.database.lessons.withVideos} مع فيديو
              </Text>
            </PremiumCard>
          </SimpleGrid>

          {/* Limits & Config */}
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            <PremiumCard p={6}>
              <Heading size="sm" mb={4}>⚙️ حدود الرفع</Heading>
              <Stack gap={3}>
                <Flex justify="space-between">
                  <Text>الحد الأقصى لحجم الملف</Text>
                  <Text fontWeight="bold">{stats.limits.maxUploadSizeMB} MB</Text>
                </Flex>
              </Stack>
            </PremiumCard>

            <PremiumCard p={6}>
              <Heading size="sm" mb={4}>📎 أنواع الملفات المسموحة</Heading>
              <Flex gap={2} wrap="wrap">
                {stats.limits.allowedTypes.map((type) => (
                  <Badge key={type} colorPalette="blue" px={2} py={1}>
                    {type.split("/")[1]}
                  </Badge>
                ))}
              </Flex>
            </PremiumCard>
          </SimpleGrid>
        </>
      )}

      {view === "files" && (
        <PremiumCard p={6}>
          <Stack gap={4}>
            <Flex justify="space-between" align="center">
              <Flex align="center" gap={2}>
                {currentFolder && (
                  <Button size="sm" variant="ghost" onClick={handleBack}>
                    ← رجوع
                  </Button>
                )}
                <Text fontWeight="500">
                  📁 /{currentFolder || "public"}
                </Text>
              </Flex>
              <Button size="sm" variant="outline" onClick={() => fetchFiles(currentFolder)}>
                🔄 تحديث
              </Button>
            </Flex>

            {files.length === 0 ? (
              <Flex justify="center" p={8}>
                <Text color="muted">لا توجد ملفات</Text>
              </Flex>
            ) : (
              <Table.Root size="sm">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>الاسم</Table.ColumnHeader>
                    <Table.ColumnHeader>الحجم</Table.ColumnHeader>
                    <Table.ColumnHeader>تاريخ التعديل</Table.ColumnHeader>
                    <Table.ColumnHeader>الإجراءات</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {files.map((file) => (
                    <Table.Row key={file.path}>
                      <Table.Cell>
                        <Flex align="center" gap={2}>
                          <Text>{getFileIcon(file)}</Text>
                          {file.isDirectory ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleNavigate(file.path)}
                            >
                              {file.name}
                            </Button>
                          ) : (
                            <Text>{file.name}</Text>
                          )}
                        </Flex>
                      </Table.Cell>
                      <Table.Cell>
                        {file.isDirectory ? "-" : formatBytes(file.size)}
                      </Table.Cell>
                      <Table.Cell>
                        {new Date(file.modified).toLocaleDateString("ar-SA")}
                      </Table.Cell>
                      <Table.Cell>
                        <Button
                          size="xs"
                          colorPalette="red"
                          variant="outline"
                          onClick={() => handleDelete(file.path)}
                        >
                          حذف
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </Stack>
        </PremiumCard>
      )}
    </Stack>
  );
}
