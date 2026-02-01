"use client";

import {
  Box,
  Button,
  Card,
  Flex,
  Heading,
  Input,
  Stack,
  Text,
  VStack,
  HStack,
  Badge,
  Table,
  Spinner,
  NativeSelect,
  Dialog,
  SimpleGrid,
} from "@chakra-ui/react";
import { useState, useEffect, useRef, useCallback, useTransition } from "react";
import { toaster } from "@/components/ui/toaster";
import CertificateTemplate, { templateNames } from "@/components/ui/CertificateTemplate";
import type { CertificateDTO } from "@/types/certificate";
import {
  fetchCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
} from "@/lib/certificate-service";

interface FormData {
  studentName: string;
  studentNameEn: string;
  courseName: string;
  courseNameEn: string;
  completionDate: string;
  grade: string;
  score: string;
  certificateNumber: string;
  instructorName: string;
  courseDuration: string;
  templateType: string;
}

const initialFormData: FormData = {
  studentName: "",
  studentNameEn: "",
  courseName: "",
  courseNameEn: "",
  completionDate: new Date().toISOString().split("T")[0],
  grade: "",
  score: "",
  certificateNumber: "",
  instructorName: "",
  courseDuration: "",
  templateType: "template1",
};

// Generate template options from templateNames
const templateOptions = Object.entries(templateNames).map(([value, info]) => ({
  value,
  label: `${info.name} - ${info.description}`,
}));

