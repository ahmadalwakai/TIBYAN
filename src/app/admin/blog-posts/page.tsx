"use client";

import {
  Badge,
  Box,
  Button,
  Checkbox,
  Flex,
  Grid,
  HStack,
  Input,
  NativeSelect,
  Spinner,
  Stack,
  Text,
  Textarea,
  Tabs,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useCallback, useEffect, useState } from "react";
import PremiumCard from "@/components/ui/PremiumCard";
import RichTextEditor, { TextStyling } from "@/components/ui/RichTextEditor";
import MediaUploader, { MediaItem } from "@/components/ui/MediaUploader";
import { PostEditor } from "@/components/PostEditor";

interface BlogMedia {
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

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  styling: TextStyling;
  authorId: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  visibility: "PUBLIC" | "MEMBERS_ONLY" | "PRIVATE";
  featured: boolean;
  allowComments: boolean;
  tags?: string[];
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  media: BlogMedia[];
}

type ModalMode = "create" | "edit" | "view" | null;

export default function AdminBlogPostsPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
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
    visibility: "PUBLIC" as "PUBLIC" | "MEMBERS_ONLY" | "PRIVATE",
    featured: false,
    allowComments: true,
    tags: [] as string[],
  });
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [tagsInput, setTagsInput] = useState("");

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (visibilityFilter !== "all") params.set("visibility", visibilityFilter);
      if (searchQuery) params.set("search", searchQuery);
      params.set("limit", "50");

      const res = await fetch(`/api/blog/posts?${params}`, {
        credentials: "include",
      });
      const json = await res.json();

      if (json.ok) {
        setPosts(json.data.posts);
      } else {
        toaster.error({ title: json.error || "فشل في جلب المدونات" });
      }
    } catch {
      toaster.error({ title: "خطأ في الاتصال" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, visibilityFilter, searchQuery]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
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
      featured: false,
      allowComments: true,
      tags: [],
    });
    setMedia([]);
    setTagsInput("");
    setSelectedPost(null);
  };

  // Auto-generate slug
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  // Open create modal
  const handleCreate = () => {
    resetForm();
    setModalMode("create");
  };

  // Open edit modal
  const handleEdit = (post: BlogPost) => {
    setSelectedPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || "",
      styling: post.styling || {},
      status: post.status,
      visibility: post.visibility,
      featured: post.featured,
      allowComments: post.allowComments,
      tags: post.tags || [],
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
    setTagsInput(post.tags?.join(", ") || "");
    setModalMode("edit");
  };

  // Submit form
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toaster.error({ title: "العنوان مطلوب" });
      return;
    }
    if (!formData.content.trim()) {
      toaster.error({ title: "المحتوى مطلوب" });
      return;
    }

    setSubmitting(true);
    try {
      const slug = formData.slug || generateSlug(formData.title);
      const tags = tagsInput
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);

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
        ? { ...formData, slug, tags, media: mediaToSend }
        : { ...formData, id: selectedPost?.id, slug, tags, media: mediaToSend };

      const res = await fetch("/api/blog/posts", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const json = await res.json();

      if (json.ok) {
        toaster.success({
          title: modalMode === "create" ? "تم إنشاء المدونة" : "تم تحديث المدونة",
        });
        setModalMode(null);
        resetForm();
        fetchPosts();
      } else {
        toaster.error({ title: json.error || "حدث خطأ" });
      }
    } catch (error) {
      console.error("Error:", error);
      toaster.error({ title: "خطأ في الاتصال" });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete post
  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`هل أنت متأكد من حذف المدونة "${post.title}"؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/blog/posts?id=${post.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();

      if (json.ok) {
        toaster.success({ title: "تم حذف المدونة" });
        fetchPosts();
      } else {
        toaster.error({ title: json.error || "فشل في الحذف" });
      }
    } catch {
      toaster.error({ title: "خطأ في الاتصال" });
    }
  };

  // Toggle featured
  const handleToggleFeatured = async (post: BlogPost) => {
    try {
      const res = await fetch("/api/blog/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, featured: !post.featured }),
        credentials: "include",
      });
      const json = await res.json();

      if (json.ok) {
        toaster.success({ title: post.featured ? "تم إلغاء التميز" : "تم تمييز المدونة" });
        fetchPosts();
      } else {
        toaster.error({ title: json.error });
      }
    } catch {
      toaster.error({ title: "خطأ في الاتصال" });
    }
  };

  // Quick status change
  const handleStatusChange = async (post: BlogPost, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") => {
    try {
      const res = await fetch("/api/blog/posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id, status }),
        credentials: "include",
      });
      const json = await res.json();

      if (json.ok) {
        toaster.success({ title: "تم تحديث الحالة" });
        fetchPosts();
      } else {
        toaster.error({ title: json.error });
      }
    } catch {
      toaster.error({ title: "خطأ في الاتصال" });
    }
  };

  // Handle media editor export
  const handleMediaEditorExport = async (blob: Blob, type: "image" | "video") => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const filename = `export_${Date.now()}.${type === "video" ? "mp4" : "png"}`;
      
      setMedia([{
        id: `exported_${Date.now()}`,
        type: type === "video" ? "VIDEO" : "IMAGE",
        url: dataUrl,
        filename,
        caption: "",
        order: 0,
      }]);

      toaster.success({ title: `تم تصدير ${type === "video" ? "الفيديو" : "الصورة"} بنجاح` });
    };
    reader.readAsDataURL(blob);
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
      case "MEMBERS_ONLY":
        return <Badge colorPalette="purple">للأعضاء</Badge>;
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
            مدونة المشروع
          </Text>
          <Text color="muted" fontSize="sm">
            إدارة مقالات المدونة والمحتوى التعليمي
          </Text>
        </Box>
        <Button colorPalette="brand" onClick={handleCreate}>
          ➕ مقالة جديدة
        </Button>
      </Flex>

      {/* Filters */}
      <PremiumCard variant="bordered" p={4} mb={6}>
        <Flex gap={4} wrap="wrap">
          <Box flex={{ base: "1 1 100%", md: "0 0 200px" }}>
            <Input
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Box>
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
          <Box>
            <NativeSelect.Root size="md">
              <NativeSelect.Field
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value)}
                w="150px"
              >
                <option value="all">كل الظهور</option>
                <option value="PUBLIC">عام</option>
                <option value="MEMBERS_ONLY">للأعضاء</option>
                <option value="PRIVATE">خاص</option>
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
          <Text fontSize="4xl" mb={2}>📝</Text>
          <Text fontWeight="600">لا توجد مقالات</Text>
          <Text color="muted" fontSize="sm">
            أنشئ أول مقالة للبدء
          </Text>
        </PremiumCard>
      ) : (
        <Stack gap={4}>
          {posts.map((post) => (
            <PremiumCard key={post.id} variant="bordered" p={4}>
              <Flex justify="space-between" align="start" gap={4}>
                <Box flex={1}>
                  <HStack gap={2} mb={2}>
                    {post.featured && <Badge colorPalette="orange">⭐ مميز</Badge>}
                    {getStatusBadge(post.status)}
                    {getVisibilityBadge(post.visibility)}
                  </HStack>
                  <Text fontWeight="600" fontSize="lg" mb={1}>
                    {post.title}
                  </Text>
                  <Text color="muted" fontSize="sm" mb={2}>
                    {post.excerpt || post.content.substring(0, 150) + "..."}
                  </Text>
                  <HStack gap={4} fontSize="xs" color="muted">
                    <Text>📊 {post.viewsCount} مشاهدات</Text>
                    <Text>❤️ {post.likesCount} إعجابات</Text>
                    <Text>💬 {post.commentsCount} تعليقات</Text>
                    <Text>📅 {new Date(post.createdAt).toLocaleDateString("ar")}</Text>
                  </HStack>
                </Box>

                <Stack gap={2} align="flex-start">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(post)}>
                    ✏️ تحرير
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleFeatured(post)}
                  >
                    {post.featured ? "🔄 إلغاء تمييز" : "⭐ تمييز"}
                  </Button>
                  {post.status === "DRAFT" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(post, "PUBLISHED")}
                    >
                      📤 نشر
                    </Button>
                  )}
                  {post.status === "PUBLISHED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(post, "ARCHIVED")}
                    >
                      أرشفة
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
            maxW="950px"
            maxH="90vh"
            overflow="auto"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <Text fontSize="xl" fontWeight="700" mb={4}>
              {modalMode === "create" ? "إنشاء مقالة جديدة" : "تعديل المقالة"}
            </Text>

            <Tabs.Root defaultValue="text" mb={4}>
              <Tabs.List>
                <Tabs.Trigger value="text">محرر النصوص</Tabs.Trigger>
                <Tabs.Trigger value="media">محرر الوسائط المتقدم</Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="text">
                <Stack gap={4} py={4}>
                  {/* Title */}
                  <Box>
                    <Text fontWeight="600" mb={2}>العنوان *</Text>
                    <Input
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({ ...formData, title: e.target.value });
                        if (!formData.slug) {
                          setFormData(prev => ({ ...prev, slug: generateSlug(e.target.value) }));
                        }
                      }}
                      placeholder="عنوان المقالة..."
                    />
                  </Box>

                  {/* Slug */}
                  <Box>
                    <Text fontWeight="600" mb={2}>الرابط (Slug)</Text>
                    <Input
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="رابط-المقالة-الفريد"
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
                      placeholder="ملخص قصير للمقالة..."
                      rows={2}
                    />
                  </Box>

                  {/* Tags */}
                  <Box>
                    <Text fontWeight="600" mb={2}>الوسوم (اختياري)</Text>
                    <Input
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="وسم1, وسم2, وسم3..."
                    />
                    <Text fontSize="xs" color="muted" mt={1}>
                      أدخل الوسوم مفصولة بفواصل
                    </Text>
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
                </Stack>
              </Tabs.Content>

              <Tabs.Content value="media">
                <Box py={4}>
                  <Text fontSize="sm" color="muted" mb={4}>
                    استخدم محرر الوسائط المتقدم لإنشاء صور وفيديوهات احترافية للمقالة
                  </Text>
                  <PostEditor
                    onExport={handleMediaEditorExport}
                    onCancel={() => {}}
                    initialMedia={media
                      .filter(m => m.type === "IMAGE" || m.type === "VIDEO")
                      .map(m => ({
                        id: m.id,
                        type: (m.type === "VIDEO" ? "video" : "image") as "image" | "video",
                        url: m.url || "",
                        name: m.filename || `${m.type}_${m.id}`,
                        width: 1920,
                        height: 1080,
                        duration: 0,
                      }))}
                  />
                </Box>
              </Tabs.Content>
            </Tabs.Root>

            {/* Options Grid */}
            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4} mb={4}>
              <Box>
                <Text fontWeight="600" mb={2}>الحالة</Text>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "DRAFT" | "PUBLISHED" | "ARCHIVED" })}
                  >
                    <option value="DRAFT">مسودة</option>
                    <option value="PUBLISHED">منشور</option>
                    <option value="ARCHIVED">مؤرشف</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Box>

              <Box>
                <Text fontWeight="600" mb={2}>الظهور</Text>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={formData.visibility}
                    onChange={(e) => setFormData({ ...formData, visibility: e.target.value as "PUBLIC" | "MEMBERS_ONLY" | "PRIVATE" })}
                  >
                    <option value="PUBLIC">عام للجميع</option>
                    <option value="MEMBERS_ONLY">للأعضاء فقط</option>
                    <option value="PRIVATE">خاص</option>
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Box>

              <Box>
                <Checkbox.Root
                  checked={formData.featured}
                  onCheckedChange={(e) => setFormData({ ...formData, featured: !!e.checked })}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Label>⭐ مقالة مميزة</Checkbox.Label>
                </Checkbox.Root>
              </Box>
            </Grid>

            {/* Allow Comments */}
            <HStack gap={6} mb={4}>
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
          </PremiumCard>
        </Box>
      )}
    </Box>
  );
}
