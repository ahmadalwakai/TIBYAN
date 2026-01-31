"use client";

import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Grid,
  HStack,
  Image,
  Input,
  NativeSelect,
  Spinner,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useCallback, useEffect, useState } from "react";
import PremiumCard from "@/components/ui/PremiumCard";
import RichTextEditor, { TextStyling } from "@/components/ui/RichTextEditor";
import MediaUploader, { MediaItem } from "@/components/ui/MediaUploader";

interface PostMedia {
  id: string;
  type: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "PDF";
  url: string;
  filename?: string;
  caption?: string;
  styling?: {
    borderRadius?: string;
    objectFit?: string;
    aspectRatio?: string;
  };
}

interface Post {
  id: string;
  title?: string;
  content: string;
  excerpt?: string;
  styling: TextStyling;
  authorId: string;
  authorType: "ADMIN" | "INSTRUCTOR";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  visibility: "PUBLIC" | "TEACHERS_ONLY" | "PRIVATE";
  isPinned: boolean;
  allowComments: boolean;
  allowLikes: boolean;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  media: PostMedia[];
}

type ModalMode = "create" | "edit" | null;

export default function TeacherPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    styling: {
      fontFamily: "inherit",
      fontSize: "md",
      fontColor: "#000000",
      backgroundColor: "",
      textAlign: "right",
    } as TextStyling,
    status: "DRAFT" as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    visibility: "PUBLIC" as "PUBLIC" | "TEACHERS_ONLY" | "PRIVATE",
    allowComments: true,
    allowLikes: true,
  });
  const [media, setMedia] = useState<MediaItem[]>([]);

  // Fetch my posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("limit", "50");

      const res = await fetch(`/api/social/posts?${params}`);
      const json = await res.json();

      if (json.ok) {
        // Filter to only show my posts (API should do this based on token)
        setPosts(json.data.posts.filter((p: Post) => p.authorType === "INSTRUCTOR"));
      } else {
        toaster.error({ title: json.error || "فشل في جلب المنشورات" });
      }
    } catch {
      toaster.error({ title: "خطأ في الاتصال" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      excerpt: "",
      styling: {
        fontFamily: "inherit",
        fontSize: "md",
        fontColor: "#000000",
        backgroundColor: "",
        textAlign: "right",
      },
      status: "DRAFT",
      visibility: "PUBLIC",
      allowComments: true,
      allowLikes: true,
    });
    setMedia([]);
    setSelectedPost(null);
  };

  // Open create modal
  const handleCreate = () => {
    resetForm();
    setModalMode("create");
  };

  // Open edit modal
  const handleEdit = (post: Post) => {
    setSelectedPost(post);
    setFormData({
      title: post.title || "",
      content: post.content,
      excerpt: post.excerpt || "",
      styling: post.styling || {},
      status: post.status,
      visibility: post.visibility,
      allowComments: post.allowComments,
      allowLikes: post.allowLikes,
    });
    setMedia(post.media.map((m, i) => ({
      id: m.id,
      type: m.type,
      url: m.url,
      filename: m.filename,
      caption: m.caption,
      styling: m.styling,
      order: i,
    })));
    setModalMode("edit");
  };

  // Submit form
  const handleSubmit = async () => {
    if (!formData.content.trim()) {
      toaster.error({ title: "المحتوى مطلوب" });
      return;
    }

    setSubmitting(true);
    try {
      const mediaToSend = media.map((m, i) => ({
        type: m.type,
        url: m.url || m.preview || `https://placeholder.com/${m.id}`,
        filename: m.filename,
        caption: m.caption,
        styling: m.styling,
        order: i,
      }));

      const method = modalMode === "create" ? "POST" : "PUT";
      const body = modalMode === "create"
        ? { ...formData, media: mediaToSend }
        : { ...formData, id: selectedPost?.id, media: mediaToSend };

      const res = await fetch("/api/social/posts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();

      if (json.ok) {
        toaster.success({
          title: modalMode === "create" ? "تم إنشاء المنشور" : "تم تحديث المنشور",
        });
        setModalMode(null);
        resetForm();
        fetchPosts();
      } else {
        toaster.error({ title: json.error || "حدث خطأ" });
      }
    } catch {
      toaster.error({ title: "خطأ في الاتصال" });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete post
  const handleDelete = async (post: Post) => {
    if (!confirm(`هل أنت متأكد من حذف المنشور "${post.title || "بدون عنوان"}"؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/social/posts?id=${post.id}`, {
        method: "DELETE",
      });
      const json = await res.json();

      if (json.ok) {
        toaster.success({ title: "تم حذف المنشور" });
        fetchPosts();
      } else {
        toaster.error({ title: json.error || "فشل في الحذف" });
      }
    } catch {
      toaster.error({ title: "خطأ في الاتصال" });
    }
  };

  // Quick publish
  const handlePublish = async (post: Post) => {
    try {
      const res = await fetch("/api/social/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, status: "PUBLISHED" }),
      });
      const json = await res.json();

      if (json.ok) {
        toaster.success({ title: "تم نشر المنشور" });
        fetchPosts();
      } else {
        toaster.error({ title: json.error });
      }
    } catch {
      toaster.error({ title: "خطأ في الاتصال" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <Badge colorPalette="green">منشور</Badge>;
      case "DRAFT":
        return <Badge colorPalette="yellow">مسودة</Badge>;
      case "ARCHIVED":
        return <Badge colorPalette="gray">مؤرشف</Badge>;
      default:
        return null;
    }
  };

  const getVisibilityBadge = (visibility: string) => {
    switch (visibility) {
      case "PUBLIC":
        return <Badge colorPalette="blue">عام</Badge>;
      case "TEACHERS_ONLY":
        return <Badge colorPalette="purple">للمعلمين</Badge>;
      case "PRIVATE":
        return <Badge colorPalette="gray">خاص</Badge>;
      default:
        return null;
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Text as="h1" fontSize="2xl" fontWeight="700">
            منشوراتي
          </Text>
          <Text color="muted" fontSize="sm">
            شارك المحتوى مع طلابك ومجتمع تبيان
          </Text>
        </Box>
        <Button colorPalette="brand" onClick={handleCreate}>
          ➕ منشور جديد
        </Button>
      </Flex>

      {/* Filters */}
      <PremiumCard variant="bordered" p={4} mb={6}>
        <Flex gap={4} wrap="wrap">
          <Box>
            <NativeSelect.Root size="md">
              <NativeSelect.Field
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                w="150px"
              >
                <option value="all">كل الحالات</option>
                <option value="PUBLISHED">منشور</option>
                <option value="DRAFT">مسودة</option>
                <option value="ARCHIVED">مؤرشف</option>
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Box>
        </Flex>
      </PremiumCard>

      {/* Posts List */}
      {loading ? (
        <Flex justify="center" py={12}>
          <Spinner size="lg" />
        </Flex>
      ) : posts.length === 0 ? (
        <PremiumCard variant="bordered" p={8} textAlign="center">
          <Text fontSize="4xl" mb={2}>✍️</Text>
          <Text fontWeight="600">لا توجد منشورات</Text>
          <Text color="muted" fontSize="sm" mb={4}>
            أنشئ أول منشور للتواصل مع طلابك
          </Text>
          <Button colorPalette="brand" onClick={handleCreate}>
            إنشاء منشور
          </Button>
        </PremiumCard>
      ) : (
        <Stack gap={4}>
          {posts.map((post) => (
            <PremiumCard key={post.id} variant="bordered" p={4}>
              <Flex justify="space-between" align="start" gap={4}>
                <Box flex={1}>
                  <HStack gap={2} mb={2}>
                    {post.isPinned && <Badge colorPalette="orange">📌 مثبت</Badge>}
                    {getStatusBadge(post.status)}
                    {getVisibilityBadge(post.visibility)}
                  </HStack>
                  
                  <Text fontWeight="600" fontSize="lg" mb={1}>
                    {post.title || "(بدون عنوان)"}
                  </Text>
                  
                  <Text color="muted" fontSize="sm" lineClamp={2} mb={2}>
                    {post.excerpt || post.content.substring(0, 150)}
                  </Text>

                  {/* Media preview */}
                  {post.media.length > 0 && (
                    <HStack gap={2} mb={2}>
                      {post.media.slice(0, 4).map((m) => (
                        <Box
                          key={m.id}
                          w={12}
                          h={12}
                          borderRadius="md"
                          overflow="hidden"
                          bg="surface"
                          border="1px solid"
                          borderColor="border"
                        >
                          {m.type === "IMAGE" ? (
                            <Image src={m.url} alt="" w="100%" h="100%" objectFit="cover" />
                          ) : (
                            <Flex w="100%" h="100%" align="center" justify="center">
                              {m.type === "VIDEO" && "🎬"}
                              {m.type === "AUDIO" && "🎵"}
                              {m.type === "PDF" && "📄"}
                              {m.type === "DOCUMENT" && "📁"}
                            </Flex>
                          )}
                        </Box>
                      ))}
                      {post.media.length > 4 && (
                        <Text fontSize="xs" color="muted">
                          +{post.media.length - 4}
                        </Text>
                      )}
                    </HStack>
                  )}

                  <HStack gap={4} fontSize="sm" color="muted">
                    <Text>👁️ {post.viewsCount} مشاهدة</Text>
                    <Text>❤️ {post.likesCount} إعجاب</Text>
                    <Text>💬 {post.commentsCount} تعليق</Text>
                    <Text>
                      {new Date(post.createdAt).toLocaleDateString("ar")}
                    </Text>
                  </HStack>
                </Box>

                <Stack gap={2}>
                  <Button size="sm" variant="outline" onClick={() => handleEdit(post)}>
                    ✏️ تعديل
                  </Button>
                  {post.status === "DRAFT" && (
                    <Button
                      size="sm"
                      colorPalette="green"
                      onClick={() => handlePublish(post)}
                    >
                      نشر
                    </Button>
                  )}
                  <Button
                    size="sm"
                    colorPalette="red"
                    variant="outline"
                    onClick={() => handleDelete(post)}
                  >
                    🗑️ حذف
                  </Button>
                </Stack>
              </Flex>
            </PremiumCard>
          ))}
        </Stack>
      )}

      {/* Create/Edit Modal */}
      {modalMode && (
        <Box
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          zIndex={1000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={4}
          onClick={() => {
            setModalMode(null);
            resetForm();
          }}
        >
          <PremiumCard
            variant="bordered"
            p={6}
            w="100%"
            maxW="800px"
            maxH="90vh"
            overflow="auto"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <Text fontSize="xl" fontWeight="700" mb={4}>
              {modalMode === "create" ? "إنشاء منشور جديد" : "تعديل المنشور"}
            </Text>

            <Stack gap={4}>
              {/* Title */}
              <Box>
                <Text fontWeight="600" mb={2}>العنوان (اختياري)</Text>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="عنوان المنشور..."
                />
              </Box>

              {/* Rich Text Editor */}
              <Box>
                <Text fontWeight="600" mb={2}>المحتوى *</Text>
                <RichTextEditor
                  value={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  styling={formData.styling}
                  onStylingChange={(styling) => setFormData({ ...formData, styling })}
                />
              </Box>

              {/* Excerpt */}
              <Box>
                <Text fontWeight="600" mb={2}>المقتطف (اختياري)</Text>
                <Textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="ملخص قصير للمنشور..."
                  rows={2}
                />
              </Box>

              {/* Media */}
              <Box>
                <Text fontWeight="600" mb={2}>الوسائط</Text>
                <MediaUploader
                  media={media}
                  onChange={setMedia}
                  maxItems={10}
                />
              </Box>

              {/* Options Grid */}
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                <Box>
                  <Text fontWeight="600" mb={2}>الحالة</Text>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED" })}
                    >
                      <option value="DRAFT">مسودة</option>
                      <option value="PUBLISHED">منشور</option>
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Box>

                <Box>
                  <Text fontWeight="600" mb={2}>الظهور</Text>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={formData.visibility}
                      onChange={(e) => setFormData({ ...formData, visibility: e.target.value as "PUBLIC" | "TEACHERS_ONLY" | "PRIVATE" })}
                    >
                      <option value="PUBLIC">عام للجميع</option>
                      <option value="TEACHERS_ONLY">للمعلمين فقط</option>
                      <option value="PRIVATE">خاص</option>
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Box>
              </Grid>

              {/* Toggles */}
              <HStack gap={6}>
                <Checkbox.Root
                  checked={formData.allowComments}
                  onCheckedChange={(e) => setFormData({ ...formData, allowComments: !!e.checked })}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label>💬 السماح بالتعليقات</Checkbox.Label>
                </Checkbox.Root>

                <Checkbox.Root
                  checked={formData.allowLikes}
                  onCheckedChange={(e) => setFormData({ ...formData, allowLikes: !!e.checked })}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label>❤️ السماح بالإعجابات</Checkbox.Label>
                </Checkbox.Root>
              </HStack>

              {/* Actions */}
              <Flex gap={3} justify="flex-end" pt={4}>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setModalMode(null);
                    resetForm();
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  colorPalette="brand"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? <Spinner size="sm" /> : modalMode === "create" ? "إنشاء" : "حفظ التغييرات"}
                </Button>
              </Flex>
            </Stack>
          </PremiumCard>
        </Box>
      )}
    </Box>
  );
}
