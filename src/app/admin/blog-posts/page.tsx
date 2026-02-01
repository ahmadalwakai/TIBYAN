"use client";

import {
  Badge,
  Box,
  Button,
  Checkbox,
  Dialog,
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
import { useRouter } from "next/navigation";
import PremiumCard from "@/components/ui/PremiumCard";
import RichTextEditor, { TextStyling } from "@/components/ui/RichTextEditor";
import MediaUploader, { MediaItem } from "@/components/ui/MediaUploader";
import { PostEditor } from "@/components/PostEditor";
import { uploadMediaItems } from "@/lib/media-utils";

interface BlogMedia {
  id: string;
  type: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "PDF";
  url: string;
  filename?: string;
  caption?: string;
  altText?: string;
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
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<BlogPost | null>(null);

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

  // Auth guard
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        if (data.ok && data.data?.role === "ADMIN") {
          setAuthenticated(true);
        } else {
          router.push("/auth/admin-login");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.push("/auth/admin-login");
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    if (authenticated) {
      fetchPosts();
    }
  }, [authenticated, fetchPosts]);

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

      // Upload media items that have files but no URLs
      let uploadedMedia = media;
      const hasUnuploadedMedia = media.some(m => m.file && !m.url);
      
      if (hasUnuploadedMedia) {
        try {
          uploadedMedia = await uploadMediaItems(media);
        } catch (err) {
          // Error already toasted by uploadMediaItems
          return;
        }
      }

      // Build media payload with proper URLs and all fields
      const mediaToSend = uploadedMedia.map((m, i) => ({
        type: m.type,
        url: m.url,
        filename: m.filename,
        mimeType: m.mimeType,
        fileSize: m.fileSize,
        width: m.width,
        height: m.height,
        duration: m.duration,
        caption: m.caption,
        altText: m.altText,
        order: i,
        styling: m.styling,
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
    setDeleteConfirm(post);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    const post = deleteConfirm;

    try {
      const res = await fetch("/api/blog/posts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: post.id }),
        credentials: "include",
      });
      const json = await res.json();

      if (json.ok) {
        toaster.success({ title: "تم حذف المدونة" });
        setDeleteConfirm(null);
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

  // Handle media editor export - upload blob and use returned URL
  const handleMediaEditorExport = async (blob: Blob, type: "image" | "video") => {
    try {
      const formData = new FormData();
      const filename = `export_${Date.now()}.${type === "video" ? "mp4" : "png"}`;
      formData.append("file", blob, filename);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const json = await res.json();
      if (!json.ok || !json.data?.url) {
        throw new Error(json.error || "Upload failed");
      }

      setMedia([{
        id: `exported_${Date.now()}`,
        type: type === "video" ? "VIDEO" : "IMAGE",
        url: json.data.url,
        filename: json.data.filename,
        caption: "",
        order: 0,
      }]);

      toaster.success({ title: `تم تصدير وحفظ ${type === "video" ? "الفيديو" : "الصورة"} بنجاح` });
    } catch (err) {
      console.error("Export error:", err);
      toaster.error({ title: `فشل تصدير ${type === "video" ? "الفيديو" : "الصورة"}` });
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
      case "MEMBERS_ONLY":
        return <Badge colorPalette="purple">للأعضاء</Badge>;
      case "PRIVATE":
        return <Badge colorPalette="gray">خاص</Badge>;
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <Flex justify="center" align="center" h="100vh">
        <Spinner size="lg" />
      </Flex>
    );
  }

  if (!authenticated) {
    return (
      <Box textAlign="center" py={20}>
        <Text color="red.500" fontWeight="600">غير مصرح</Text>
      </Box>
    );
  }

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

      {/* Delete Confirmation Dialog */}
      <Dialog.Root
        open={deleteConfirm !== null}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <Dialog.Content>
          <Dialog.Header>تأكيد الحذف</Dialog.Header>
          <Dialog.Body>
            هل أنت متأكد من حذف المدونة "{deleteConfirm?.title}"؟ لا يمكن التراجع عن هذا الإجراء.
          </Dialog.Body>
          <Dialog.Footer>
            <Button onClick={() => setDeleteConfirm(null)}>إلغاء</Button>
            <Button colorPalette="red" onClick={confirmDelete}>
              حذف
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>

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
                    
                    {/* Media Configuration Panel */}
                    {media.length > 0 && (
                      <Stack gap={4} mt={6} p={4} borderWidth="1px" borderRadius="md" borderColor="border">
                        <Text fontWeight="700" fontSize="sm">إعدادات الوسائط</Text>
                        
                        {media.map((item, index) => (
                          <Box key={item.id} p={3} bg="surface" borderRadius="md" borderWidth="1px" borderColor="border">
                            <HStack justify="space-between" mb={3}>
                              <Text fontWeight="600" fontSize="sm">
                                {item.filename || `${item.type}_${index + 1}`}
                              </Text>
                              <Badge>{item.type}</Badge>
                            </HStack>
                            
                            <Stack gap={3}>
                              {/* Alt Text */}
                              <Box>
                                <Text fontWeight="500" fontSize="xs" mb={1}>النص البديل (للوصولية)</Text>
                                <Input
                                  placeholder="وصف قصير للصورة..."
                                  value={item.altText || ""}
                                  onChange={(e) => {
                                    const updated = [...media];
                                    updated[index] = { ...updated[index], altText: e.target.value };
                                    setMedia(updated);
                                  }}
                                  size="sm"
                                />
                              </Box>
                              
                              {/* Caption */}
                              <Box>
                                <Text fontWeight="500" fontSize="xs" mb={1}>التعليق</Text>
                                <Input
                                  placeholder="تعليق توضيحي..."
                                  value={item.caption || ""}
                                  onChange={(e) => {
                                    const updated = [...media];
                                    updated[index] = { ...updated[index], caption: e.target.value };
                                    setMedia(updated);
                                  }}
                                  size="sm"
                                />
                              </Box>
                              
                              {/* Styling Controls */}
                              <Stack gap={2}>
                                <Text fontWeight="500" fontSize="xs">التنسيق</Text>
                                <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                                  {/* Border Radius */}
                                  <Box>
                                    <Text fontSize="xs" color="muted" mb={1}>نصف قطر الزاوية</Text>
                                    <NativeSelect.Root size="sm">
                                      <NativeSelect.Field
                                        value={item.styling?.borderRadius || "8px"}
                                        onChange={(e) => {
                                          const updated = [...media];
                                          updated[index] = {
                                            ...updated[index],
                                            styling: {
                                              ...updated[index].styling,
                                              borderRadius: e.target.value,
                                            },
                                          };
                                          setMedia(updated);
                                        }}
                                      >
                                        <option value="0px">حاد</option>
                                        <option value="4px">قليلاً</option>
                                        <option value="8px">متوسط</option>
                                        <option value="16px">مدور</option>
                                        <option value="50%">دائري</option>
                                      </NativeSelect.Field>
                                    </NativeSelect.Root>
                                  </Box>
                                  
                                  {/* Object Fit */}
                                  <Box>
                                    <Text fontSize="xs" color="muted" mb={1}>ملاءمة الصورة</Text>
                                    <NativeSelect.Root size="sm">
                                      <NativeSelect.Field
                                        value={item.styling?.objectFit || "cover"}
                                        onChange={(e) => {
                                          const updated = [...media];
                                          updated[index] = {
                                            ...updated[index],
                                            styling: {
                                              ...updated[index].styling,
                                              objectFit: e.target.value,
                                            },
                                          };
                                          setMedia(updated);
                                        }}
                                      >
                                        <option value="cover">غطاء</option>
                                        <option value="contain">احتواء</option>
                                        <option value="fill">ملء</option>
                                        <option value="stretch">مد</option>
                                      </NativeSelect.Field>
                                    </NativeSelect.Root>
                                  </Box>
                                </Grid>
                              </Stack>
                            </Stack>
                          </Box>
                        ))}
                      </Stack>
                    )}
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