const gradeOptions = [
  { value: "", label: "اختر التقدير" },
  { value: "ممتاز", label: "ممتاز" },
  { value: "جيد جداً", label: "جيد جداً" },
  { value: "جيد", label: "جيد" },
  { value: "مقبول", label: "مقبول" },
];

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "create" | "preview" | "edit">("list");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const certificateRef = useRef<HTMLDivElement>(null);

  const loadCertificates = useCallback(
    async (pageNum: number = 1) => {
      setLoading(true);
      try {
        const result = await fetchCertificates({
          page: pageNum,
          limit,
          search,
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        if (result.ok && result.data) {
          setCertificates(result.data.certificates);
          setTotalPages(result.data.pagination.totalPages);
          setPage(pageNum);
        } else {
          toaster.create({
            title: "خطأ",
            description: result.error || "فشل تحميل الشهادات",
            type: "error",
          });
        }
      } catch (error) {
        console.error("Error loading certificates:", error);
        toaster.create({
          title: "خطأ",
          description: "حدث خطأ أثناء تحميل الشهادات",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [search, limit]
  );

  useEffect(() => {
    startTransition(() => {
      loadCertificates(1);
    });
  }, [search, loadCertificates, startTransition]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.studentName.trim()) {
      toaster.create({
        title: "خطأ في التحقق",
        description: "اسم الطالب مطلوب",
        type: "error",
      });
      return false;
    }
    if (!formData.courseName.trim()) {
      toaster.create({
        title: "خطأ في التحقق",
        description: "اسم الدورة مطلوب",
        type: "error",
      });
      return false;
    }
    if (formData.score && (isNaN(parseFloat(formData.score)) || parseFloat(formData.score) < 0 || parseFloat(formData.score) > 100)) {
      toaster.create({
        title: "خطأ في التحقق",
        description: "الدرجة يجب أن تكون بين 0 و 100",
        type: "error",
      });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        studentName: formData.studentName.trim(),
        studentNameEn: formData.studentNameEn.trim() || null,
        courseName: formData.courseName.trim(),
        courseNameEn: formData.courseNameEn.trim() || null,
        completionDate: formData.completionDate,
        grade: formData.grade || null,
        score: formData.score ? parseFloat(formData.score) : null,
        certificateNumber: formData.certificateNumber || null,
        instructorName: formData.instructorName.trim() || null,
        courseDuration: formData.courseDuration.trim() || null,
        templateType: formData.templateType as "template1" | "template2" | "template3" | "template4" | "template5" | "template6" | "template7" | "template8" | "template9" | "template10" | "template11" | "template12" | "template13" | "template14" | "template15" | "template16" | "template17" | "template18" | "template19" | "template20",
      };

      let result;
      if (editingId) {
        result = await updateCertificate(editingId, payload);
      } else {
        result = await createCertificate(payload);
      }

      if (result.ok) {
        toaster.create({
          title: "نجح",
          description: editingId ? "تم تحديث الشهادة" : "تم إنشاء الشهادة",
          type: "success",
        });
        setFormData({
          ...initialFormData,
          certificateNumber: result.data?.certificateNumber || "",
        });
        setEditingId(null);
        setView("preview");
        await loadCertificates(1);
      } else {
        toaster.create({
          title: "خطأ",
          description: result.error || "فشل العملية",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toaster.create({
        title: "خطأ",
        description: "حدث خطأ غير متوقع",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;

    setDeleting(deleteTargetId);
    try {
      const result = await deleteCertificate(deleteTargetId);

      if (result.ok) {
        toaster.create({
          title: "نجح",
          description: "تم حذف الشهادة",
          type: "success",
        });
        setDeleteDialogOpen(false);
        setDeleteTargetId(null);
        await loadCertificates(page);
      } else {
        toaster.create({
          title: "خطأ",
          description: result.error || "فشل حذف الشهادة",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting:", error);
      toaster.create({
        title: "خطأ",
        description: "حدث خطأ أثناء الحذف",
        type: "error",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleExportPDF = async () => {
    if (!certificateRef.current) return;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      const { jsPDF } = await import("jspdf");
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width / 2, canvas.height / 2],
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`certificate-${formData.studentName || "tibyan"}.pdf`);
      
      toaster.create({
        title: "نجح",
        description: "تم تصدير الشهادة كـ PDF",
        type: "success",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toaster.create({
        title: "خطأ",
        description: "فشل تصدير PDF",
        type: "error",
      });
    }
  };

  const handleExportImage = async () => {
    if (!certificateRef.current) return;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      const link = document.createElement("a");
      link.download = `certificate-${formData.studentName || "tibyan"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toaster.create({
        title: "نجح",
        description: "تم تصدير الشهادة كصورة",
        type: "success",
      });
    } catch (error) {
      console.error("Error exporting image:", error);
      toaster.create({
        title: "خطأ",
        description: "فشل تصدير الصورة",
        type: "error",
      });
    }
  };

  const handleViewCertificate = (cert: CertificateDTO) => {
    setFormData({
      studentName: cert.studentName,
      studentNameEn: cert.studentNameEn || "",
      courseName: cert.courseName,
      courseNameEn: cert.courseNameEn || "",
      completionDate: new Date(cert.completionDate)
        .toISOString()
        .split("T")[0],
      grade: cert.grade || "",
      score: cert.score?.toString() || "",
      certificateNumber: cert.certificateNumber,
      instructorName: cert.instructorName || "",
      courseDuration: cert.courseDuration || "",
      templateType: cert.templateType,
    });
    setEditingId(null);
    setView("preview");
  };

  const handleEditCertificate = (cert: CertificateDTO) => {
    setEditingId(cert.id);
    setFormData({
      studentName: cert.studentName,
      studentNameEn: cert.studentNameEn || "",
      courseName: cert.courseName,
      courseNameEn: cert.courseNameEn || "",
      completionDate: new Date(cert.completionDate)
        .toISOString()
        .split("T")[0],
      grade: cert.grade || "",
      score: cert.score?.toString() || "",
      certificateNumber: cert.certificateNumber,
      instructorName: cert.instructorName || "",
      courseDuration: cert.courseDuration || "",
      templateType: cert.templateType,
    });
    setView("edit");
  };

  return (
    <Box p={8} dir="rtl">
      <Flex justify="space-between" align="center" mb={8}>
        <Box>
          <Heading size="lg">إدارة الشهادات</Heading>
          <Text color="gray.500" mt={1}>
            إنشاء وتصدير شهادات الطلاب
          </Text>
        </Box>
        <HStack gap={2}>
          {view !== "list" && (
            <Button
              variant="outline"
              onClick={() => {
                setView("list");
                setFormData(initialFormData);
                setEditingId(null);
              }}
            >
              العودة للقائمة
            </Button>
          )}
          {view === "list" && (
            <Button colorPalette="green" onClick={() => setView("create")}>
              إنشاء شهادة جديدة
            </Button>
          )}
        </HStack>
      </Flex>

      {/* List View */}
      {view === "list" && (
        <Card.Root>
          <Card.Header>
            <Flex justify="space-between" align="center">
              <Heading size="md">الشهادات المُصدرة</Heading>
              <Input
                placeholder="بحث..."
                maxW="300px"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Flex>
          </Card.Header>
          <Card.Body p={0}>
            {loading ? (
              <Flex justify="center" py={12}>
                <Spinner size="lg" />
              </Flex>
            ) : certificates.length === 0 ? (
              <VStack py={12} gap={4}>
                <Text color="gray.500" fontSize="lg">
                  لا توجد شهادات مُصدرة بعد
                </Text>
                <Button
                  colorPalette="green"
                  onClick={() => setView("create")}
                >
                  إنشاء أول شهادة
                </Button>
              </VStack>
            ) : (
              <Box overflowX="auto">
                <Table.Root>
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeader>رقم الشهادة</Table.ColumnHeader>
                      <Table.ColumnHeader>اسم الطالب</Table.ColumnHeader>
                      <Table.ColumnHeader>الدورة</Table.ColumnHeader>
                      <Table.ColumnHeader>التقدير</Table.ColumnHeader>
                      <Table.ColumnHeader>التاريخ</Table.ColumnHeader>
                      <Table.ColumnHeader>الإجراءات</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {certificates.map((cert) => (
                      <Table.Row key={cert.id}>
                        <Table.Cell>
                          <Text fontFamily="mono" fontSize="sm">
                            {cert.certificateNumber}
                          </Text>
                        </Table.Cell>
                        <Table.Cell fontWeight="medium">
                          {cert.studentName}
                        </Table.Cell>
                        <Table.Cell>{cert.courseName}</Table.Cell>
                        <Table.Cell>
                          {cert.grade && (
                            <Badge colorPalette="green">{cert.grade}</Badge>
                          )}
                          {cert.score && !cert.grade && (
                            <Badge colorPalette="blue">{cert.score}%</Badge>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          {new Date(cert.completionDate).toLocaleDateString(
                            "ar-SA"
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <HStack gap={1}>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleViewCertificate(cert)}
                            >
                              عرض
                            </Button>
                            <Button
                              size="xs"
                              variant="outline"
                              onClick={() => handleEditCertificate(cert)}
                            >
                              تعديل
                            </Button>
                            <Button
                              size="xs"
                              colorPalette="red"
                              variant="ghost"
                              onClick={() => {
                                setDeleteTargetId(cert.id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              حذف
                            </Button>
                          </HStack>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}

            {/* Pagination */}
            {certificates.length > 0 && totalPages > 1 && (
              <Flex justify="center" align="center" gap={2} py={4} borderTop="1px solid">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadCertificates(page - 1)}
                  disabled={page === 1}
                >
                  السابق
                </Button>
                <Text fontSize="sm">
                  الصفحة {page} من {totalPages}
                </Text>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadCertificates(page + 1)}
                  disabled={page === totalPages}
                >
                  التالي
                </Button>
              </Flex>
            )}
          </Card.Body>
        </Card.Root>
      )}

      {/* Create Form View */}
      {view === "create" && (
        <Flex gap={8} direction={{ base: "column", xl: "row" }}>
          {/* Form */}
          <Card.Root flex={1} maxW={{ xl: "500px" }}>
            <Card.Header>
              <Heading size="md">بيانات الشهادة</Heading>
            </Card.Header>
            <Card.Body>
              <Stack gap={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    اسم الطالب (عربي) *
                  </Text>
                  <Input
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                    placeholder="أدخل اسم الطالب بالعربية"
                  />
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    اسم الطالب (إنجليزي)
                  </Text>
                  <Input
                    name="studentNameEn"
                    value={formData.studentNameEn}
                    onChange={handleInputChange}
                    placeholder="Enter student name in English"
                    dir="ltr"
                  />
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    اسم الدورة (عربي) *
                  </Text>
                  <Input
                    name="courseName"
                    value={formData.courseName}
                    onChange={handleInputChange}
                    placeholder="أدخل اسم الدورة بالعربية"
                  />
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    اسم الدورة (إنجليزي)
                  </Text>
                  <Input
                    name="courseNameEn"
                    value={formData.courseNameEn}
                    onChange={handleInputChange}
                    placeholder="Enter course name in English"
                    dir="ltr"
                  />
                </Box>

                <HStack gap={4}>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      التقدير
                    </Text>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        name="grade"
                        value={formData.grade}
                        onChange={handleInputChange}
                      >
                        {gradeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                  </Box>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      الدرجة (%)
                    </Text>
                    <Input
                      name="score"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.score}
                      onChange={handleInputChange}
                      placeholder="95"
                    />
                  </Box>
                </HStack>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    تاريخ الإتمام
                  </Text>
                  <Input
                    name="completionDate"
                    type="date"
                    value={formData.completionDate}
                    onChange={handleInputChange}
                  />
                </Box>

                <HStack gap={4}>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      اسم المدرب
                    </Text>
                    <Input
                      name="instructorName"
                      value={formData.instructorName}
                      onChange={handleInputChange}
                      placeholder="اسم المدرب"
                    />
                  </Box>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      مدة الدورة
                    </Text>
                    <Input
                      name="courseDuration"
                      value={formData.courseDuration}
                      onChange={handleInputChange}
                      placeholder="مثال: 40 ساعة"
                    />
                  </Box>
                </HStack>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    قالب الشهادة
                  </Text>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      name="templateType"
                      value={formData.templateType}
                      onChange={handleInputChange}
                    >
                      {templateOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    رقم الشهادة (اختياري)
                  </Text>
                  <Input
                    name="certificateNumber"
                    value={formData.certificateNumber}
                    onChange={handleInputChange}
                    placeholder="سيتم إنشاؤه تلقائياً"
                    dir="ltr"
                    disabled
                  />
                </Box>

                <Button
                  colorPalette="green"
                  size="lg"
                  mt={4}
                  onClick={handleSubmit}
                  loading={saving}
                  disabled={saving}
                >
                  إنشاء الشهادة
                </Button>
              </Stack>
            </Card.Body>
          </Card.Root>

          {/* Preview */}
          <Box flex={2}>
            <Card.Root>
              <Card.Header>
                <Heading size="md">معاينة الشهادة</Heading>
              </Card.Header>
              <Card.Body overflow="auto">
                <Box
                  transform="scale(0.6)"
                  transformOrigin="top right"
                  mb={-200}
                >
                  <CertificateTemplate
                    ref={certificateRef}
                    data={{
                      studentName: formData.studentName || "اسم الطالب",
                      studentNameEn: formData.studentNameEn || undefined,
                      courseName: formData.courseName || "اسم الدورة",
                      courseNameEn: formData.courseNameEn || undefined,
                      completionDate: formData.completionDate,
                      grade: formData.grade || undefined,
                      score: formData.score ? parseFloat(formData.score) : undefined,
                      certificateNumber: formData.certificateNumber || "TBY-XXXXX-XXXX",
                      instructorName: formData.instructorName || undefined,
                      courseDuration: formData.courseDuration || undefined,
                    }}
                    template={formData.templateType}
                  />
                </Box>
              </Card.Body>
            </Card.Root>
          </Box>
        </Flex>
      )}

      {/* Preview/Export View */}
      {view === "preview" && (
        <VStack gap={6}>
          <Card.Root w="full">
            <Card.Header>
              <Flex justify="space-between" align="center">
                <Heading size="md">الشهادة جاهزة للتصدير</Heading>
                <HStack gap={2}>
                  <Button colorPalette="blue" onClick={handleExportPDF}>
                    تصدير PDF
                  </Button>
                  <Button variant="outline" onClick={handleExportImage}>
                    تصدير صورة PNG
                  </Button>
                  {!editingId && (
                    <Button
                      variant="ghost"
                      onClick={() => setView("create")}
                    >
                      إنشاء أخرى
                    </Button>
                  )}
                </HStack>
              </Flex>
            </Card.Header>
            <Card.Body>
              <Flex justify="center" overflow="auto" py={4}>
                <Box shadow="2xl" borderRadius="lg" overflow="hidden">
                  <CertificateTemplate
                    ref={certificateRef}
                    data={{
                      studentName: formData.studentName,
                      studentNameEn: formData.studentNameEn || undefined,
                      courseName: formData.courseName,
                      courseNameEn: formData.courseNameEn || undefined,
                      completionDate: formData.completionDate,
                      grade: formData.grade || undefined,
                      score: formData.score
                        ? parseFloat(formData.score)
                        : undefined,
                      certificateNumber: formData.certificateNumber,
                      instructorName: formData.instructorName || undefined,
                      courseDuration: formData.courseDuration || undefined,
                    }}
                    template={formData.templateType}
                  />
                </Box>
              </Flex>
            </Card.Body>
          </Card.Root>

          <Card.Root w="full">
            <Card.Header>
              <Heading size="sm">تغيير القالب</Heading>
            </Card.Header>
            <Card.Body>
              <SimpleGrid columns={{ base: 2, md: 4, lg: 5 }} gap={2}>
                {templateOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={
                      formData.templateType === opt.value ? "solid" : "outline"
                    }
                    colorPalette={
                      formData.templateType === opt.value ? "green" : "gray"
                    }
                    size="sm"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        templateType: opt.value as FormData["templateType"],
                      }))
                    }
                  >
                    {opt.label.split(" - ")[0]}
                  </Button>
                ))}
              </SimpleGrid>
            </Card.Body>
          </Card.Root>
        </VStack>
      )}

      {/* Edit Form View */}
      {view === "edit" && (
        <Flex gap={8} direction={{ base: "column", xl: "row" }}>
          <Card.Root flex={1} maxW={{ xl: "500px" }}>
            <Card.Header>
              <Heading size="md">تعديل الشهادة</Heading>
            </Card.Header>
            <Card.Body>
              <Stack gap={4}>
                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    رقم الشهادة
                  </Text>
                  <Input
                    value={formData.certificateNumber}
                    readOnly
                    fontFamily="mono"
                  />
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    اسم الطالب (عربي) *
                  </Text>
                  <Input
                    name="studentName"
                    value={formData.studentName}
                    onChange={handleInputChange}
                  />
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    اسم الطالب (إنجليزي)
                  </Text>
                  <Input
                    name="studentNameEn"
                    value={formData.studentNameEn}
                    onChange={handleInputChange}
                    dir="ltr"
                  />
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    اسم الدورة (عربي) *
                  </Text>
                  <Input
                    name="courseName"
                    value={formData.courseName}
                    onChange={handleInputChange}
                  />
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    اسم الدورة (إنجليزي)
                  </Text>
                  <Input
                    name="courseNameEn"
                    value={formData.courseNameEn}
                    onChange={handleInputChange}
                    dir="ltr"
                  />
                </Box>

                <HStack gap={4}>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      التقدير
                    </Text>
                    <NativeSelect.Root>
                      <NativeSelect.Field
                        name="grade"
                        value={formData.grade}
                        onChange={handleInputChange}
                      >
                        {gradeOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </NativeSelect.Field>
                    </NativeSelect.Root>
                  </Box>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      الدرجة (%)
                    </Text>
                    <Input
                      name="score"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.score}
                      onChange={handleInputChange}
                    />
                  </Box>
                </HStack>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    تاريخ الإتمام
                  </Text>
                  <Input
                    name="completionDate"
                    type="date"
                    value={formData.completionDate}
                    onChange={handleInputChange}
                  />
                </Box>

                <HStack gap={4}>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      اسم المدرب
                    </Text>
                    <Input
                      name="instructorName"
                      value={formData.instructorName}
                      onChange={handleInputChange}
                    />
                  </Box>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium" mb={1}>
                      مدة الدورة
                    </Text>
                    <Input
                      name="courseDuration"
                      value={formData.courseDuration}
                      onChange={handleInputChange}
                    />
                  </Box>
                </HStack>

                <Box>
                  <Text fontSize="sm" fontWeight="medium" mb={1}>
                    قالب الشهادة
                  </Text>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      name="templateType"
                      value={formData.templateType}
                      onChange={handleInputChange}
                    >
                      {templateOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                  </NativeSelect.Root>
                </Box>

                <Button
                  colorPalette="blue"
                  size="lg"
                  mt={4}
                  onClick={handleSubmit}
                  loading={saving}
                  disabled={saving}
                >
                  تحديث الشهادة
                </Button>
              </Stack>
            </Card.Body>
          </Card.Root>

          <Box flex={2}>
            <Card.Root>
              <Card.Header>
                <Heading size="md">معاينة الشهادة</Heading>
              </Card.Header>
              <Card.Body overflow="auto">
                <Box
                  transform="scale(0.6)"
                  transformOrigin="top right"
                  mb={-200}
                >
                  <CertificateTemplate
                    ref={certificateRef}
                    data={{
                      studentName: formData.studentName || "اسم الطالب",
                      studentNameEn: formData.studentNameEn || undefined,
                      courseName: formData.courseName || "اسم الدورة",
                      courseNameEn: formData.courseNameEn || undefined,
                      completionDate: formData.completionDate,
                      grade: formData.grade || undefined,
                      score: formData.score
                        ? parseFloat(formData.score)
                        : undefined,
                      certificateNumber: formData.certificateNumber,
                      instructorName: formData.instructorName || undefined,
                      courseDuration: formData.courseDuration || undefined,
                    }}
                    template={formData.templateType}
                  />
                </Box>
              </Card.Body>
            </Card.Root>
          </Box>
        </Flex>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog.Root
        open={deleteDialogOpen}
        onOpenChange={(state) => setDeleteDialogOpen(state.open)}
        placement="center"
      >
        <Dialog.Backdrop />
        <Dialog.Content>
          <Dialog.Header>تأكيد الحذف</Dialog.Header>
          <Dialog.Body>
            <Text>هل أنت متأكد من رغبتك في حذف هذه الشهادة؟ لا يمكن التراجع عن هذا الإجراء.</Text>
          </Dialog.Body>
          <Dialog.Footer>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={!!deleting}
            >
              إلغاء
            </Button>
            <Button
              colorPalette="red"
              onClick={handleDeleteConfirm}
              loading={!!deleting}
              disabled={!!deleting}
            >
              حذف
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
}
