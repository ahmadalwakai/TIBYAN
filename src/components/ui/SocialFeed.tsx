"use client";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  HStack,
  Image,
  Spinner,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import { useCallback, useEffect, useState } from "react";
import PremiumCard from "@/components/ui/PremiumCard";

// Helper to check if URL is valid (not a blob URL from another origin)
function isValidMediaUrl(url: string): boolean {
  if (!url) return false;
  // Blob URLs from other origins won't work
  if (url.startsWith("blob:") && typeof window !== "undefined") {
    // Only allow blob URLs from current origin
    const currentOrigin = window.location.origin;
    return url.startsWith(`blob:${currentOrigin}`);
  }
  return true;
}

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

interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  replies?: Comment[];
}

interface Post {
  id: string;
  title?: string;
  content: string;
  excerpt?: string;
  styling?: {
    fontFamily?: string;
    fontSize?: string;
    fontColor?: string;
    backgroundColor?: string;
    textAlign?: string;
  };
  authorId: string;
  authorType: "ADMIN" | "INSTRUCTOR" | "MEMBER";
  status: string;
  visibility: string;
  isPinned: boolean;
  allowComments: boolean;
  allowLikes: boolean;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  isLiked: boolean;
  publishedAt?: string;
  createdAt: string;
  media: PostMedia[];
}

interface SocialFeedProps {
  showTitle?: boolean;
  maxPosts?: number;
  className?: string;
}

