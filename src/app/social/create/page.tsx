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
} from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { toaster } from "@/components/ui/toaster";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUserClient } from "@/lib/auth-client";
import Link from "next/link";

interface MediaItem {
  type: "IMAGE" | "VIDEO";
  url: string;
  caption?: string;
}

export default function CreatePostPage() {
  const router = useRouter();
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

  useEffect(() => {
    const checkAuth = async () => {
      let currentUser = getCurrentUserClient();
      
      // Try fetching from API if not in cookie
      if (!currentUser) {
        try {
          const res = await fetch("/api/auth/me");
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
    
    setMedia([...media, { type: mediaType, url: mediaUrl.trim() }]);
    setMediaUrl("");
  };

  const removeMedia = (index: number) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      toaster.error({ title: "محتوى المنشور مطلوب" });
      return;
    }

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
          media: media.length > 0 ? media.map((m, i) => ({
            type: m.type,
            url: m.url,
            caption: m.caption,
            order: i,
          })) : undefined,
        }),
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
                  <Stack gap={2}>
                    {media.map((item, index) => (
                      <Box
                        key={index}
                        p={3}
                        bg="gray.50"
                        borderRadius="lg"
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Stack direction="row" align="center" gap={2}>
                          <Badge colorPalette={item.type === "IMAGE" ? "green" : "blue"}>
                            {item.type === "IMAGE" ? "صورة" : "فيديو"}
                          </Badge>
                          <Text fontSize="sm" color="gray.600" maxW="300px" truncate>
                            {item.url}
                          </Text>
                        </Stack>
                        <IconButton
                          aria-label="حذف"
                          size="sm"
                          variant="ghost"
                          colorPalette="red"
                          onClick={() => removeMedia(index)}
                        >
                          ✕
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
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
