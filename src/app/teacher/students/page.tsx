"use client";

import {
  Box,
  Grid,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Spinner,
  Input,
  Button,
  Table,
  Avatar,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import PremiumCard from "@/components/ui/PremiumCard";
import StatCard from "@/components/ui/StatCard";

interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  enrolledCourses: number;
  totalPaid: number;
  lastActive: string;
  enrolledAt: string;
  courses: {
    id: string;
    title: string;
    progress: number;
  }[];
}

interface StudentStats {
  totalStudents: number;
  activeStudents: number;
  newThisMonth: number;
  averageProgress: number;
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchStudents() {
      try {
        const res = await fetch("/api/teacher/students");
        const data = await res.json();
        if (data.ok) {
          setStudents(data.data.students);
          setStats(data.data.stats);
        }
      } catch (error) {
        console.error("Failed to fetch students:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, []);

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box textAlign="center" py={20}>
        <Spinner size="xl" color="spinner" />
        <Text mt={4} color="muted">جاري تحميل الطلاب...</Text>
      </Box>
    );
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <Box>
        <Heading size="xl" color="text" mb={2}>
          طلابي 👥
        </Heading>
        <Text color="muted">
          جميع الطلاب المسجلين في دوراتك
        </Text>
      </Box>

      {/* Stats */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={4}>
        <StatCard
          title="إجمالي الطلاب"
          value={stats?.totalStudents ?? 0}
          icon="👥"
          color="accent"
        />
        <StatCard
          title="طلاب نشطين"
          value={stats?.activeStudents ?? 0}
          icon="✅"
          color="green.500"
        />
        <StatCard
          title="طلاب هذا الشهر"
          value={stats?.newThisMonth ?? 0}
          icon="📈"
          color="blue.500"
        />
        <StatCard
          title="متوسط التقدم"
          value={`${stats?.averageProgress ?? 0}%`}
          icon="📊"
          color="purple.500"
        />
      </Grid>

      {/* Search */}
      <Input
        placeholder="ابحث عن طالب بالاسم أو البريد..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        maxW="400px"
        bg="surface"
      />

      {/* Students Table */}
      <PremiumCard variant="elevated">
        <Box p={6}>
          <Heading size="md" mb={4}>قائمة الطلاب</Heading>
          
          {filteredStudents.length === 0 ? (
            <Box textAlign="center" py={12}>
              <Text fontSize="5xl" mb={4}>👥</Text>
              <Heading size="md" color="text" mb={2}>
                {searchTerm ? "لا توجد نتائج" : "لا يوجد طلاب بعد"}
              </Heading>
              <Text color="muted">
                {searchTerm
                  ? "جرب البحث بكلمات مختلفة"
                  : "سيظهر هنا طلابك عند التسجيل في دوراتك"}
              </Text>
            </Box>
          ) : (
            <Box overflowX="auto">
              <Table.Root variant="outline" size="sm">
                <Table.Header>
                  <Table.Row bg="backgroundAlt">
                    <Table.ColumnHeader>الطالب</Table.ColumnHeader>
                    <Table.ColumnHeader>الدورات</Table.ColumnHeader>
                    <Table.ColumnHeader>المدفوعات</Table.ColumnHeader>
                    <Table.ColumnHeader>آخر نشاط</Table.ColumnHeader>
                    <Table.ColumnHeader>تاريخ التسجيل</Table.ColumnHeader>
                    <Table.ColumnHeader>الإجراءات</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredStudents.map((student) => (
                    <Table.Row key={student.id}>
                      <Table.Cell>
                        <HStack gap={3}>
                          <Avatar.Root size="sm">
                            <Avatar.Fallback bg="avatarBg" color="avatarText">
                              {student.name.charAt(0)}
                            </Avatar.Fallback>
                          </Avatar.Root>
                          <Box>
                            <Text fontWeight="600" fontSize="sm">
                              {student.name}
                            </Text>
                            <Text fontSize="xs" color="muted">
                              {student.email}
                            </Text>
                          </Box>
                        </HStack>
                      </Table.Cell>
                      <Table.Cell>
                        <VStack gap={1} align="start">
                          <Badge bg="accentSubtle" color="accent">
                            {student.enrolledCourses} دورات
                          </Badge>
                          {student.courses.slice(0, 2).map((course) => (
                            <Text key={course.id} fontSize="xs" color="muted">
                              {course.title} ({course.progress}%)
                            </Text>
                          ))}
                        </VStack>
                      </Table.Cell>
                      <Table.Cell>
                        <Text fontWeight="700" color="green.600">
                          {student.totalPaid} ر.س
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text fontSize="sm" color="muted">
                          {student.lastActive}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Text fontSize="sm" color="muted">
                          {student.enrolledAt}
                        </Text>
                      </Table.Cell>
                      <Table.Cell>
                        <HStack gap={2}>
                          <Button size="xs" variant="outline">
                            عرض التفاصيل
                          </Button>
                          <Button size="xs" variant="outline">
                            مراسلة
                          </Button>
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          )}
        </Box>
      </PremiumCard>
    </VStack>
  );
}