export default function SocialFeed({
  showTitle = true,
  maxPosts = 10,
  className,
}: SocialFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch posts
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/social/posts?limit=${maxPosts}&status=PUBLISHED&visibility=PUBLIC`, {
        credentials: "include",
      });
      const json = await res.json();

      if (json.ok) {
        setPosts(json.data.posts);
      }
    } catch {
      console.error("Error fetching posts");
    } finally {
      setLoading(false);
    }
  }, [maxPosts]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Fetch comments for a post
  const fetchComments = async (postId: string) => {
    setLoadingComments((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await fetch(`/api/social/posts/${postId}/comments`, {
        credentials: "include",
      });
      const json = await res.json();

      if (json.ok) {
        setComments((prev) => ({ ...prev, [postId]: json.data.comments }));
      }
    } catch {
      console.error("Error fetching comments");
    } finally {
      setLoadingComments((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Toggle like
  const handleLike = async (postId: string) => {
    try {
      const res = await fetch(`/api/social/posts/${postId}/like`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();

      if (json.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, isLiked: json.data.liked, likesCount: json.data.likesCount }
              : p
          )
        );
      } else if (res.status === 401) {
        toaster.error({ title: "يجب تسجيل الدخول للإعجاب" });
      }
    } catch {
      toaster.error({ title: "خطأ في الاتصال" });
    }
  };

  // Submit comment
  const handleSubmitComment = async (postId: string) => {
    const content = newComment[postId]?.trim();
    if (!content) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/social/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        credentials: "include",
      });
      const json = await res.json();

      if (json.ok) {
        setNewComment((prev) => ({ ...prev, [postId]: "" }));
        fetchComments(postId);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
          )
        );
        toaster.success({ title: json.data.message || "تم إضافة التعليق" });
      } else if (res.status === 401) {
        toaster.error({ title: "يجب تسجيل الدخول للتعليق" });
      } else {
        toaster.error({ title: json.error || "فشل في إضافة التعليق" });
      }
    } catch {
      toaster.error({ title: "خطأ في الاتصال" });
    } finally {
      setSubmittingComment(false);
    }
  };

  // Toggle comment like
  const handleCommentLike = async (postId: string, commentId: string) => {
    try {
      const res = await fetch(`/api/social/posts/${postId}/comments/${commentId}/like`, {
        method: "POST",
        credentials: "include",
      });
      const json = await res.json();

      if (json.ok) {
        setComments((prev) => ({
          ...prev,
          [postId]: prev[postId]?.map((c) =>
            c.id === commentId
              ? { ...c, isLiked: json.data.liked, likesCount: json.data.likesCount }
              : c
          ),
        }));
      }
    } catch {
      // Silent fail
    }
  };

  // Expand post to show comments
  const handleExpand = (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      if (!comments[postId]) {
        fetchComments(postId);
      }
    }
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case "VIDEO": return "🎬";
      case "AUDIO": return "🎵";
      case "PDF": return "📄";
      case "DOCUMENT": return "📁";
      default: return "📎";
    }
  };

  if (loading) {
    return (
      <Flex justify="center" py={12}>
        <Spinner size="lg" />
      </Flex>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  return (
    <Box className={className}>
      {showTitle && (
        <Text as="h2" fontSize="2xl" fontWeight="700" mb={6} textAlign="center">
          آخر المنشورات
        </Text>
      )}

      <Stack gap={6}>
        {posts.map((post) => (
          <PremiumCard key={post.id} variant="bordered" p={0} overflow="hidden">
            {/* Post Header */}
            <Flex p={4} gap={3} align="center" borderBottom="1px solid" borderColor="border">
              <Avatar.Root size="md">
                <Avatar.Fallback bg={post.authorType === "ADMIN" ? "brand.700" : "green.600"} color="white">
                  {post.authorType === "ADMIN" ? "🎓" : "👨‍🏫"}
                </Avatar.Fallback>
              </Avatar.Root>
              <Box flex={1}>
                <HStack gap={2}>
                  <Text fontWeight="600">
                    {post.authorType === "ADMIN" ? "إدارة تبيان" : "معلم"}
                  </Text>
                  {post.isPinned && (
                    <Badge colorPalette="orange" size="sm">📌 مثبت</Badge>
                  )}
                </HStack>
                <Text fontSize="xs" color="muted">
                  {new Date(post.publishedAt || post.createdAt).toLocaleDateString("ar", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </Text>
              </Box>
            </Flex>

            {/* Post Content */}
            <Box p={4}>
              {post.title && (
                <Text fontWeight="700" fontSize="lg" mb={2}>
                  {post.title}
                </Text>
              )}
              <Text
                whiteSpace="pre-wrap"
                style={{
                  fontFamily: post.styling?.fontFamily || "inherit",
                  fontSize: post.styling?.fontSize === "sm" ? "14px" : 
                           post.styling?.fontSize === "lg" ? "18px" :
                           post.styling?.fontSize === "xl" ? "20px" :
                           post.styling?.fontSize === "2xl" ? "24px" : "16px",
                  color: post.styling?.fontColor || "inherit",
                  textAlign: (post.styling?.textAlign || "right") as "right" | "center" | "left" | "justify",
                }}
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </Box>

            {/* Post Media */}
            {post.media.length > 0 && (
              <Box px={4} pb={4}>
                <Grid
                  templateColumns={
                    post.media.filter(m => isValidMediaUrl(m.url)).length === 1
                      ? "1fr"
                      : post.media.filter(m => isValidMediaUrl(m.url)).length === 2
                      ? "repeat(2, 1fr)"
                      : "repeat(3, 1fr)"
                  }
                  gap={2}
                >
                  {post.media.filter(m => isValidMediaUrl(m.url)).slice(0, 6).map((m, index) => (
                    <Box
                      key={m.id}
                      position="relative"
                      borderRadius={m.styling?.borderRadius || "8px"}
                      overflow="hidden"
                      style={{
                        aspectRatio: m.styling?.aspectRatio || "16/9",
                      }}
                    >
                      {m.type === "IMAGE" ? (
                        <Image
                          src={m.url}
                          alt={m.caption || ""}
                          w="100%"
                          h="100%"
                          objectFit={m.styling?.objectFit as "cover" | "contain" | "fill" || "cover"}
                        />
                      ) : m.type === "VIDEO" ? (
                        <video
                          src={m.url}
                          controls
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <Flex
                          w="100%"
                          h="100%"
                          bg="surface"
                          border="1px solid"
                          borderColor="border"
                          align="center"
                          justify="center"
                          direction="column"
                          gap={2}
                        >
                          <Text fontSize="3xl">{getMediaIcon(m.type)}</Text>
                          <Text fontSize="sm" color="muted" px={2} textAlign="center" lineClamp={2}>
                            {m.filename}
                          </Text>
                          <a href={m.url} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">
                              تحميل
                            </Button>
                          </a>
                        </Flex>
                      )}
                      {m.caption && (
                        <Text
                          position="absolute"
                          bottom={0}
                          left={0}
                          right={0}
                          bg="blackAlpha.700"
                          color="white"
                          p={2}
                          fontSize="sm"
                        >
                          {m.caption}
                        </Text>
                      )}
                      {index === 5 && post.media.filter(m => isValidMediaUrl(m.url)).length > 6 && (
                        <Flex
                          position="absolute"
                          inset={0}
                          bg="blackAlpha.700"
                          align="center"
                          justify="center"
                        >
                          <Text color="white" fontSize="xl" fontWeight="700">
                            +{post.media.filter(m => isValidMediaUrl(m.url)).length - 6}
                          </Text>
                        </Flex>
                      )}
                    </Box>
                  ))}
                </Grid>
              </Box>
            )}

            {/* Post Actions */}
            <Flex
              p={4}
              borderTop="1px solid"
              borderColor="border"
              justify="space-between"
              align="center"
            >
              <HStack gap={4}>
                {post.allowLikes && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(post.id)}
                    color={post.isLiked ? "red.500" : "muted"}
                  >
                    {post.isLiked ? "❤️" : "🤍"} {post.likesCount}
                  </Button>
                )}
                {post.allowComments && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExpand(post.id)}
                    color={expandedPost === post.id ? "brand.600" : "muted"}
                  >
                    💬 {post.commentsCount}
                  </Button>
                )}
              </HStack>
              <Text fontSize="xs" color="muted">
                👁️ {post.viewsCount}
              </Text>
            </Flex>

            {/* Comments Section */}
            {expandedPost === post.id && post.allowComments && (
              <Box borderTop="1px solid" borderColor="border" p={4}>
                {/* Add Comment */}
                <Flex gap={3} mb={4}>
                  <Avatar.Root size="sm">
                    <Avatar.Fallback>👤</Avatar.Fallback>
                  </Avatar.Root>
                  <Box flex={1}>
                    <Textarea
                      value={newComment[post.id] || ""}
                      onChange={(e) =>
                        setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))
                      }
                      placeholder="أضف تعليقاً..."
                      rows={2}
                      resize="none"
                    />
                    <Flex justify="flex-end" mt={2}>
                      <Button
                        size="sm"
                        colorPalette="brand"
                        onClick={() => handleSubmitComment(post.id)}
                        disabled={!newComment[post.id]?.trim() || submittingComment}
                      >
                        {submittingComment ? <Spinner size="sm" /> : "تعليق"}
                      </Button>
                    </Flex>
                  </Box>
                </Flex>

                {/* Comments List */}
                {loadingComments[post.id] ? (
                  <Flex justify="center" py={4}>
                    <Spinner size="sm" />
                  </Flex>
                ) : (
                  <VStack gap={4} align="stretch">
                    {comments[post.id]?.map((comment) => (
                      <Flex key={comment.id} gap={3}>
                        <Avatar.Root size="sm">
                          {comment.authorAvatar ? (
                            <Avatar.Image src={comment.authorAvatar} />
                          ) : (
                            <Avatar.Fallback>{comment.authorName.charAt(0)}</Avatar.Fallback>
                          )}
                        </Avatar.Root>
                        <Box flex={1}>
                          <Box bg="surface" p={3} borderRadius="card">
                            <Text fontWeight="600" fontSize="sm" mb={1}>
                              {comment.authorName}
                            </Text>
                            <Text fontSize="sm">{comment.content}</Text>
                          </Box>
                          <HStack gap={4} mt={1} px={2}>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => handleCommentLike(post.id, comment.id)}
                              color={comment.isLiked ? "red.500" : "muted"}
                            >
                              {comment.isLiked ? "❤️" : "🤍"} {comment.likesCount}
                            </Button>
                            <Text fontSize="xs" color="muted">
                              {new Date(comment.createdAt).toLocaleDateString("ar")}
                            </Text>
                          </HStack>
                        </Box>
                      </Flex>
                    ))}
                    {(!comments[post.id] || comments[post.id].length === 0) && (
                      <Text textAlign="center" color="muted" fontSize="sm" py={4}>
                        لا توجد تعليقات حتى الآن. كن أول من يعلق!
                      </Text>
                    )}
                  </VStack>
                )}
              </Box>
            )}
          </PremiumCard>
        ))}
      </Stack>
    </Box>
  );
}
