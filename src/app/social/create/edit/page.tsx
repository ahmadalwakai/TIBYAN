"use client";

/**
 * Create Post with Advanced Editor
 * Full-featured media editor for creating posts
 */

import { Box, Text, Spinner, VStack } from "@chakra-ui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, Suspense } from "react";
import { getCurrentUserClient } from "@/lib/auth-client";
import { toaster } from "@/components/ui/toaster";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues with canvas/ffmpeg
const PostEditor = dynamic(
  () => import("@/components/PostEditor/PostEditor").then((m) => m.PostEditor),
  {
    ssr: false,
    loading: () => (
      <Box
        minH="100vh"
        bg="gray.900"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack gap={4}>
          <Spinner size="xl" color="brand.500" />
          <Text color="white">جاري تحميل المحرر...</Text>
        </VStack>
      </Box>
    ),
  }
);

function CreatePostEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Check authentication
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
        router.push("/auth/member-signup?redirect=/social/create/edit");
        return;
      }

      // Check if user can create posts
      if (!["MEMBER", "INSTRUCTOR", "ADMIN"].includes(currentUser.role)) {
        toaster.error({ title: "يجب أن تكون عضواً لإنشاء منشورات" });
        router.push("/auth/member-signup?redirect=/social/create/edit");
        return;
      }

      setUser(currentUser);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  // Handle export from editor
  const handleExport = useCallback(
    async (blob: Blob, type: "image" | "video") => {
      if (submitting) return;
      setSubmitting(true);

      try {
        // Upload the exported media
        const formData = new FormData();
        const filename = type === "image" ? "post-image.png" : "post-video.mp4";
        formData.append("file", blob, filename);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        const uploadJson = await uploadRes.json();

        if (!uploadJson.ok || !uploadJson.data?.url) {
          throw new Error(uploadJson.error || "فشل رفع الملف");
        }

        const mediaUrl = uploadJson.data.url;

        // Create the post with the uploaded media
        const postRes = await fetch("/api/social/posts", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: searchParams.get("caption") || "منشور جديد",
            status: "PUBLISHED",
            visibility: "PUBLIC",
            allowComments: true,
            allowLikes: true,
            media: [
              {
                type: type === "image" ? "IMAGE" : "VIDEO",
                url: mediaUrl,
                order: 0,
              },
            ],
          }),
        });

        const postJson = await postRes.json();

        if (postJson.ok) {
          toaster.success({ title: "تم نشر المنشور بنجاح!" });
          router.push("/social");
        } else {
          throw new Error(postJson.error || "فشل في نشر المنشور");
        }
      } catch (error) {
        console.error("Export/publish failed:", error);
        toaster.error({
          title: error instanceof Error ? error.message : "فشل في نشر المنشور",
        });
      } finally {
        setSubmitting(false);
      }
    },
    [router, searchParams, submitting]
  );

  // Handle cancel
  const handleCancel = useCallback(() => {
    router.push("/social/create");
  }, [router]);

  if (loading) {
    return (
      <Box
        minH="100vh"
        bg="gray.900"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <VStack gap={4}>
          <Spinner size="xl" color="brand.500" />
          <Text color="white">جاري التحقق من الصلاحيات...</Text>
        </VStack>
      </Box>
    );
  }

  if (!user) {
    return null;
  }

  return <PostEditor onExport={handleExport} onCancel={handleCancel} />;
}

export default function CreatePostEditorPage() {
  return (
    <Suspense
      fallback={
        <Box
          minH="100vh"
          bg="gray.900"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <VStack gap={4}>
            <Spinner size="xl" color="brand.500" />
            <Text color="white">جاري التحميل...</Text>
          </VStack>
        </Box>
      }
    >
      <CreatePostEditorContent />
    </Suspense>
  );
}
