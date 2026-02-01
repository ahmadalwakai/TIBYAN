"use client";

import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  Stack,
  Text,
  Textarea,
  SimpleGrid,
  IconButton,
  Badge,
  Image,
  Spinner,
} from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { toaster } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentUserClient } from "@/lib/auth-client";
import Link from "next/link";

interface MediaItem {
  type: "IMAGE" | "VIDEO";
  url: string;
  caption?: string;
  file?: File;
  preview?: string;
  uploading?: boolean;
  uploaded?: boolean;
}

export default function CreatePostPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    visibility: "PUBLIC" as "PUBLIC" | "TEACHERS_ONLY" | "PRIVATE",
  });
  
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"IMAGE" | "VIDEO">("IMAGE");

  // Upload a single file
  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      const json = await res.json();
      if (json.ok && json.data?.url) {
        return json.data.url;
      }
      console.error("Upload failed:", json.error);
      return null;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: MediaItem[] = [];
    
    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");
      
      if (!isImage && !isVideo) {
        toaster.error({ title: `نوع الملف غير مدعوم: ${file.type}` });
        continue;
      }
      
      const preview = URL.createObjectURL(file);
      
      newItems.push({
        type: isImage ? "IMAGE" : "VIDEO",
        url: "",
        file,
        preview,
        uploading: true,
        uploaded: false,
      });
    }
    
    setMedia(prev => [...prev, ...newItems]);
    
    // Upload files immediately
    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      if (item.file) {
        const url = await uploadFile(item.file);
        
        setMedia(prev => {
          const updated = [...prev];
          const idx = prev.findIndex(m => m.preview === item.preview);
          if (idx !== -1) {
            updated[idx] = {
              ...updated[idx],
              url: url || "",
              uploading: false,
              uploaded: !!url,
            };
          }
          return updated;
        });
        
        if (!url) {
          toaster.error({ title: `فشل رفع الملف: ${item.file.name}` });
        }
      }
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [uploadFile]);

  useEffect(() => {
    const checkAuth = async () => {
      let currentUser = getCurrentUserClient();
      
      // Try fetching from API if not in cookie
      if (!currentUser) {
        try {
          const res = await fetch("/api/auth/me", {
            credentials: "include",
          });
          const json = await res.json();
          if (json.ok && json.data) {
            currentUser = {
              id: json.data.id,
              email: json.data.email,
              name: json.data.name,
              role: json.data.role,
            };
          }
        } catch {
          // Ignore
        }
      }

      if (!currentUser) {
        router.push("/auth/member-signup?redirect=/social/create");
        return;
      }

      // Check if user can create posts
      if (!["MEMBER", "INSTRUCTOR", "ADMIN"].includes(currentUser.role)) {
        toaster.error({ title: "يجب أن تكون عضواً لإنشاء منشورات" });
        router.push("/auth/member-signup?redirect=/social/create");
        return;
      }

      setUser(currentUser);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const addMedia = () => {
    if (!mediaUrl.trim()) return;
    
    // Validate URL format
    try {
      new URL(mediaUrl.trim());
    } catch {
      toaster.error({ title: "رابط غير صالح" });
      return;
    }
    
    setMedia([...media, { type: mediaType, url: mediaUrl.trim(), uploaded: true }]);
    setMediaUrl("");
  };

  const removeMedia = (index: number) => {
    const item = media[index];
    if (item.preview) {
      URL.revokeObjectURL(item.preview);
    }
    setMedia(media.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      toaster.error({ title: "محتوى المنشور مطلوب" });
      return;
    }

    // Check if any uploads are still in progress
    if (media.some(m => m.uploading)) {
      toaster.error({ title: "انتظر حتى يتم رفع جميع الملفات" });
      return;
    }

    // Filter out failed uploads
    const validMedia = media.filter(m => m.url && m.uploaded);

    setSubmitting(true);
    try {
      const res = await fetch("/api/social/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title || undefined,
          content: formData.content,
          status: "PUBLISHED",
          visibility: formData.visibility,
          allowComments: true,
          allowLikes: true,
          media: validMedia.length > 0 ? validMedia.map((m, i) => ({
            type: m.type,
            url: m.url,
            caption: m.caption,
            order: i,
          })) : undefined,
        }),
        credentials: "include",
      });

      const json = await res.json();

      if (json.ok) {
        toaster.success({ title: "تم نشر المنشور بنجاح!" });
        router.push("/social");
      } else {
        toaster.error({ title: json.error || "فشل في نشر المنشور" });
      }
    } catch {
      toaster.error({ title: "حدث خطأ في الاتصال" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box minH="100vh" bg="background" display="flex" alignItems="center" justifyContent="center">
        <Text color="muted">جاري التحميل...</Text>
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Box minH="100vh" bg="background" py={{ base: 8, md: 12 }}>
      <Container maxW="3xl" px={{ base: 6, md: 8 }}>
        {/* Header */}
        <Stack gap={2} mb={8}>
          <Heading
            as="h1"
            size={{ base: "xl", md: "2xl" }}
            bgGradient="to-r"
            gradientFrom="brand.700"
            gradientTo="brand.500"
            bgClip="text"
          >
            إنشاء منشور جديد
          </Heading>
          <Text color="muted" fontSize="lg">
            شارك أفكارك مع مجتمع تبيان
          </Text>
        </Stack>

        {/* Advanced Editor Link */}
        <Box
          mb={6}
          p={4}
          bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          borderRadius="xl"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={3}
        >
          <Box>
            <Text color="white" fontWeight="700" fontSize="lg">
              ✨ جرب المحرر المتقدم
            </Text>
            <Text color="whiteAlpha.800" fontSize="sm">
              حرر الصور والفيديوهات مع فلاتر ونصوص وملصقات
            </Text>
          </Box>
          <Button
            asChild
            bg="white"
            color="purple.700"
            fontWeight="700"
            borderRadius="full"
            _hover={{ bg: "whiteAlpha.900", transform: "translateY(-2px)" }}
            transition="all 0.2s"
          >
            <Link href="/social/create/edit">فتح المحرر</Link>
          </Button>
        </Box>

        {/* Form */}
        <Box
          as="form"
          onSubmit={handleSubmit}
          bg="white"
          p={{ base: 6, md: 8 }}
          borderRadius="2xl"
          boxShadow="0 4px 20px rgba(0, 0, 0, 0.08)"
          border="1px solid"
          borderColor="gray.100"
        >
          <Stack gap={6}>
            {/* Author info */}
            <Box
              bg="gray.50"
              p={4}
              borderRadius="xl"
              display="flex"
              alignItems="center"
              gap={3}
            >
              <Box
                w="48px"
                h="48px"
                borderRadius="full"
                bg="linear-gradient(135deg, #c8a24a, #ffd700)"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="primary"
                fontSize="lg"
                fontWeight="800"
              >
                {user.name.charAt(0)}
              </Box>
              <Box>
                <Text fontWeight="700" color="gray.800">{user.name}</Text>
                <Badge
                  bg={user.role === "ADMIN" ? "red.100" : user.role === "INSTRUCTOR" ? "blue.100" : "green.100"}
                  color={user.role === "ADMIN" ? "red.700" : user.role === "INSTRUCTOR" ? "blue.700" : "green.700"}
                  fontSize="xs"
                >
                  {user.role === "ADMIN" ? "مسؤول" : user.role === "INSTRUCTOR" ? "معلم" : "عضو"}
                </Badge>
              </Box>
            </Box>

            {/* Title (optional) */}
            <Field label="العنوان (اختياري)">
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="أضف عنواناً لمنشورك..."
                size="lg"
                maxLength={200}
              />
            </Field>

            {/* Content */}
            <Field label="المحتوى" required>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="اكتب منشورك هنا... يمكنك استخدام HTML للتنسيق"
                rows={8}
                size="lg"
                minLength={1}
                required
              />
            </Field>

            {/* Visibility */}
            <Field label="من يمكنه رؤية هذا المنشور؟">
              <SimpleGrid columns={3} gap={3}>
                {[
                  { value: "PUBLIC", label: "الجميع", icon: "🌍" },
                  { value: "TEACHERS_ONLY", label: "المعلمون فقط", icon: "👨‍🏫" },
                  { value: "PRIVATE", label: "أنا فقط", icon: "🔒" },
                ].map((option) => (
                  <Box
                    key={option.value}
                    as="button"
                    onClick={() => setFormData({ ...formData, visibility: option.value as typeof formData.visibility })}
                    p={4}
                    borderRadius="xl"
                    border="2px solid"
                    borderColor={formData.visibility === option.value ? "brand.500" : "gray.200"}
                    bg={formData.visibility === option.value ? "brand.50" : "white"}
                    transition="all 0.2s ease"
                    _hover={{
                      borderColor: "brand.300",
                    }}
                    textAlign="center"
                  >
                    <Text fontSize="xl" mb={1}>{option.icon}</Text>
                    <Text fontSize="sm" fontWeight="600" color={formData.visibility === option.value ? "brand.700" : "gray.600"}>
                      {option.label}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            </Field>

            {/* Media */}
            <Field label="إضافة وسائط (اختياري)">
              <Stack gap={3}>
                {/* File Upload Area */}
                <Box
                  p={6}
                  borderRadius="xl"
                  border="2px dashed"
                  borderColor="gray.200"
                  bg="gray.50"
                  textAlign="center"
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ borderColor: "brand.300", bg: "brand.50" }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Text fontSize="3xl" mb={2}>📷</Text>
                  <Text fontWeight="600" mb={1} color="gray.700">
                    اضغط لرفع صور أو فيديوهات
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    أو أضف رابط مباشر أدناه
                  </Text>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    display="none"
                  />
                </Box>

                {/* URL Input */}
                <SimpleGrid columns={{ base: 1, sm: 3 }} gap={3}>
                  <Box>
                    <select
                      value={mediaType}
                      onChange={(e) => setMediaType(e.target.value as "IMAGE" | "VIDEO")}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "14px",
                      }}
                    >
                      <option value="IMAGE">صورة</option>
                      <option value="VIDEO">فيديو</option>
                    </select>
                  </Box>
                  <Input
                    value={mediaUrl}
                    onChange={(e) => setMediaUrl(e.target.value)}
                    placeholder="رابط الصورة أو الفيديو"
                    flex={1}
                  />
                  <Button
                    type="button"
                    onClick={addMedia}
                    colorPalette="brand"
                    variant="outline"
                  >
                    إضافة
                  </Button>
                </SimpleGrid>

                {/* Media preview */}
                {media.length > 0 && (
                  <SimpleGrid columns={{ base: 2, md: 3 }} gap={3}>
                    {media.map((item, index) => (
                      <Box
                        key={index}
                        position="relative"
                        borderRadius="lg"
                        overflow="hidden"
                        border="1px solid"
                        borderColor={item.uploading ? "brand.300" : item.uploaded ? "green.300" : "red.300"}
                        bg="gray.50"
                      >
                        {item.type === "IMAGE" ? (
                          <Image
                            src={item.preview || item.url}
                            alt={`Media ${index + 1}`}
                            w="100%"
                            h="120px"
                            objectFit="cover"
                          />
                        ) : (
                          <video
                            src={item.preview || item.url}
                            style={{
                              width: "100%",
                              height: "120px",
                              objectFit: "cover",
                            }}
                          />
                        )}
                        
                        {/* Overlay for status */}
                        {item.uploading && (
                          <Box
                            position="absolute"
                            inset={0}
                            bg="blackAlpha.600"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Spinner color="white" size="lg" />
                          </Box>
                        )}
                        
                        {/* Status badge */}
                        <Badge
                          position="absolute"
                          top={2}
                          right={2}
                          colorPalette={item.uploading ? "yellow" : item.uploaded ? "green" : "red"}
                          fontSize="xs"
                        >
                          {item.uploading ? "جاري الرفع..." : item.uploaded ? "✓ تم" : "✗ فشل"}
                        </Badge>
                        
                        {/* Remove button */}
                        <IconButton
                          aria-label="حذف"
                          size="xs"
                          position="absolute"
                          top={2}
                          left={2}
                          colorPalette="red"
                          variant="solid"
                          onClick={() => removeMedia(index)}
                        >
                          ✕
                        </IconButton>
                      </Box>
                    ))}
                  </SimpleGrid>
                )}
              </Stack>
            </Field>

            {/* Submit */}
            <Stack direction={{ base: "column", sm: "row" }} gap={3} pt={4}>
              <Button
                type="submit"
                size="lg"
                flex={1}
                bg="linear-gradient(135deg, #c8a24a 0%, #b8943a 100%)"
                color="white"
                fontWeight="700"
                loading={submitting}
                loadingText="جاري النشر..."
                _hover={{
                  bg: "linear-gradient(135deg, #d4b05a 0%, #c8a24a 100%)",
                  transform: "translateY(-2px)",
                }}
                transition="all 0.3s ease"
              >
                ✨ نشر المنشور
              </Button>
              <Button
                asChild
                type="button"
                size="lg"
                variant="outline"
                colorPalette="gray"
              >
                <Link href="/social">إلغاء</Link>
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
