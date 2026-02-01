"use client";

import {
  Box,
  Button,
  Container,
  Heading,
  SimpleGrid,
  Stack,
  Text,
  Badge,
  Input,
  Textarea,
} from "@chakra-ui/react";
import { Field } from "@/components/ui/field";
import { toaster } from "@/components/ui/toaster";
import PremiumCard from "@/components/ui/PremiumCard";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUserClient } from "@/lib/auth-client";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  avatar?: string;
  createdAt: string;
  emailVerified: boolean;
}

interface UserPost {
  id: string;
  title?: string;
  content: string;
  status: string;
  likesCount: number;
  commentsCount: number;
  createdAt: string;
}

export default function MemberPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "posts" | "settings">("overview");
  
  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    name: "",
    bio: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [requestingReset, setRequestingReset] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      let currentUser = getCurrentUserClient();
      
      if (!currentUser) {
        try {
          const res = await fetch("/api/auth/me");
          const json = await res.json();
          if (json.ok && json.data) {
            currentUser = json.data;
          }
        } catch {
          // Ignore
        }
      }

      if (!currentUser) {
        router.push("/auth/login?redirect=/member");
        return;
      }

      // Fetch full profile
      try {
        const profileRes = await fetch("/api/auth/me");
        const profileJson = await profileRes.json();
        if (profileJson.ok) {
          setUser(profileJson.data);
          setSettingsForm((prev) => ({
            ...prev,
            name: profileJson.data.name,
            bio: profileJson.data.bio || "",
          }));
        }
      } catch {
        // Use basic info
        setUser(currentUser as UserProfile);
      }

      // Fetch user's posts
      try {
        const postsRes = await fetch(`/api/social/posts?authorId=${currentUser.id}`);
        const postsJson = await postsRes.json();
        if (postsJson.ok) {
          setPosts(postsJson.data.posts);
        }
      } catch {
        // Ignore
      }

      setLoading(false);
    };

    fetchData();
  }, [router]);

  const handleRequestPasswordReset = async () => {
    if (!user?.email) return;
    
    setRequestingReset(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      
      const json = await res.json();
      
      if (json.ok) {
        toaster.success({ 
          title: "تم إرسال رابط إعادة تعيين كلمة المرور",
          description: "يرجى التحقق من بريدك الإلكتروني",
        });
      } else {
        toaster.error({ title: json.error || "حدث خطأ" });
      }
    } catch {
      toaster.error({ title: "حدث خطأ في الاتصال" });
    } finally {
      setRequestingReset(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: settingsForm.name,
          bio: settingsForm.bio,
        }),
      });
      
      const json = await res.json();
      
      if (json.ok) {
        toaster.success({ title: "تم حفظ الإعدادات بنجاح" });
        setUser((prev) => prev ? { ...prev, name: settingsForm.name, bio: settingsForm.bio } : null);
      } else {
        toaster.error({ title: json.error || "حدث خطأ" });
      }
    } catch {
      toaster.error({ title: "حدث خطأ في الاتصال" });
    } finally {
      setSavingSettings(false);
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
      <Container maxW="6xl" px={{ base: 6, md: 8 }}>
        {/* Header */}
        <Box
          bg="linear-gradient(135deg, #0B1F3A 0%, #1a365d 100%)"
          borderRadius="2xl"
          p={{ base: 6, md: 10 }}
          mb={8}
          position="relative"
          overflow="hidden"
        >
          {/* Decorative elements */}
          <Box
            position="absolute"
            top="-50%"
            right="-10%"
            w="300px"
            h="300px"
            borderRadius="full"
            bg="radial-gradient(circle, rgba(200, 162, 74, 0.15) 0%, transparent 70%)"
            filter="blur(40px)"
          />
          
          <Stack direction={{ base: "column", md: "row" }} gap={6} align="center" position="relative">
            {/* Avatar */}
            <Box
              w={{ base: "80px", md: "100px" }}
              h={{ base: "80px", md: "100px" }}
              borderRadius="full"
              bg="linear-gradient(135deg, #c8a24a, #ffd700)"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize={{ base: "2xl", md: "4xl" }}
              fontWeight="900"
              color="brand.900"
              boxShadow="0 8px 30px rgba(200, 162, 74, 0.4)"
            >
              {user.name.charAt(0)}
            </Box>
            
            <Stack gap={2} flex={1} textAlign={{ base: "center", md: "start" }}>
              <Heading as="h1" size={{ base: "xl", md: "2xl" }} color="white">
                مرحباً، {user.name}
              </Heading>
              <Text color="gray.300">{user.email}</Text>
              <Stack direction="row" gap={2} justify={{ base: "center", md: "flex-start" }}>
                <Badge
                  bg="brand.500/20"
                  color="brand.300"
                  px={3}
                  py={1}
                  borderRadius="full"
                  fontSize="sm"
                >
                  عضو
                </Badge>
                {user.emailVerified && (
                  <Badge
                    bg="green.500/20"
                    color="green.300"
                    px={3}
                    py={1}
                    borderRadius="full"
                    fontSize="sm"
                  >
                    ✓ موثق
                  </Badge>
                )}
              </Stack>
            </Stack>

            <Button
              asChild
              bg="linear-gradient(135deg, #c8a24a, #ffd700)"
              color="brand.900"
              fontWeight="700"
              px={6}
              _hover={{
                transform: "translateY(-2px)",
                boxShadow: "0 4px 20px rgba(200, 162, 74, 0.4)",
              }}
            >
              <Link href="/social/create">✍️ أنشئ منشوراً</Link>
            </Button>
          </Stack>
        </Box>

        {/* Tabs */}
        <Stack direction="row" gap={2} mb={8} flexWrap="wrap">
          {[
            { id: "overview", label: "نظرة عامة", icon: "📊" },
            { id: "posts", label: "منشوراتي", icon: "📝" },
            { id: "settings", label: "الإعدادات", icon: "⚙️" },
          ].map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              variant={activeTab === tab.id ? "solid" : "outline"}
              bg={activeTab === tab.id ? "brand.500" : "transparent"}
              color={activeTab === tab.id ? "white" : "gray.600"}
              borderColor="gray.200"
              _hover={{
                bg: activeTab === tab.id ? "brand.600" : "gray.50",
              }}
            >
              {tab.icon} {tab.label}
            </Button>
          ))}
        </Stack>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
            <PremiumCard p={6}>
              <Stack gap={2} align="center" textAlign="center">
                <Text fontSize="3xl">📝</Text>
                <Text fontSize="3xl" fontWeight="900" color="brand.500">
                  {posts.length}
                </Text>
                <Text color="muted" fontWeight="600">منشور</Text>
              </Stack>
            </PremiumCard>
            
            <PremiumCard p={6}>
              <Stack gap={2} align="center" textAlign="center">
                <Text fontSize="3xl">❤️</Text>
                <Text fontSize="3xl" fontWeight="900" color="red.500">
                  {posts.reduce((sum, p) => sum + p.likesCount, 0)}
                </Text>
                <Text color="muted" fontWeight="600">إعجاب</Text>
              </Stack>
            </PremiumCard>
            
            <PremiumCard p={6}>
              <Stack gap={2} align="center" textAlign="center">
                <Text fontSize="3xl">💬</Text>
                <Text fontSize="3xl" fontWeight="900" color="blue.500">
                  {posts.reduce((sum, p) => sum + p.commentsCount, 0)}
                </Text>
                <Text color="muted" fontWeight="600">تعليق</Text>
              </Stack>
            </PremiumCard>
          </SimpleGrid>
        )}

        {activeTab === "posts" && (
          <Stack gap={4}>
            {posts.length === 0 ? (
              <PremiumCard p={8} textAlign="center">
                <Text fontSize="4xl" mb={4}>📝</Text>
                <Heading size="md" mb={2}>لا توجد منشورات بعد</Heading>
                <Text color="muted" mb={4}>ابدأ بمشاركة أفكارك مع المجتمع</Text>
                <Button asChild colorPalette="brand">
                  <Link href="/social/create">أنشئ منشورك الأول</Link>
                </Button>
              </PremiumCard>
            ) : (
              posts.map((post) => (
                <PremiumCard key={post.id} p={6}>
                  <Stack gap={3}>
                    {post.title && (
                      <Heading size="md">{post.title}</Heading>
                    )}
                    <Text color="gray.600" lineClamp={2}>
                      {post.content.replace(/<[^>]*>/g, "")}
                    </Text>
                    <Stack direction="row" gap={4} color="muted" fontSize="sm">
                      <Text>❤️ {post.likesCount}</Text>
                      <Text>💬 {post.commentsCount}</Text>
                      <Text>📅 {new Date(post.createdAt).toLocaleDateString("ar-SA")}</Text>
                      <Badge colorPalette={post.status === "PUBLISHED" ? "green" : "yellow"}>
                        {post.status === "PUBLISHED" ? "منشور" : "مسودة"}
                      </Badge>
                    </Stack>
                  </Stack>
                </PremiumCard>
              ))
            )}
          </Stack>
        )}

        {activeTab === "settings" && (
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={6}>
            {/* Profile Settings */}
            <PremiumCard p={6}>
              <Stack gap={5}>
                <Heading size="md">معلومات الحساب</Heading>
                
                <Field label="الاسم">
                  <Input
                    value={settingsForm.name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  />
                </Field>
                
                <Field label="نبذة عنك">
                  <Textarea
                    value={settingsForm.bio}
                    onChange={(e) => setSettingsForm({ ...settingsForm, bio: e.target.value })}
                    rows={4}
                    maxLength={500}
                  />
                </Field>
                
                <Button
                  onClick={handleSaveSettings}
                  colorPalette="brand"
                  loading={savingSettings}
                  loadingText="جاري الحفظ..."
                >
                  حفظ التغييرات
                </Button>
              </Stack>
            </PremiumCard>

            {/* Password Reset */}
            <PremiumCard p={6}>
              <Stack gap={5}>
                <Heading size="md">كلمة المرور</Heading>
                
                <Text color="muted">
                  لتغيير كلمة المرور، سنرسل لك رابطاً عبر البريد الإلكتروني
                </Text>
                
                <Box
                  p={4}
                  bg="gray.50"
                  borderRadius="lg"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <Text fontWeight="600" mb={1}>البريد الإلكتروني المسجل:</Text>
                  <Text color="muted">{user.email}</Text>
                </Box>
                
                <Button
                  onClick={handleRequestPasswordReset}
                  variant="outline"
                  colorPalette="brand"
                  loading={requestingReset}
                  loadingText="جاري الإرسال..."
                >
                  🔑 إرسال رابط إعادة تعيين كلمة المرور
                </Button>
              </Stack>
            </PremiumCard>
          </SimpleGrid>
        )}
      </Container>
    </Box>
  );
}
