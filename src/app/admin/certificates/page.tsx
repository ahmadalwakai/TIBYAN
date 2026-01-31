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
  IconButton,
  NativeSelect,
} from "@chakra-ui/react";
import { useState, useEffect, useRef, useCallback } from "react";
import CertificateTemplate, { templateNames } from "@/components/ui/CertificateTemplate";

interface Certificate {
  id: string;
  certificateNumber: string;
  studentName: string;
  studentNameEn?: string;
  courseName: string;
  courseNameEn?: string;
  completionDate: string;
  grade?: string;
  score?: number;
  instructorName?: string;
  courseDuration?: string;
  templateType: string;
  createdAt: string;
}

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
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"list" | "create" | "preview">("list");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [search, setSearch] = useState("");
  const certificateRef = useRef<HTMLDivElement>(null);

  const fetchCertificates = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);

      const res = await fetch(`/api/admin/certificates?${params}`);
      const data = await res.json();
      if (data.ok) {
        setCertificates(data.data.certificates);
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.studentName || !formData.courseName) {
      alert("يرجى إدخال اسم الطالب واسم الدورة");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        score: formData.score ? parseFloat(formData.score) : undefined,
        certificateNumber: formData.certificateNumber || undefined,
      };

      const res = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.ok) {
        setFormData({
          ...initialFormData,
          certificateNumber: data.data.certificateNumber,
        });
        setView("preview");
        fetchCertificates();
      } else {
        alert(data.error || "فشل في إنشاء الشهادة");
      }
    } catch (error) {
      console.error("Error creating certificate:", error);
      alert("حدث خطأ أثناء إنشاء الشهادة");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الشهادة؟")) return;

    try {
      const res = await fetch(`/api/admin/certificates?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        fetchCertificates();
      }
    } catch (error) {
      console.error("Error deleting certificate:", error);
    }
  };

  const handleExportPDF = async () => {
    if (!certificateRef.current) return;

    // Dynamic import for html2canvas
    const html2canvas = (await import("html2canvas")).default;
    
    const canvas = await html2canvas(certificateRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });

    // Dynamic import for jsPDF
    const { jsPDF } = await import("jspdf");
    
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvas.width / 2, canvas.height / 2],
    });
    
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`certificate-${formData.studentName || "tibyan"}.pdf`);
  };

  const handleExportImage = async () => {
    if (!certificateRef.current) return;

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
  };

  const handleViewCertificate = (cert: Certificate) => {
    setFormData({
      studentName: cert.studentName,
      studentNameEn: cert.studentNameEn || "",
      courseName: cert.courseName,
      courseNameEn: cert.courseNameEn || "",
      completionDate: new Date(cert.completionDate).toISOString().split("T")[0],
      grade: cert.grade || "",
      score: cert.score?.toString() || "",
      certificateNumber: cert.certificateNumber,
      instructorName: cert.instructorName || "",
      courseDuration: cert.courseDuration || "",
      templateType: cert.templateType as FormData["templateType"],
    });
    setView("preview");
  };

  return (
    <Box p={8}>
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
              }}
            >
              العودة للقائمة
            </Button>
          )}
          {view === "list" && (
            <Button
              colorPalette="green"
              onClick={() => setView("create")}
            >
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
                        {new Date(cert.completionDate).toLocaleDateString("ar-SA")}
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
                            colorPalette="red"
                            variant="ghost"
                            onClick={() => handleDelete(cert.id)}
                          >
                            حذف
                          </Button>
                        </HStack>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
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
                  />
                </Box>

                <Button
                  colorPalette="green"
                  size="lg"
                  mt={4}
                  onClick={handleSubmit}
                  loading={saving}
                  loadingText="جاري الإنشاء..."
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
                  <Button
                    colorPalette="blue"
                    onClick={handleExportPDF}
                  >
                    تصدير PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleExportImage}
                  >
                    تصدير صورة PNG
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setView("create")}
                  >
                    تعديل
                  </Button>
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
                      score: formData.score ? parseFloat(formData.score) : undefined,
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

          {/* Template Selector for Preview */}
          <Card.Root w="full">
            <Card.Header>
              <Heading size="sm">تغيير القالب</Heading>
            </Card.Header>
            <Card.Body>
              <HStack gap={4} wrap="wrap">
                {templateOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={formData.templateType === opt.value ? "solid" : "outline"}
                    colorPalette={formData.templateType === opt.value ? "green" : "gray"}
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
              </HStack>
            </Card.Body>
          </Card.Root>
        </VStack>
      )}
    </Box>
  );
}
