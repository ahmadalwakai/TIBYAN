"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  Heading,
  Input,
  SimpleGrid,
  Stack,
  Text,
  Badge,
} from "@chakra-ui/react";
import PremiumCard from "@/components/ui/PremiumCard";
import Link from "next/link";
import { toaster } from "@/components/ui/toaster";

interface MemberResource {
  id: string;
  title: string;
  type: string;
  url?: string | null;
  content?: string | null;
  createdAt: string;
}

export default function MemberResourcesPage() {
  const [resources, setResources] = useState<MemberResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchResources = async (search: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/member/resources?q=${encodeURIComponent(search)}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (json.ok) {
        setResources(json.data.resources);
      } else {
        toaster.error({ title: json.error || "تعذر تحميل الموارد" });
      }
    } catch {
      toaster.error({ title: "حدث خطأ في الاتصال" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources("");
  }, []);

  const handleSearch = () => {
    fetchResources(query);
  };

  return (
    <Container maxW="6xl" px={{ base: 4, md: 6 }}>
      <Stack gap={6}>
        <Stack direction={{ base: "column", md: "row" }} justify="space-between" align="center">
          <Heading size="lg">الموارد الحصرية</Heading>
          <Stack direction={{ base: "column", sm: "row" }} gap={2} w={{ base: "full", sm: "auto" }}>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن مورد..."
              bg="background"
            />
            <Button onClick={handleSearch} bg="primary" color="primaryText">
              بحث
            </Button>
          </Stack>
        </Stack>

        {loading ? (
          <Box py={12} textAlign="center">
            <Text color="muted">جاري التحميل...</Text>
          </Box>
        ) : resources.length === 0 ? (
          <Box py={12} textAlign="center">
            <Text color="muted">لا توجد موارد مطابقة حالياً.</Text>
          </Box>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4}>
            {resources.map((resource) => (
              <PremiumCard key={resource.id} variant="bordered" p={5}>
                <Stack gap={3}>
                  <Stack direction="row" justify="space-between" align="center">
                    <Badge bg="accentSubtle" color="accent">
                      {resource.type}
                    </Badge>
                    <Text fontSize="xs" color="muted">
                      {new Date(resource.createdAt).toLocaleDateString("ar-SA")}
                    </Text>
                  </Stack>
                  <Heading size="sm">{resource.title}</Heading>
                  <Text color="muted" fontSize="sm">
                    {resource.content ? resource.content.slice(0, 120) : "مورد حصري للأعضاء"}
                  </Text>
                  {resource.url ? (
                    <Link href={resource.url} style={{ textDecoration: "none" }}>
                      <Button variant="outline" borderColor="border">
                        فتح المورد
                      </Button>
                    </Link>
                  ) : null}
                </Stack>
              </PremiumCard>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    </Container>
  );
}