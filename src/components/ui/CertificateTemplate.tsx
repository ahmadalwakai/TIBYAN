"use client";

import { Box, Flex, Text, VStack, HStack } from "@chakra-ui/react";
import { forwardRef } from "react";

interface CertificateData {
  studentName: string;
  studentNameEn?: string;
  courseName: string;
  courseNameEn?: string;
  completionDate: string;
  grade?: string;
  score?: number;
  certificateNumber: string;
  instructorName?: string;
  courseDuration?: string;
}

interface CertificateTemplateProps {
  data: CertificateData;
  template?: string;
}

// Template 1: Classic Islamic - Gold borders with Islamic geometric patterns
const Template1 = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => (
  <Box ref={ref} w="1056px" h="816px" bg="linear-gradient(135deg, #fdfcfb 0%, #f5f0e8 100%)" position="relative" overflow="hidden" p={0}>
    <Box position="absolute" inset="15px" border="4px solid" borderColor="#B8860B" borderRadius="md" />
    <Box position="absolute" inset="25px" border="2px solid" borderColor="#DAA520" borderRadius="md" />
    <Box position="absolute" inset="35px" border="1px solid" borderColor="#B8860B" opacity={0.5} borderRadius="md" />
    {[0, 1, 2, 3].map((i) => (
      <Box key={i} position="absolute" w="100px" h="100px"
        {...(i < 2 ? { top: "25px" } : { bottom: "25px" })}
        {...(i % 2 === 0 ? { left: "25px" } : { right: "25px" })}
      >
        <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", opacity: 0.4 }}>
          <path d="M0,0 L40,0 L40,5 L5,5 L5,40 L0,40 Z" fill="#B8860B" transform={`rotate(${i * 90} 50 50)`} />
          <circle cx="20" cy="20" r="8" fill="none" stroke="#DAA520" strokeWidth="1" transform={`rotate(${i * 90} 50 50)`} />
        </svg>
      </Box>
    ))}
    <VStack h="full" justify="center" gap={3} px={20} py={12}>
      <Text fontSize="sm" color="#B8860B" letterSpacing="0.3em">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</Text>
      <Text fontSize="lg" color="#8B7355" fontWeight="medium" letterSpacing="widest" mt={2}>أكاديمية تِبيان للتعليم الإسلامي</Text>
      <Text fontSize="4xl" fontWeight="bold" color="#8B4513" fontFamily="serif" mt={4}>شهادة إتمام</Text>
      <Box w="300px" h="2px" bg="linear-gradient(90deg, transparent, #B8860B, transparent)" mt={2} />
      <Text fontSize="md" color="#666" mt={4}>تشهد أكاديمية تِبيان أن</Text>
      <Box borderBottom="3px double" borderColor="#B8860B" px={16} pb={2} mt={2}>
        <Text fontSize="3xl" fontWeight="bold" color="#4A3728" fontFamily="serif">{data.studentName}</Text>
        {data.studentNameEn && <Text fontSize="lg" color="#8B7355" mt={1}>{data.studentNameEn}</Text>}
      </Box>
      <Text fontSize="md" color="#666" mt={4}>قد أتم بنجاح متطلبات</Text>
      <Text fontSize="2xl" fontWeight="bold" color="#B8860B" textAlign="center" maxW="500px">{data.courseName}</Text>
      {(data.grade || data.score) && (
        <HStack gap={12} mt={4}>
          {data.grade && <VStack gap={0}><Text fontSize="xs" color="#999">التقدير</Text><Text fontSize="xl" fontWeight="bold" color="#B8860B">{data.grade}</Text></VStack>}
          {data.score && <VStack gap={0}><Text fontSize="xs" color="#999">الدرجة</Text><Text fontSize="xl" fontWeight="bold" color="#B8860B">{data.score}%</Text></VStack>}
        </HStack>
      )}
      <HStack gap={20} mt={6}>
        <VStack gap={0}><Text fontSize="sm" color="#666">{new Date(data.completionDate).toLocaleDateString("ar-SA")}</Text><Text fontSize="xs" color="#999">تاريخ الإصدار</Text></VStack>
        {data.courseDuration && <VStack gap={0}><Text fontSize="sm" color="#666">{data.courseDuration}</Text><Text fontSize="xs" color="#999">مدة الدورة</Text></VStack>}
      </HStack>
      <HStack gap={32} mt={8}>
        <VStack gap={1}><Box w="120px" borderBottom="1px solid" borderColor="#B8860B" /><Text fontSize="xs" color="#666">{data.instructorName || "المدرب"}</Text></VStack>
        <VStack gap={1}><Box w="120px" borderBottom="1px solid" borderColor="#B8860B" /><Text fontSize="xs" color="#666">إدارة الأكاديمية</Text></VStack>
      </HStack>
      <Text fontSize="xs" color="#999" mt={4}>{data.certificateNumber}</Text>
    </VStack>
  </Box>
));
Template1.displayName = "Template1";

// Template 2: Modern Green
const Template2 = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => (
  <Box ref={ref} w="1056px" h="816px" bg="white" position="relative" overflow="hidden">
    <Box position="absolute" top={0} left={0} right={0} h="10px" bg="linear-gradient(90deg, #059669 0%, #10b981 50%, #34d399 100%)" />
    <Box position="absolute" top="10px" right={0} w="180px" h="full" bg="linear-gradient(180deg, #ecfdf5 0%, #d1fae5 100%)" />
    <Flex h="full" pr="180px" pl={16} py={12} direction="column">
      <HStack justify="space-between" align="start">
        <VStack align="start" gap={0}><Text fontSize="2xl" fontWeight="bold" color="#059669">تِبيان</Text><Text fontSize="xs" color="#6b7280">Tibyan Academy</Text></VStack>
        <Box bg="#059669" color="white" px={4} py={1} borderRadius="full" fontSize="xs" fontWeight="bold">شهادة معتمدة</Box>
      </HStack>
      <VStack flex={1} justify="center" align="start" gap={5}>
        <Text fontSize="5xl" fontWeight="light" color="#1f2937" lineHeight="1.1">شهادة<br /><Text as="span" fontWeight="bold" color="#059669">إتمام دورة</Text></Text>
        <Box borderRight="4px solid" borderColor="#10b981" pr={4}>
          <Text fontSize="xs" color="#9ca3af" mb={1}>تم منح هذه الشهادة إلى</Text>
          <Text fontSize="3xl" fontWeight="bold" color="#111827">{data.studentName}</Text>
          {data.studentNameEn && <Text fontSize="md" color="#6b7280">{data.studentNameEn}</Text>}
        </Box>
        <Box><Text fontSize="xs" color="#9ca3af" mb={1}>لإتمامه بنجاح</Text><Text fontSize="xl" fontWeight="semibold" color="#374151">{data.courseName}</Text></Box>
        <HStack gap={10}>
          {data.score && <Box><Text fontSize="xs" color="#9ca3af">الدرجة</Text><Text fontSize="2xl" fontWeight="bold" color="#059669">{data.score}%</Text></Box>}
          {data.grade && <Box><Text fontSize="xs" color="#9ca3af">التقدير</Text><Text fontSize="2xl" fontWeight="bold" color="#059669">{data.grade}</Text></Box>}
          <Box><Text fontSize="xs" color="#9ca3af">التاريخ</Text><Text fontSize="md" fontWeight="medium" color="#374151">{new Date(data.completionDate).toLocaleDateString("ar-SA")}</Text></Box>
        </HStack>
      </VStack>
      <HStack justify="space-between" align="end">
        <VStack align="start" gap={0}><Box w="100px" borderBottom="2px solid" borderColor="#d1d5db" mb={1} /><Text fontSize="xs" color="#6b7280">{data.instructorName || "توقيع المدرب"}</Text></VStack>
        <Text fontSize="xs" color="#d1d5db">{data.certificateNumber}</Text>
      </HStack>
    </Flex>
    <VStack position="absolute" top="60px" right="35px" w="110px" gap={6} align="center">
      <Box w="60px" h="60px" borderRadius="full" bg="#059669" display="flex" alignItems="center" justifyContent="center"><Text fontSize="2xl" color="white">✓</Text></Box>
      {data.courseDuration && <VStack gap={0}><Text fontSize="xs" color="#9ca3af">المدة</Text><Text fontSize="sm" fontWeight="bold" color="#059669">{data.courseDuration}</Text></VStack>}
    </VStack>
  </Box>
));
Template2.displayName = "Template2";

// Template 3: Elegant Dark Gold
const Template3 = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => (
  <Box ref={ref} w="1056px" h="816px" bg="linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" position="relative" overflow="hidden">
    <Box position="absolute" inset="25px" border="2px solid" borderColor="#fbbf24" borderRadius="lg" />
    <Box position="absolute" inset="33px" border="1px solid" borderColor="#f59e0b" opacity={0.3} borderRadius="lg" />
    <Box position="absolute" top="-80px" right="-80px" w="250px" h="250px" borderRadius="full" border="1px solid" borderColor="#fbbf24" opacity={0.1} />
    <Box position="absolute" bottom="-120px" left="-120px" w="350px" h="350px" borderRadius="full" border="1px solid" borderColor="#fbbf24" opacity={0.1} />
    <VStack h="full" justify="center" gap={4} px={20} py={12}>
      <Text color="#fbbf24" fontSize="4xl" mb={-2}>★</Text>
      <Text fontSize="xs" color="#fbbf24" letterSpacing="0.4em">أكاديمية تِبيان</Text>
      <Text fontSize="4xl" fontWeight="bold" color="white" fontFamily="serif" mt={2}>شهادة تقدير</Text>
      <Box w="180px" h="1px" bg="#fbbf24" opacity={0.4} />
      <Text fontSize="md" color="#9ca3af" mt={4}>تُمنح هذه الشهادة إلى</Text>
      <Text fontSize="3xl" fontWeight="bold" color="#fbbf24" fontFamily="serif" py={2}>{data.studentName}</Text>
      {data.studentNameEn && <Text fontSize="md" color="#9ca3af" mt={-2}>{data.studentNameEn}</Text>}
      <Text fontSize="md" color="#9ca3af" mt={4}>تقديراً لإتمامه بنجاح متطلبات</Text>
      <Box bg="rgba(251, 191, 36, 0.1)" px={8} py={3} borderRadius="lg" border="1px solid" borderColor="rgba(251, 191, 36, 0.2)">
        <Text fontSize="xl" fontWeight="bold" color="#fbbf24" textAlign="center">{data.courseName}</Text>
      </Box>
      <HStack gap={16} mt={4}>
        {data.score && <VStack gap={0}><Text fontSize="3xl" fontWeight="bold" color="#fbbf24">{data.score}%</Text><Text fontSize="xs" color="#6b7280">الدرجة</Text></VStack>}
        {data.grade && <VStack gap={0}><Text fontSize="2xl" fontWeight="bold" color="#fbbf24">{data.grade}</Text><Text fontSize="xs" color="#6b7280">التقدير</Text></VStack>}
      </HStack>
      <HStack gap={20} mt={6}>
        <VStack gap={1}><Text fontSize="sm" color="#9ca3af">{new Date(data.completionDate).toLocaleDateString("ar-SA")}</Text><Text fontSize="xs" color="#6b7280">تاريخ الإصدار</Text></VStack>
        <VStack gap={1}><Box w="80px" borderBottom="1px solid" borderColor="#fbbf24" opacity={0.4} /><Text fontSize="xs" color="#6b7280">{data.instructorName || "التوقيع"}</Text></VStack>
      </HStack>
      <Text fontSize="xs" color="#4b5563" mt={4}>{data.certificateNumber}</Text>
    </VStack>
  </Box>
));
Template3.displayName = "Template3";

// Template 4: Professional Blue
const Template4 = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => (
  <Box ref={ref} w="1056px" h="816px" bg="white" position="relative" overflow="hidden">
    <Box position="absolute" top={0} left={0} right={0} h="160px" bg="linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)" />
    <VStack h="full" justify="start" gap={0} px={16}>
      <Flex w="full" h="160px" align="center" justify="space-between" color="white" px={8}>
        <VStack align="start" gap={0}><Text fontSize="3xl" fontWeight="bold">تِبيان</Text><Text fontSize="xs" opacity={0.8}>Tibyan Islamic Academy</Text></VStack>
        <VStack align="end" gap={0}><Text fontSize="lg" fontWeight="semibold">شهادة إتمام</Text><Text fontSize="xs" opacity={0.8}>Certificate of Completion</Text></VStack>
      </Flex>
      <VStack flex={1} justify="center" gap={5} py={6}>
        <Text fontSize="md" color="#6b7280">بناءً على إتمام متطلبات الدورة بنجاح، تشهد أكاديمية تِبيان أن</Text>
        <Box bg="#f9fafb" px={16} py={5} borderRadius="lg" border="1px solid" borderColor="#e5e7eb">
          <Text fontSize="3xl" fontWeight="bold" color="#1e3a8a" textAlign="center">{data.studentName}</Text>
          {data.studentNameEn && <Text fontSize="md" color="#6b7280" textAlign="center" mt={1}>{data.studentNameEn}</Text>}
        </Box>
        <Text fontSize="md" color="#6b7280">قد أكمل بنجاح جميع متطلبات</Text>
        <Text fontSize="2xl" fontWeight="bold" color="#1e40af">{data.courseName}</Text>
        <HStack gap={0} mt={2} bg="#f9fafb" borderRadius="lg" overflow="hidden" border="1px solid" borderColor="#e5e7eb">
          <Box px={6} py={3} borderLeft="1px solid" borderColor="#e5e7eb"><Text fontSize="xs" color="#9ca3af" textAlign="center">التاريخ</Text><Text fontSize="sm" fontWeight="bold" color="#374151" textAlign="center">{new Date(data.completionDate).toLocaleDateString("ar-SA")}</Text></Box>
          {data.courseDuration && <Box px={6} py={3} borderLeft="1px solid" borderColor="#e5e7eb"><Text fontSize="xs" color="#9ca3af" textAlign="center">المدة</Text><Text fontSize="sm" fontWeight="bold" color="#374151" textAlign="center">{data.courseDuration}</Text></Box>}
          {data.score && <Box px={6} py={3} borderLeft="1px solid" borderColor="#e5e7eb"><Text fontSize="xs" color="#9ca3af" textAlign="center">الدرجة</Text><Text fontSize="sm" fontWeight="bold" color="#2563eb" textAlign="center">{data.score}%</Text></Box>}
          {data.grade && <Box px={6} py={3}><Text fontSize="xs" color="#9ca3af" textAlign="center">التقدير</Text><Text fontSize="sm" fontWeight="bold" color="#2563eb" textAlign="center">{data.grade}</Text></Box>}
        </HStack>
      </VStack>
      <Flex w="full" justify="space-between" align="end" py={6} borderTop="1px solid" borderColor="#e5e7eb">
        <VStack align="start" gap={1}><Box w="130px" borderBottom="2px solid" borderColor="#1e3a5f" mb={1} /><Text fontSize="sm" fontWeight="medium" color="#374151">{data.instructorName || "المدرب المعتمد"}</Text></VStack>
        <VStack gap={1}><Text fontSize="xs" color="#9ca3af">رقم الشهادة</Text><Text fontSize="xs" fontFamily="mono" color="#6b7280" bg="#f3f4f6" px={3} py={1} borderRadius="md">{data.certificateNumber}</Text></VStack>
        <VStack align="end" gap={1}><Box w="130px" borderBottom="2px solid" borderColor="#1e3a5f" mb={1} /><Text fontSize="sm" fontWeight="medium" color="#374151">إدارة الأكاديمية</Text></VStack>
      </Flex>
    </VStack>
  </Box>
));
Template4.displayName = "Template4";

// Template 5: Royal Purple
const Template5 = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => (
  <Box ref={ref} w="1056px" h="816px" bg="linear-gradient(135deg, #581c87 0%, #7c3aed 50%, #a855f7 100%)" position="relative" overflow="hidden">
    <Box position="absolute" inset="20px" bg="rgba(255,255,255,0.95)" borderRadius="xl" />
    <Box position="absolute" top="20px" left="20px" w="60px" h="60px" bg="linear-gradient(135deg, #7c3aed, #a855f7)" borderRadius="full" />
    <Box position="absolute" bottom="20px" right="20px" w="80px" h="80px" bg="linear-gradient(135deg, #7c3aed, #a855f7)" borderRadius="full" opacity={0.5} />
    <VStack h="full" justify="center" gap={4} px={24} py={16} position="relative">
      <HStack gap={2} align="center"><Box w="40px" h="1px" bg="#7c3aed" /><Text fontSize="xs" color="#7c3aed" letterSpacing="0.3em" fontWeight="bold">TIBYAN ACADEMY</Text><Box w="40px" h="1px" bg="#7c3aed" /></HStack>
      <Text fontSize="4xl" fontWeight="bold" color="#581c87" fontFamily="serif">شهادة تقدير وإتمام</Text>
      <Text fontSize="md" color="#6b7280" mt={4}>تُقدم هذه الشهادة إلى</Text>
      <Box position="relative" py={4}>
        <Box position="absolute" bottom={0} left="50%" transform="translateX(-50%)" w="80%" h="3px" bg="linear-gradient(90deg, transparent, #7c3aed, transparent)" />
        <Text fontSize="3xl" fontWeight="bold" color="#581c87">{data.studentName}</Text>
      </Box>
      {data.studentNameEn && <Text fontSize="md" color="#9ca3af">{data.studentNameEn}</Text>}
      <Text fontSize="md" color="#6b7280" mt={4}>تقديراً لإتمامه بامتياز</Text>
      <Box bg="linear-gradient(135deg, #f3e8ff, #faf5ff)" px={10} py={4} borderRadius="xl" border="2px solid" borderColor="#e9d5ff">
        <Text fontSize="xl" fontWeight="bold" color="#7c3aed" textAlign="center">{data.courseName}</Text>
      </Box>
      <HStack gap={12} mt={4}>
        {data.score && <Box textAlign="center" bg="#faf5ff" px={6} py={3} borderRadius="lg"><Text fontSize="2xl" fontWeight="bold" color="#7c3aed">{data.score}%</Text><Text fontSize="xs" color="#9ca3af">الدرجة</Text></Box>}
        {data.grade && <Box textAlign="center" bg="#faf5ff" px={6} py={3} borderRadius="lg"><Text fontSize="xl" fontWeight="bold" color="#7c3aed">{data.grade}</Text><Text fontSize="xs" color="#9ca3af">التقدير</Text></Box>}
      </HStack>
      <HStack gap={24} mt={6}>
        <VStack gap={1}><Box w="100px" borderBottom="2px solid" borderColor="#7c3aed" /><Text fontSize="xs" color="#6b7280">{data.instructorName || "المدرب"}</Text></VStack>
        <VStack gap={0}><Text fontSize="sm" color="#6b7280">{new Date(data.completionDate).toLocaleDateString("ar-SA")}</Text><Text fontSize="xs" color="#9ca3af">التاريخ</Text></VStack>
        <VStack gap={1}><Box w="100px" borderBottom="2px solid" borderColor="#7c3aed" /><Text fontSize="xs" color="#6b7280">الإدارة</Text></VStack>
      </HStack>
      <Text fontSize="xs" color="#c4b5fd" mt={4}>{data.certificateNumber}</Text>
    </VStack>
  </Box>
));
Template5.displayName = "Template5";

// Template 6: Ocean Blue Wave
const Template6 = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => (
  <Box ref={ref} w="1056px" h="816px" bg="#f0f9ff" position="relative" overflow="hidden">
    <svg style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "200px" }} viewBox="0 0 1056 200" preserveAspectRatio="none">
      <path d="M0,100 C200,150 400,50 528,100 C656,150 856,50 1056,100 L1056,200 L0,200 Z" fill="#0ea5e9" opacity="0.1" />
      <path d="M0,120 C200,170 400,70 528,120 C656,170 856,70 1056,120 L1056,200 L0,200 Z" fill="#0284c7" opacity="0.1" />
    </svg>
    <Box position="absolute" top={0} left={0} right={0} h="8px" bg="linear-gradient(90deg, #0284c7, #0ea5e9, #38bdf8)" />
    <VStack h="full" justify="center" gap={4} px={20} py={12}>
      <Flex align="center" gap={3}><Box w="50px" h="50px" borderRadius="full" bg="linear-gradient(135deg, #0284c7, #0ea5e9)" display="flex" alignItems="center" justifyContent="center"><Text color="white" fontSize="xl" fontWeight="bold">ت</Text></Box><VStack align="start" gap={0}><Text fontSize="xl" fontWeight="bold" color="#0c4a6e">تِبيان</Text><Text fontSize="xs" color="#64748b">للتعليم الإسلامي</Text></VStack></Flex>
      <Text fontSize="3xl" fontWeight="bold" color="#0c4a6e" mt={4}>شهادة إتمام دورة</Text>
      <Box w="200px" h="3px" bg="linear-gradient(90deg, transparent, #0ea5e9, transparent)" borderRadius="full" />
      <Text fontSize="md" color="#64748b" mt={4}>نشهد بأن الطالب/ة</Text>
      <Text fontSize="3xl" fontWeight="bold" color="#0369a1" py={2}>{data.studentName}</Text>
      {data.studentNameEn && <Text fontSize="md" color="#94a3b8">{data.studentNameEn}</Text>}
      <Text fontSize="md" color="#64748b" mt={2}>قد أتم/ت بنجاح دورة</Text>
      <Box bg="white" px={10} py={4} borderRadius="2xl" boxShadow="lg" border="1px solid" borderColor="#e0f2fe">
        <Text fontSize="xl" fontWeight="bold" color="#0284c7" textAlign="center">{data.courseName}</Text>
      </Box>
      <HStack gap={8} mt={4}>
        {data.score && <Box bg="white" px={5} py={3} borderRadius="xl" boxShadow="md"><Text fontSize="2xl" fontWeight="bold" color="#0ea5e9">{data.score}%</Text><Text fontSize="xs" color="#64748b" textAlign="center">الدرجة</Text></Box>}
        {data.grade && <Box bg="white" px={5} py={3} borderRadius="xl" boxShadow="md"><Text fontSize="xl" fontWeight="bold" color="#0ea5e9">{data.grade}</Text><Text fontSize="xs" color="#64748b" textAlign="center">التقدير</Text></Box>}
        <Box bg="white" px={5} py={3} borderRadius="xl" boxShadow="md"><Text fontSize="md" fontWeight="medium" color="#0369a1">{new Date(data.completionDate).toLocaleDateString("ar-SA")}</Text><Text fontSize="xs" color="#64748b" textAlign="center">التاريخ</Text></Box>
      </HStack>
      <HStack gap={20} mt={6}>
        <VStack gap={1}><Box w="100px" borderBottom="2px solid" borderColor="#0ea5e9" /><Text fontSize="xs" color="#64748b">{data.instructorName || "المدرب"}</Text></VStack>
        <VStack gap={1}><Box w="100px" borderBottom="2px solid" borderColor="#0ea5e9" /><Text fontSize="xs" color="#64748b">الإدارة</Text></VStack>
      </HStack>
      <Text fontSize="xs" color="#94a3b8" mt={4}>{data.certificateNumber}</Text>
    </VStack>
  </Box>
));
Template6.displayName = "Template6";

// Template 7: Emerald Luxury
const Template7 = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => (
  <Box ref={ref} w="1056px" h="816px" bg="#022c22" position="relative" overflow="hidden">
    <Box position="absolute" inset="30px" border="1px solid" borderColor="#10b981" opacity={0.3} />
    <Box position="absolute" inset="40px" border="1px solid" borderColor="#34d399" opacity={0.2} />
    <VStack h="full" justify="center" gap={4} px={20} py={12}>
      <Text fontSize="xs" color="#34d399" letterSpacing="0.5em">TIBYAN ACADEMY</Text>
      <Text fontSize="4xl" fontWeight="bold" color="#ecfdf5" fontFamily="serif">شهادة إنجاز</Text>
      <Box w="150px" h="1px" bg="linear-gradient(90deg, transparent, #10b981, transparent)" />
      <Text fontSize="md" color="#6ee7b7" mt={6}>هذه الشهادة تُمنح إلى</Text>
      <Text fontSize="3xl" fontWeight="bold" color="#34d399" py={2}>{data.studentName}</Text>
      {data.studentNameEn && <Text fontSize="md" color="#6ee7b7" opacity={0.7}>{data.studentNameEn}</Text>}
      <Text fontSize="md" color="#6ee7b7" mt={4}>لإتمامه بتفوق</Text>
      <Box border="1px solid" borderColor="#10b981" px={10} py={4} borderRadius="md" bg="rgba(16, 185, 129, 0.1)">
        <Text fontSize="xl" fontWeight="bold" color="#34d399" textAlign="center">{data.courseName}</Text>
      </Box>
      <HStack gap={12} mt={6}>
        {data.score && <VStack gap={0} bg="rgba(16, 185, 129, 0.1)" px={6} py={3} borderRadius="lg"><Text fontSize="2xl" fontWeight="bold" color="#10b981">{data.score}%</Text><Text fontSize="xs" color="#6ee7b7">الدرجة</Text></VStack>}
        {data.grade && <VStack gap={0} bg="rgba(16, 185, 129, 0.1)" px={6} py={3} borderRadius="lg"><Text fontSize="xl" fontWeight="bold" color="#10b981">{data.grade}</Text><Text fontSize="xs" color="#6ee7b7">التقدير</Text></VStack>}
      </HStack>
      <HStack gap={24} mt={6}>
        <VStack gap={1}><Text fontSize="sm" color="#6ee7b7">{new Date(data.completionDate).toLocaleDateString("ar-SA")}</Text><Text fontSize="xs" color="#34d399" opacity={0.7}>التاريخ</Text></VStack>
        <VStack gap={1}><Box w="100px" borderBottom="1px solid" borderColor="#10b981" /><Text fontSize="xs" color="#34d399" opacity={0.7}>{data.instructorName || "التوقيع"}</Text></VStack>
      </HStack>
      <Text fontSize="xs" color="#065f46" mt={6}>{data.certificateNumber}</Text>
    </VStack>
  </Box>
));
Template7.displayName = "Template7";

// Template 8: Sunset Orange
const Template8 = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => (
  <Box ref={ref} w="1056px" h="816px" bg="linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)" position="relative" overflow="hidden">
    <Box position="absolute" top={0} right={0} w="400px" h="400px" bg="linear-gradient(135deg, #fb923c, #f97316)" borderRadius="full" opacity={0.1} transform="translate(100px, -100px)" />
    <Box position="absolute" bottom={0} left={0} w="300px" h="300px" bg="linear-gradient(135deg, #fdba74, #fb923c)" borderRadius="full" opacity={0.1} transform="translate(-100px, 100px)" />
    <Box position="absolute" top="20px" left="20px" right="20px" h="6px" bg="linear-gradient(90deg, #ea580c, #f97316, #fb923c, #fdba74)" borderRadius="full" />
    <VStack h="full" justify="center" gap={4} px={20} py={12}>
      <HStack gap={3}><Text fontSize="2xl" fontWeight="bold" color="#c2410c">تِبيان</Text><Box w="2px" h="30px" bg="#f97316" /><Text fontSize="sm" color="#9a3412">أكاديمية التعليم الإسلامي</Text></HStack>
      <Text fontSize="4xl" fontWeight="bold" color="#7c2d12" fontFamily="serif" mt={4}>شهادة إتمام</Text>
      <Box w="250px" h="2px" bg="linear-gradient(90deg, transparent, #f97316, transparent)" />
      <Text fontSize="md" color="#9a3412" mt={6}>تُقدم هذه الشهادة إلى</Text>
      <Box bg="white" px={12} py={4} borderRadius="2xl" boxShadow="xl" border="2px solid" borderColor="#fed7aa">
        <Text fontSize="3xl" fontWeight="bold" color="#c2410c" textAlign="center">{data.studentName}</Text>
        {data.studentNameEn && <Text fontSize="md" color="#fb923c" textAlign="center" mt={1}>{data.studentNameEn}</Text>}
      </Box>
      <Text fontSize="md" color="#9a3412" mt={4}>لإتمامه بنجاح دورة</Text>
      <Text fontSize="xl" fontWeight="bold" color="#ea580c">{data.courseName}</Text>
      <HStack gap={6} mt={4}>
        {data.score && <Box bg="white" px={6} py={3} borderRadius="xl" boxShadow="lg" border="1px solid" borderColor="#fdba74"><Text fontSize="2xl" fontWeight="bold" color="#f97316">{data.score}%</Text><Text fontSize="xs" color="#9a3412" textAlign="center">الدرجة</Text></Box>}
        {data.grade && <Box bg="white" px={6} py={3} borderRadius="xl" boxShadow="lg" border="1px solid" borderColor="#fdba74"><Text fontSize="xl" fontWeight="bold" color="#f97316">{data.grade}</Text><Text fontSize="xs" color="#9a3412" textAlign="center">التقدير</Text></Box>}
        <Box bg="white" px={6} py={3} borderRadius="xl" boxShadow="lg" border="1px solid" borderColor="#fdba74"><Text fontSize="md" color="#c2410c">{new Date(data.completionDate).toLocaleDateString("ar-SA")}</Text><Text fontSize="xs" color="#9a3412" textAlign="center">التاريخ</Text></Box>
      </HStack>
      <HStack gap={24} mt={8}>
        <VStack gap={1}><Box w="120px" borderBottom="2px solid" borderColor="#f97316" /><Text fontSize="xs" color="#9a3412">{data.instructorName || "المدرب"}</Text></VStack>
        <VStack gap={1}><Box w="120px" borderBottom="2px solid" borderColor="#f97316" /><Text fontSize="xs" color="#9a3412">الإدارة</Text></VStack>
      </HStack>
      <Text fontSize="xs" color="#fdba74" mt={4}>{data.certificateNumber}</Text>
    </VStack>
  </Box>
));
Template8.displayName = "Template8";

// Template 9: Rose Gold
const Template9 = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => (
  <Box ref={ref} w="1056px" h="816px" bg="linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)" position="relative" overflow="hidden">
    <Box position="absolute" inset="25px" border="2px solid" borderColor="#f9a8d4" borderRadius="3xl" />
    <Box position="absolute" top="25px" left="50%" transform="translateX(-50%)" bg="linear-gradient(135deg, #ec4899, #f472b6)" px={8} py={2} borderRadius="full" borderTopRadius={0}><Text fontSize="xs" color="white" fontWeight="bold">شهادة معتمدة</Text></Box>
    <VStack h="full" justify="center" gap={4} px={20} py={16}>
      <Text fontSize="xl" fontWeight="bold" color="#be185d">أكاديمية تِبيان</Text>
      <Text fontSize="4xl" fontWeight="bold" color="#9d174d" fontFamily="serif" mt={2}>شهادة تقدير</Text>
      <Box w="200px" h="2px" bg="linear-gradient(90deg, transparent, #f472b6, transparent)" />
      <Text fontSize="md" color="#9d174d" mt={6}>تُمنح هذه الشهادة إلى</Text>
      <Text fontSize="3xl" fontWeight="bold" color="#be185d" py={2}>{data.studentName}</Text>
      {data.studentNameEn && <Text fontSize="md" color="#f472b6">{data.studentNameEn}</Text>}
      <Text fontSize="md" color="#9d174d" mt={4}>لإتمامها بامتياز دورة</Text>
      <Box bg="white" px={10} py={4} borderRadius="2xl" boxShadow="lg" border="2px solid" borderColor="#fbcfe8">
        <Text fontSize="xl" fontWeight="bold" color="#db2777" textAlign="center">{data.courseName}</Text>
      </Box>
      <HStack gap={8} mt={4}>
        {data.score && <VStack gap={0} bg="white" px={6} py={3} borderRadius="xl" boxShadow="md"><Text fontSize="2xl" fontWeight="bold" color="#ec4899">{data.score}%</Text><Text fontSize="xs" color="#9d174d">الدرجة</Text></VStack>}
        {data.grade && <VStack gap={0} bg="white" px={6} py={3} borderRadius="xl" boxShadow="md"><Text fontSize="xl" fontWeight="bold" color="#ec4899">{data.grade}</Text><Text fontSize="xs" color="#9d174d">التقدير</Text></VStack>}
      </HStack>
      <HStack gap={20} mt={6}>
        <VStack gap={1}><Text fontSize="sm" color="#be185d">{new Date(data.completionDate).toLocaleDateString("ar-SA")}</Text><Text fontSize="xs" color="#f472b6">التاريخ</Text></VStack>
        <VStack gap={1}><Box w="100px" borderBottom="2px solid" borderColor="#f472b6" /><Text fontSize="xs" color="#f472b6">{data.instructorName || "التوقيع"}</Text></VStack>
      </HStack>
      <Text fontSize="xs" color="#f9a8d4" mt={4}>{data.certificateNumber}</Text>
    </VStack>
  </Box>
));
Template9.displayName = "Template9";

// Template 10: Midnight Dark
const Template10 = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => (
  <Box ref={ref} w="1056px" h="816px" bg="#0a0a0a" position="relative" overflow="hidden">
    <Box position="absolute" inset={0} bg="radial-gradient(circle at 30% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)" />
    <Box position="absolute" inset={0} bg="radial-gradient(circle at 70% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)" />
    <Box position="absolute" inset="20px" border="1px solid" borderColor="#27272a" borderRadius="lg" />
    <VStack h="full" justify="center" gap={4} px={20} py={12}>
      <HStack gap={2}><Box w="8px" h="8px" bg="#3b82f6" borderRadius="full" /><Text fontSize="sm" color="#71717a" letterSpacing="0.3em">TIBYAN</Text><Box w="8px" h="8px" bg="#a855f7" borderRadius="full" /></HStack>
      <Text fontSize="4xl" fontWeight="bold" color="white" mt={4}>شهادة إتمام</Text>
      <Box w="300px" h="1px" bg="linear-gradient(90deg, #3b82f6, #a855f7)" />
      <Text fontSize="md" color="#71717a" mt={6}>تم منح هذه الشهادة إلى</Text>
      <Text fontSize="3xl" fontWeight="bold" py={2} css={{ backgroundImage: "linear-gradient(to right, #3b82f6, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{data.studentName}</Text>
      {data.studentNameEn && <Text fontSize="md" color="#52525b">{data.studentNameEn}</Text>}
      <Text fontSize="md" color="#71717a" mt={4}>لإتمامه بنجاح</Text>
      <Box bg="#18181b" px={10} py={4} borderRadius="lg" border="1px solid" borderColor="#27272a">
        <Text fontSize="xl" fontWeight="bold" color="#e4e4e7" textAlign="center">{data.courseName}</Text>
      </Box>
      <HStack gap={8} mt={6}>
        {data.score && <Box bg="#18181b" px={6} py={3} borderRadius="lg" border="1px solid" borderColor="#27272a"><Text fontSize="2xl" fontWeight="bold" color="#3b82f6">{data.score}%</Text><Text fontSize="xs" color="#71717a" textAlign="center">الدرجة</Text></Box>}
        {data.grade && <Box bg="#18181b" px={6} py={3} borderRadius="lg" border="1px solid" borderColor="#27272a"><Text fontSize="xl" fontWeight="bold" color="#a855f7">{data.grade}</Text><Text fontSize="xs" color="#71717a" textAlign="center">التقدير</Text></Box>}
        <Box bg="#18181b" px={6} py={3} borderRadius="lg" border="1px solid" borderColor="#27272a"><Text fontSize="md" color="#e4e4e7">{new Date(data.completionDate).toLocaleDateString("ar-SA")}</Text><Text fontSize="xs" color="#71717a" textAlign="center">التاريخ</Text></Box>
      </HStack>
      <HStack gap={20} mt={8}>
        <VStack gap={1}><Box w="100px" borderBottom="1px solid" borderColor="#3b82f6" /><Text fontSize="xs" color="#52525b">{data.instructorName || "المدرب"}</Text></VStack>
        <VStack gap={1}><Box w="100px" borderBottom="1px solid" borderColor="#a855f7" /><Text fontSize="xs" color="#52525b">الإدارة</Text></VStack>
      </HStack>
      <Text fontSize="xs" color="#3f3f46" mt={6}>{data.certificateNumber}</Text>
    </VStack>
  </Box>
));
Template10.displayName = "Template10";

// Template 11: Geometric Modern
const Template11 = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => (
  <Box ref={ref} w="1056px" h="816px" bg="white" position="relative" overflow="hidden">
    <Box position="absolute" top="-50px" left="-50px" w="200px" h="200px" bg="#fbbf24" transform="rotate(45deg)" opacity={0.1} />
    <Box position="absolute" top="100px" right="-30px" w="150px" h="150px" bg="#f59e0b" transform="rotate(30deg)" opacity={0.1} />
    <Box position="absolute" bottom="-30px" left="200px" w="180px" h="180px" bg="#d97706" transform="rotate(60deg)" opacity={0.1} />
    <VStack h="full" justify="center" gap={4} px={20} py={12} position="relative">
      <Flex align="center" gap={4}><Box w="50px" h="3px" bg="#f59e0b" /><Text fontSize="sm" color="#92400e" fontWeight="bold" letterSpacing="0.2em">أكاديمية تِبيان</Text><Box w="50px" h="3px" bg="#f59e0b" /></Flex>
      <Text fontSize="4xl" fontWeight="black" color="#78350f">شهادة إتمام</Text>
      <Text fontSize="md" color="#92400e" mt={6}>تشهد الأكاديمية أن</Text>
      <Box position="relative" py={4} px={8}><Box position="absolute" inset={0} border="3px solid" borderColor="#fbbf24" transform="rotate(2deg)" /><Box position="absolute" inset={0} border="3px solid" borderColor="#f59e0b" transform="rotate(-2deg)" /><Text fontSize="3xl" fontWeight="bold" color="#78350f" position="relative">{data.studentName}</Text></Box>
      {data.studentNameEn && <Text fontSize="md" color="#b45309">{data.studentNameEn}</Text>}
      <Text fontSize="md" color="#92400e" mt={4}>قد أتم بنجاح</Text>
      <Box bg="#fef3c7" px={10} py={4} transform="skewX(-3deg)"><Text fontSize="xl" fontWeight="bold" color="#92400e" transform="skewX(3deg)">{data.courseName}</Text></Box>
      <HStack gap={8} mt={6}>
        {data.score && <Box transform="rotate(-3deg)" bg="#fef3c7" px={6} py={3}><Text fontSize="2xl" fontWeight="bold" color="#d97706">{data.score}%</Text><Text fontSize="xs" color="#92400e" textAlign="center">الدرجة</Text></Box>}
        {data.grade && <Box transform="rotate(3deg)" bg="#fef3c7" px={6} py={3}><Text fontSize="xl" fontWeight="bold" color="#d97706">{data.grade}</Text><Text fontSize="xs" color="#92400e" textAlign="center">التقدير</Text></Box>}
      </HStack>
      <HStack gap={20} mt={6}><VStack gap={1}><Box w="100px" h="3px" bg="#f59e0b" /><Text fontSize="xs" color="#92400e">{data.instructorName || "المدرب"}</Text></VStack><VStack gap={0}><Text fontSize="sm" color="#78350f">{new Date(data.completionDate).toLocaleDateString("ar-SA")}</Text><Text fontSize="xs" color="#b45309">التاريخ</Text></VStack><VStack gap={1}><Box w="100px" h="3px" bg="#f59e0b" /><Text fontSize="xs" color="#92400e">الإدارة</Text></VStack></HStack>
      <Text fontSize="xs" color="#d97706" mt={4}>{data.certificateNumber}</Text>
    </VStack>
  </Box>
));
Template11.displayName = "Template11";

// Template 12: Arabic Calligraphy
const Template12 = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => (
  <Box ref={ref} w="1056px" h="816px" bg="linear-gradient(180deg, #fefce8 0%, #fef9c3 100%)" position="relative" overflow="hidden">
    <Box position="absolute" inset="30px" border="3px double" borderColor="#854d0e" />
    <Box position="absolute" inset="40px" border="1px solid" borderColor="#a16207" opacity={0.3} />
    <VStack h="full" justify="center" gap={3} px={24} py={16}>
      <Text fontSize="xl" color="#854d0e" fontWeight="bold" fontFamily="serif">۞ بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ۞</Text>
      <Text fontSize="md" color="#a16207" mt={2}>أكاديمية تِبيان للتعليم الإسلامي</Text>
      <Text fontSize="5xl" fontWeight="bold" color="#713f12" fontFamily="serif" mt={4}>شَهَادَةُ إِتْمَام</Text>
      <Box w="300px" h="3px" bg="linear-gradient(90deg, transparent, #854d0e, transparent)" />
      <Text fontSize="lg" color="#92400e" mt={6}>تُشهد أكاديمية تِبيان للتعليم الإسلامي أنَّ</Text>
      <Text fontSize="4xl" fontWeight="bold" color="#78350f" fontFamily="serif" py={4}>{data.studentName}</Text>
      {data.studentNameEn && <Text fontSize="lg" color="#a16207">{data.studentNameEn}</Text>}
      <Text fontSize="lg" color="#92400e" mt={4}>قد أَتَمَّ بِنَجَاحٍ وَتَفَوُّق مُتَطَلَّبَات</Text>
      <Box bg="rgba(133, 77, 14, 0.1)" px={12} py={4} borderRadius="md" border="2px solid" borderColor="#a16207"><Text fontSize="2xl" fontWeight="bold" color="#854d0e" textAlign="center">{data.courseName}</Text></Box>
      <HStack gap={12} mt={6}>{data.score && <VStack gap={0}><Text fontSize="2xl" fontWeight="bold" color="#854d0e">{data.score}%</Text><Text fontSize="xs" color="#92400e">الدَّرَجَة</Text></VStack>}{data.grade && <VStack gap={0}><Text fontSize="xl" fontWeight="bold" color="#854d0e">{data.grade}</Text><Text fontSize="xs" color="#92400e">التَّقْدِير</Text></VStack>}</HStack>
      <HStack gap={24} mt={6}><VStack gap={1}><Box w="120px" borderBottom="2px solid" borderColor="#854d0e" /><Text fontSize="xs" color="#92400e">{data.instructorName || "المُدَرِّب"}</Text></VStack><VStack gap={0}><Text fontSize="md" color="#78350f">{new Date(data.completionDate).toLocaleDateString("ar-SA")}</Text><Text fontSize="xs" color="#92400e">تَارِيخ الإِصْدَار</Text></VStack><VStack gap={1}><Box w="120px" borderBottom="2px solid" borderColor="#854d0e" /><Text fontSize="xs" color="#92400e">الإِدَارَة</Text></VStack></HStack>
      <Text fontSize="xs" color="#a16207" mt={4}>{data.certificateNumber}</Text>
    </VStack>
  </Box>
));
Template12.displayName = "Template12";

// Template 13: Marble Luxury
const Template13 = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => (
  <Box ref={ref} w="1056px" h="816px" bg="linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 25%, #f5f5f5 50%, #d4d4d4 75%, #f5f5f5 100%)" position="relative" overflow="hidden">
    <Box position="absolute" inset="25px" border="4px solid" borderColor="#a3a3a3" />
    <Box position="absolute" inset="35px" border="2px solid" borderColor="#737373" />
    <VStack h="full" justify="center" gap={4} px={24} py={16}>
      <Text fontSize="xs" color="#525252" letterSpacing="0.5em">TIBYAN ISLAMIC ACADEMY</Text>
      <Text fontSize="4xl" fontWeight="bold" color="#171717" fontFamily="serif">شهادة إنجاز</Text>
      <HStack gap={4}><Box w="100px" h="1px" bg="#737373" /><Text color="#525252">❖</Text><Box w="100px" h="1px" bg="#737373" /></HStack>
      <Text fontSize="md" color="#525252" mt={6}>تُمنح هذه الشهادة إلى</Text>
      <Text fontSize="3xl" fontWeight="bold" color="#171717" py={2}>{data.studentName}</Text>
      {data.studentNameEn && <Text fontSize="md" color="#737373">{data.studentNameEn}</Text>}
      <Text fontSize="md" color="#525252" mt={4}>لإتمامه بامتياز</Text>
      <Box bg="rgba(23, 23, 23, 0.05)" px={12} py={4} borderRadius="sm" border="1px solid" borderColor="#a3a3a3"><Text fontSize="xl" fontWeight="bold" color="#262626" textAlign="center">{data.courseName}</Text></Box>
      <HStack gap={12} mt={6}>{data.score && <VStack gap={0}><Text fontSize="2xl" fontWeight="bold" color="#171717">{data.score}%</Text><Text fontSize="xs" color="#737373">الدرجة</Text></VStack>}{data.grade && <VStack gap={0}><Text fontSize="xl" fontWeight="bold" color="#171717">{data.grade}</Text><Text fontSize="xs" color="#737373">التقدير</Text></VStack>}</HStack>
      <HStack gap={24} mt={8}><VStack gap={1}><Box w="120px" borderBottom="2px solid" borderColor="#525252" /><Text fontSize="xs" color="#525252">{data.instructorName || "المدرب"}</Text></VStack><VStack gap={0}><Text fontSize="sm" color="#262626">{new Date(data.completionDate).toLocaleDateString("ar-SA")}</Text><Text fontSize="xs" color="#737373">التاريخ</Text></VStack><VStack gap={1}><Box w="120px" borderBottom="2px solid" borderColor="#525252" /><Text fontSize="xs" color="#525252">الإدارة</Text></VStack></HStack>
      <Text fontSize="xs" color="#a3a3a3" mt={4}>{data.certificateNumber}</Text>
    </VStack>
  </Box>
));
Template13.displayName = "Template13";

// Template 14: Nature Green Leaf
const Template14 = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => (
  <Box ref={ref} w="1056px" h="816px" bg="linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" position="relative" overflow="hidden">
    <Box position="absolute" top="20px" left="20px" w="150px" h="150px" opacity={0.2}><svg viewBox="0 0 100 100"><path d="M10,90 Q10,50 30,30 Q50,10 90,10 Q70,30 60,50 Q50,70 30,80 Q20,85 10,90 Z" fill="#16a34a" /></svg></Box>
    <Box position="absolute" bottom="20px" right="20px" w="150px" h="150px" opacity={0.2} transform="rotate(180deg)"><svg viewBox="0 0 100 100"><path d="M10,90 Q10,50 30,30 Q50,10 90,10 Q70,30 60,50 Q50,70 30,80 Q20,85 10,90 Z" fill="#16a34a" /></svg></Box>
    <Box position="absolute" inset="30px" border="2px solid" borderColor="#86efac" borderRadius="2xl" />
    <VStack h="full" justify="center" gap={4} px={20} py={12}>
      <HStack gap={2}><Text fontSize="xl" fontWeight="bold" color="#166534">🌿 أكاديمية تِبيان</Text></HStack>
      <Text fontSize="4xl" fontWeight="bold" color="#14532d" mt={4}>شهادة إتمام</Text>
      <Box w="200px" h="2px" bg="linear-gradient(90deg, transparent, #22c55e, transparent)" />
      <Text fontSize="md" color="#166534" mt={6}>هذه الشهادة تُقدم إلى</Text>
      <Box bg="white" px={12} py={4} borderRadius="2xl" boxShadow="lg" border="2px solid" borderColor="#bbf7d0"><Text fontSize="3xl" fontWeight="bold" color="#15803d" textAlign="center">{data.studentName}</Text>{data.studentNameEn && <Text fontSize="md" color="#22c55e" textAlign="center" mt={1}>{data.studentNameEn}</Text>}</Box>
      <Text fontSize="md" color="#166534" mt={4}>لإتمامه بنجاح</Text>
      <Text fontSize="xl" fontWeight="bold" color="#16a34a">{data.courseName}</Text>
      <HStack gap={6} mt={4}>{data.score && <Box bg="white" px={6} py={3} borderRadius="xl" boxShadow="md" border="1px solid" borderColor="#bbf7d0"><Text fontSize="2xl" fontWeight="bold" color="#22c55e">{data.score}%</Text><Text fontSize="xs" color="#166534" textAlign="center">الدرجة</Text></Box>}{data.grade && <Box bg="white" px={6} py={3} borderRadius="xl" boxShadow="md" border="1px solid" borderColor="#bbf7d0"><Text fontSize="xl" fontWeight="bold" color="#22c55e">{data.grade}</Text><Text fontSize="xs" color="#166534" textAlign="center">التقدير</Text></Box>}<Box bg="white" px={6} py={3} borderRadius="xl" boxShadow="md" border="1px solid" borderColor="#bbf7d0"><Text fontSize="md" color="#15803d">{new Date(data.completionDate).toLocaleDateString("ar-SA")}</Text><Text fontSize="xs" color="#166534" textAlign="center">التاريخ</Text></Box></HStack>
      <HStack gap={24} mt={6}><VStack gap={1}><Box w="100px" borderBottom="2px solid" borderColor="#22c55e" /><Text fontSize="xs" color="#166534">{data.instructorName || "المدرب"}</Text></VStack><VStack gap={1}><Box w="100px" borderBottom="2px solid" borderColor="#22c55e" /><Text fontSize="xs" color="#166534">الإدارة</Text></VStack></HStack>
      <Text fontSize="xs" color="#86efac" mt={4}>{data.certificateNumber}</Text>
    </VStack>
  </Box>
));
Template14.displayName = "Template14";

// Template 15: Academic Traditional
const Template15 = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => (
  <Box ref={ref} w="1056px" h="816px" bg="#fffbeb" position="relative" overflow="hidden">
    <Box position="absolute" inset="20px" border="4px double" borderColor="#92400e" />
    <Box position="absolute" inset="30px" border="1px solid" borderColor="#b45309" />
    <Box position="absolute" top="50px" left="50%" transform="translateX(-50%)" w="100px" h="100px"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="#92400e" strokeWidth="3" /><circle cx="50" cy="50" r="38" fill="none" stroke="#b45309" strokeWidth="1" /><text x="50" y="55" textAnchor="middle" fill="#92400e" fontSize="14" fontWeight="bold">تِبيان</text></svg></Box>
    <VStack h="full" justify="center" gap={3} px={24} py={20}>
      <Text fontSize="xs" color="#92400e" letterSpacing="0.3em" mt={8}>TIBYAN ISLAMIC ACADEMY</Text>
      <Text fontSize="4xl" fontWeight="bold" color="#78350f" fontFamily="serif">شهادة إتمام أكاديمية</Text>
      <Box w="400px" h="1px" bg="#92400e" opacity={0.5} />
      <Text fontSize="md" color="#92400e" mt={4}>هذا ليشهد أن</Text>
      <Text fontSize="3xl" fontWeight="bold" color="#713f12" fontFamily="serif" py={2}>{data.studentName}</Text>
      {data.studentNameEn && <Text fontSize="lg" color="#b45309" fontStyle="italic">{data.studentNameEn}</Text>}
      <Text fontSize="md" color="#92400e" mt={4}>قد أكمل بنجاح جميع متطلبات</Text>
      <Text fontSize="xl" fontWeight="bold" color="#92400e" fontFamily="serif">{data.courseName}</Text>
      <HStack gap={16} mt={4}>{data.score && <Text fontSize="md" color="#78350f">الدرجة: <Text as="span" fontWeight="bold">{data.score}%</Text></Text>}{data.grade && <Text fontSize="md" color="#78350f">التقدير: <Text as="span" fontWeight="bold">{data.grade}</Text></Text>}</HStack>
      <Text fontSize="sm" color="#92400e" mt={4}>صدرت في {new Date(data.completionDate).toLocaleDateString("ar-SA")}</Text>
      <HStack gap={32} mt={6}><VStack gap={1}><Box w="150px" borderBottom="1px solid" borderColor="#92400e" /><Text fontSize="xs" color="#92400e">{data.instructorName || "رئيس القسم"}</Text></VStack><VStack gap={1}><Box w="150px" borderBottom="1px solid" borderColor="#92400e" /><Text fontSize="xs" color="#92400e">مدير الأكاديمية</Text></VStack></HStack>
      <Text fontSize="xs" color="#d97706" mt={4}>{data.certificateNumber}</Text>
    </VStack>
  </Box>
));
Template15.displayName = "Template15";

// Template 16: Tech Futuristic
const Template16 = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => (
  <Box ref={ref} w="1056px" h="816px" bg="#111827" position="relative" overflow="hidden">
    <Box position="absolute" inset={0} opacity={0.1} backgroundImage="linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)" backgroundSize="50px 50px" />
    <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" w="600px" h="400px" bg="radial-gradient(ellipse, rgba(6, 182, 212, 0.2) 0%, transparent 70%)" />
    <Box position="absolute" top="20px" left="20px" w="4px" h="80px" bg="linear-gradient(180deg, #06b6d4, transparent)" />
    <Box position="absolute" top="20px" left="20px" w="80px" h="4px" bg="linear-gradient(90deg, #06b6d4, transparent)" />
    <Box position="absolute" bottom="20px" right="20px" w="4px" h="80px" bg="linear-gradient(0deg, #06b6d4, transparent)" />
    <Box position="absolute" bottom="20px" right="20px" w="80px" h="4px" bg="linear-gradient(270deg, #06b6d4, transparent)" />
    <VStack h="full" justify="center" gap={4} px={20} py={12}>
      <HStack gap={3}><Box w="40px" h="2px" bg="#06b6d4" /><Text fontSize="xs" color="#06b6d4" letterSpacing="0.4em" fontFamily="mono">TIBYAN_ACADEMY</Text><Box w="40px" h="2px" bg="#06b6d4" /></HStack>
      <Text fontSize="4xl" fontWeight="bold" color="white" mt={4}>شهادة إتمام</Text>
      <Text fontSize="xs" color="#67e8f9" fontFamily="mono">CERTIFICATE OF COMPLETION</Text>
      <Text fontSize="md" color="#9ca3af" mt={6}>// تم منح هذه الشهادة إلى</Text>
      <Box border="1px solid" borderColor="#06b6d4" px={10} py={4} bg="rgba(6, 182, 212, 0.1)"><Text fontSize="3xl" fontWeight="bold" color="#22d3ee">{data.studentName}</Text>{data.studentNameEn && <Text fontSize="md" color="#67e8f9" mt={1}>{data.studentNameEn}</Text>}</Box>
      <Text fontSize="md" color="#9ca3af" mt={4}>{`{ course: "${data.courseName}" }`}</Text>
      <HStack gap={6} mt={4}>{data.score && <Box border="1px solid" borderColor="#0891b2" px={4} py={2} bg="rgba(6, 182, 212, 0.05)"><Text fontSize="xs" color="#67e8f9" fontFamily="mono">score:</Text><Text fontSize="xl" fontWeight="bold" color="#06b6d4">{data.score}%</Text></Box>}{data.grade && <Box border="1px solid" borderColor="#0891b2" px={4} py={2} bg="rgba(6, 182, 212, 0.05)"><Text fontSize="xs" color="#67e8f9" fontFamily="mono">grade:</Text><Text fontSize="lg" fontWeight="bold" color="#06b6d4">{data.grade}</Text></Box>}<Box border="1px solid" borderColor="#0891b2" px={4} py={2} bg="rgba(6, 182, 212, 0.05)"><Text fontSize="xs" color="#67e8f9" fontFamily="mono">date:</Text><Text fontSize="sm" color="#22d3ee">{new Date(data.completionDate).toLocaleDateString("ar-SA")}</Text></Box></HStack>
      <HStack gap={20} mt={8}><VStack gap={1}><Box w="100px" borderBottom="1px solid" borderColor="#06b6d4" /><Text fontSize="xs" color="#67e8f9" fontFamily="mono">{data.instructorName || "instructor"}</Text></VStack><VStack gap={1}><Box w="100px" borderBottom="1px solid" borderColor="#06b6d4" /><Text fontSize="xs" color="#67e8f9" fontFamily="mono">admin</Text></VStack></HStack>
      <Text fontSize="xs" color="#164e63" fontFamily="mono" mt={6}>ID: {data.certificateNumber}</Text>
    </VStack>
  </Box>
));
Template16.displayName = "Template16";

// Template 17: Vintage Classic
const Template17 = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => (
  <Box ref={ref} w="1056px" h="816px" bg="#fef3c7" position="relative" overflow="hidden">
    <Box position="absolute" inset="20px" border="3px solid" borderColor="#78350f" />
    <Box position="absolute" inset="28px" border="1px solid" borderColor="#92400e" />
    <Box position="absolute" inset="36px" border="1px dashed" borderColor="#b45309" opacity={0.5} />
    <VStack h="full" justify="center" gap={3} px={24} py={16}>
      <Text fontSize="sm" color="#78350f" letterSpacing="0.3em" fontWeight="bold">✦ أكاديمية تِبيان ✦</Text>
      <Text fontSize="4xl" fontWeight="bold" color="#451a03" fontFamily="serif" fontStyle="italic">شهادة تقدير</Text>
      <HStack gap={3}><Box w="80px" h="1px" bg="#78350f" /><Text color="#92400e">❧</Text><Box w="80px" h="1px" bg="#78350f" /></HStack>
      <Text fontSize="md" color="#78350f" mt={6} fontStyle="italic">تُقدم هذه الشهادة إلى</Text>
      <Text fontSize="3xl" fontWeight="bold" color="#451a03" fontFamily="serif" py={2}>{data.studentName}</Text>
      {data.studentNameEn && <Text fontSize="md" color="#92400e" fontStyle="italic">{data.studentNameEn}</Text>}
      <Text fontSize="md" color="#78350f" mt={4} fontStyle="italic">تقديراً لإتمامه</Text>
      <Box bg="rgba(120, 53, 15, 0.1)" px={10} py={3} border="1px solid" borderColor="#b45309"><Text fontSize="xl" fontWeight="bold" color="#78350f" textAlign="center" fontFamily="serif">{data.courseName}</Text></Box>
      <HStack gap={12} mt={4}>{data.score && <VStack gap={0}><Text fontSize="2xl" fontWeight="bold" color="#78350f" fontFamily="serif">{data.score}%</Text><Text fontSize="xs" color="#92400e" fontStyle="italic">الدرجة</Text></VStack>}{data.grade && <VStack gap={0}><Text fontSize="xl" fontWeight="bold" color="#78350f" fontFamily="serif">{data.grade}</Text><Text fontSize="xs" color="#92400e" fontStyle="italic">التقدير</Text></VStack>}</HStack>
      <HStack gap={24} mt={6}><VStack gap={1}><Box w="100px" borderBottom="1px solid" borderColor="#78350f" /><Text fontSize="xs" color="#92400e" fontStyle="italic">{data.instructorName || "المدرب"}</Text></VStack><VStack gap={0}><Text fontSize="sm" color="#78350f">{new Date(data.completionDate).toLocaleDateString("ar-SA")}</Text><Text fontSize="xs" color="#92400e" fontStyle="italic">التاريخ</Text></VStack><VStack gap={1}><Box w="100px" borderBottom="1px solid" borderColor="#78350f" /><Text fontSize="xs" color="#92400e" fontStyle="italic">الإدارة</Text></VStack></HStack>
      <Text fontSize="xs" color="#b45309" mt={4}>{data.certificateNumber}</Text>
    </VStack>
  </Box>
));
Template17.displayName = "Template17";

// Template 18: Golden Frame Premium
const Template18 = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => (
  <Box ref={ref} w="1056px" h="816px" bg="linear-gradient(135deg, #1c1917 0%, #292524 100%)" position="relative" overflow="hidden">
    <Box position="absolute" inset="15px" border="6px solid" borderColor="#fbbf24" />
    <Box position="absolute" inset="25px" border="2px solid" borderColor="#f59e0b" />
    <Box position="absolute" inset="35px" border="1px solid" borderColor="#fbbf24" opacity={0.5} />
    <Box position="absolute" inset="45px" bg="linear-gradient(135deg, #fafaf9 0%, #f5f5f4 100%)" borderRadius="sm" />
    {[0, 1, 2, 3].map((i) => (<Box key={i} position="absolute" w="30px" h="30px" bg="#fbbf24" {...(i < 2 ? { top: "15px" } : { bottom: "15px" })} {...(i % 2 === 0 ? { left: "15px" } : { right: "15px" })} />))}
    <VStack h="full" justify="center" gap={4} px={24} py={20} position="relative">
      <Text fontSize="xs" color="#92400e" letterSpacing="0.4em">★ TIBYAN ACADEMY ★</Text>
      <Text fontSize="4xl" fontWeight="bold" color="#78350f" fontFamily="serif">شهادة تقدير</Text>
      <Box w="250px" h="3px" bg="linear-gradient(90deg, transparent, #fbbf24, transparent)" />
      <Text fontSize="md" color="#78350f" mt={6}>تُمنح هذه الشهادة إلى</Text>
      <Text fontSize="3xl" fontWeight="bold" color="#451a03" py={2}>{data.studentName}</Text>
      {data.studentNameEn && <Text fontSize="md" color="#92400e">{data.studentNameEn}</Text>}
      <Text fontSize="md" color="#78350f" mt={4}>لإتمامه بامتياز</Text>
      <Box bg="linear-gradient(135deg, #fef3c7, #fde68a)" px={10} py={4} borderRadius="md" border="2px solid" borderColor="#f59e0b"><Text fontSize="xl" fontWeight="bold" color="#78350f" textAlign="center">{data.courseName}</Text></Box>
      <HStack gap={12} mt={4}>{data.score && <VStack gap={0} bg="rgba(251, 191, 36, 0.2)" px={6} py={2} borderRadius="md"><Text fontSize="2xl" fontWeight="bold" color="#b45309">{data.score}%</Text><Text fontSize="xs" color="#78350f">الدرجة</Text></VStack>}{data.grade && <VStack gap={0} bg="rgba(251, 191, 36, 0.2)" px={6} py={2} borderRadius="md"><Text fontSize="xl" fontWeight="bold" color="#b45309">{data.grade}</Text><Text fontSize="xs" color="#78350f">التقدير</Text></VStack>}</HStack>
      <HStack gap={24} mt={6}><VStack gap={1}><Box w="120px" borderBottom="2px solid" borderColor="#f59e0b" /><Text fontSize="xs" color="#78350f">{data.instructorName || "المدرب"}</Text></VStack><VStack gap={0}><Text fontSize="sm" color="#451a03">{new Date(data.completionDate).toLocaleDateString("ar-SA")}</Text><Text fontSize="xs" color="#78350f">التاريخ</Text></VStack><VStack gap={1}><Box w="120px" borderBottom="2px solid" borderColor="#f59e0b" /><Text fontSize="xs" color="#78350f">الإدارة</Text></VStack></HStack>
      <Text fontSize="xs" color="#d97706" mt={4}>{data.certificateNumber}</Text>
    </VStack>
  </Box>
));
Template18.displayName = "Template18";

// Template 19: Gradient Wave Colorful
const Template19 = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => (
  <Box ref={ref} w="1056px" h="816px" bg="white" position="relative" overflow="hidden">
    <Box position="absolute" top={0} left={0} right={0} h="200px">
      <svg viewBox="0 0 1056 200" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
        <defs><linearGradient id="grad19" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="50%" stopColor="#ec4899" /><stop offset="100%" stopColor="#f97316" /></linearGradient></defs>
        <path d="M0,0 L1056,0 L1056,120 Q800,180 528,120 Q256,60 0,120 Z" fill="url(#grad19)" />
        <path d="M0,0 L1056,0 L1056,100 Q800,160 528,100 Q256,40 0,100 Z" fill="url(#grad19)" opacity="0.5" />
      </svg>
    </Box>
    <VStack h="full" justify="center" gap={4} px={20} py={16}>
      <Text fontSize="sm" color="white" fontWeight="bold" textShadow="0 2px 4px rgba(0,0,0,0.3)" mt={-8}>أكاديمية تِبيان</Text>
      <Text fontSize="4xl" fontWeight="bold" color="#4c1d95" mt={8}>شهادة إتمام</Text>
      <Box w="200px" h="3px" bg="linear-gradient(90deg, #8b5cf6, #ec4899, #f97316)" borderRadius="full" />
      <Text fontSize="md" color="#6b7280" mt={4}>تُقدم هذه الشهادة إلى</Text>
      <Text fontSize="3xl" fontWeight="bold" py={2} css={{ backgroundImage: "linear-gradient(to right, #8b5cf6, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{data.studentName}</Text>
      {data.studentNameEn && <Text fontSize="md" color="#9ca3af">{data.studentNameEn}</Text>}
      <Text fontSize="md" color="#6b7280" mt={2}>لإتمامه بنجاح</Text>
      <Box bg="linear-gradient(135deg, #faf5ff, #fdf2f8, #fff7ed)" px={10} py={4} borderRadius="xl" border="2px solid" borderColor="#e9d5ff"><Text fontSize="xl" fontWeight="bold" color="#7c3aed" textAlign="center">{data.courseName}</Text></Box>
      <HStack gap={6} mt={4}>{data.score && <Box bg="linear-gradient(135deg, #8b5cf6, #a855f7)" px={6} py={3} borderRadius="xl"><Text fontSize="2xl" fontWeight="bold" color="white">{data.score}%</Text><Text fontSize="xs" color="white" opacity={0.8} textAlign="center">الدرجة</Text></Box>}{data.grade && <Box bg="linear-gradient(135deg, #ec4899, #f472b6)" px={6} py={3} borderRadius="xl"><Text fontSize="xl" fontWeight="bold" color="white">{data.grade}</Text><Text fontSize="xs" color="white" opacity={0.8} textAlign="center">التقدير</Text></Box>}<Box bg="linear-gradient(135deg, #f97316, #fb923c)" px={6} py={3} borderRadius="xl"><Text fontSize="md" fontWeight="medium" color="white">{new Date(data.completionDate).toLocaleDateString("ar-SA")}</Text><Text fontSize="xs" color="white" opacity={0.8} textAlign="center">التاريخ</Text></Box></HStack>
      <HStack gap={20} mt={6}><VStack gap={1}><Box w="100px" borderBottom="2px solid" borderColor="#a855f7" /><Text fontSize="xs" color="#6b7280">{data.instructorName || "المدرب"}</Text></VStack><VStack gap={1}><Box w="100px" borderBottom="2px solid" borderColor="#ec4899" /><Text fontSize="xs" color="#6b7280">الإدارة</Text></VStack></HStack>
      <Text fontSize="xs" color="#d8b4fe" mt={2}>{data.certificateNumber}</Text>
    </VStack>
  </Box>
));
Template19.displayName = "Template19";

// Template 20: Minimalist Line
const Template20 = forwardRef<HTMLDivElement, { data: CertificateData }>(({ data }, ref) => (
  <Box ref={ref} w="1056px" h="816px" bg="white" position="relative" overflow="hidden">
    <Box position="absolute" top="50px" left="50px" right="50px" h="1px" bg="#e5e7eb" />
    <Box position="absolute" bottom="50px" left="50px" right="50px" h="1px" bg="#e5e7eb" />
    <Box position="absolute" top="50px" bottom="50px" left="50px" w="1px" bg="#e5e7eb" />
    <Box position="absolute" top="50px" bottom="50px" right="50px" w="1px" bg="#e5e7eb" />
    {[0, 1, 2, 3].map((i) => (<Box key={i} position="absolute" w="8px" h="8px" bg="#111827" borderRadius="full" {...(i < 2 ? { top: "46px" } : { bottom: "46px" })} {...(i % 2 === 0 ? { left: "46px" } : { right: "46px" })} />))}
    <VStack h="full" justify="center" gap={6} px={24} py={20}>
      <Text fontSize="xs" color="#9ca3af" letterSpacing="0.5em">TIBYAN</Text>
      <Text fontSize="5xl" fontWeight="200" color="#111827">شهادة إتمام</Text>
      <Box w="60px" h="1px" bg="#111827" />
      <Text fontSize="md" color="#6b7280" mt={6}>تُمنح إلى</Text>
      <Text fontSize="3xl" fontWeight="600" color="#111827">{data.studentName}</Text>
      {data.studentNameEn && <Text fontSize="md" color="#9ca3af" fontWeight="300">{data.studentNameEn}</Text>}
      <Box mt={4}><Text fontSize="sm" color="#6b7280">لإتمام</Text><Text fontSize="xl" fontWeight="500" color="#374151" mt={1}>{data.courseName}</Text></Box>
      <HStack gap={16} mt={4}>{data.score && <VStack gap={1}><Text fontSize="3xl" fontWeight="200" color="#111827">{data.score}%</Text><Text fontSize="xs" color="#9ca3af">الدرجة</Text></VStack>}{data.grade && <VStack gap={1}><Text fontSize="2xl" fontWeight="300" color="#111827">{data.grade}</Text><Text fontSize="xs" color="#9ca3af">التقدير</Text></VStack>}</HStack>
      <HStack gap={24} mt={8}><VStack gap={2}><Box w="80px" h="1px" bg="#d1d5db" /><Text fontSize="xs" color="#9ca3af">{data.instructorName || "المدرب"}</Text></VStack><VStack gap={1}><Text fontSize="sm" color="#374151">{new Date(data.completionDate).toLocaleDateString("ar-SA")}</Text><Text fontSize="xs" color="#9ca3af">التاريخ</Text></VStack><VStack gap={2}><Box w="80px" h="1px" bg="#d1d5db" /><Text fontSize="xs" color="#9ca3af">الإدارة</Text></VStack></HStack>
      <Text fontSize="xs" color="#d1d5db" mt={6}>{data.certificateNumber}</Text>
    </VStack>
  </Box>
));
Template20.displayName = "Template20";

// Template names mapping
export const templateNames: Record<string, { name: string; nameEn: string; description: string }> = {
  template1: { name: "إسلامي كلاسيكي", nameEn: "Classic Islamic", description: "تصميم تقليدي بزخارف ذهبية إسلامية" },
  template2: { name: "أخضر عصري", nameEn: "Modern Green", description: "تصميم بسيط وأنيق بألوان خضراء" },
  template3: { name: "ذهبي أنيق", nameEn: "Elegant Dark Gold", description: "تصميم فاخر داكن مع لمسات ذهبية" },
  template4: { name: "احترافي أزرق", nameEn: "Professional Blue", description: "تصميم رسمي للشركات" },
  template5: { name: "بنفسجي ملكي", nameEn: "Royal Purple", description: "تصميم ملكي بتدرجات بنفسجية" },
  template6: { name: "أزرق محيطي", nameEn: "Ocean Blue", description: "تصميم بأمواج زرقاء هادئة" },
  template7: { name: "أخضر زمردي", nameEn: "Emerald Luxury", description: "تصميم فاخر بالأخضر الداكن" },
  template8: { name: "برتقالي غروب", nameEn: "Sunset Orange", description: "تصميم دافئ بألوان الغروب" },
  template9: { name: "وردي ذهبي", nameEn: "Rose Gold", description: "تصميم أنثوي أنيق" },
  template10: { name: "داكن عصري", nameEn: "Midnight Dark", description: "تصميم داكن بتأثيرات متوهجة" },
  template11: { name: "هندسي حديث", nameEn: "Geometric Modern", description: "تصميم بأشكال هندسية عصرية" },
  template12: { name: "خط عربي", nameEn: "Arabic Calligraphy", description: "تصميم تقليدي بالخط العربي" },
  template13: { name: "رخامي فاخر", nameEn: "Marble Luxury", description: "تصميم فاخر بملمس رخامي" },
  template14: { name: "طبيعة خضراء", nameEn: "Nature Green", description: "تصميم عضوي بأوراق الشجر" },
  template15: { name: "أكاديمي تقليدي", nameEn: "Academic Traditional", description: "تصميم جامعي رسمي" },
  template16: { name: "تقني مستقبلي", nameEn: "Tech Futuristic", description: "تصميم تقني بشبكات رقمية" },
  template17: { name: "كلاسيكي عتيق", nameEn: "Vintage Classic", description: "تصميم ريترو أنيق" },
  template18: { name: "إطار ذهبي", nameEn: "Golden Frame", description: "تصميم فاخر بإطار ذهبي" },
  template19: { name: "موجة ملونة", nameEn: "Gradient Wave", description: "تصميم حيوي بتدرجات ملونة" },
  template20: { name: "خطوط بسيطة", nameEn: "Minimalist Line", description: "تصميم نظيف وبسيط جداً" },
};

// Main Component
const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ data, template = "template1" }, ref) => {
    const templates: Record<string, React.ForwardRefExoticComponent<{ data: CertificateData } & React.RefAttributes<HTMLDivElement>>> = {
      template1: Template1, template2: Template2, template3: Template3, template4: Template4, template5: Template5,
      template6: Template6, template7: Template7, template8: Template8, template9: Template9, template10: Template10,
      template11: Template11, template12: Template12, template13: Template13, template14: Template14, template15: Template15,
      template16: Template16, template17: Template17, template18: Template18, template19: Template19, template20: Template20,
    };
    const SelectedTemplate = templates[template] || Template1;
    return <SelectedTemplate ref={ref} data={data} />;
  }
);

CertificateTemplate.displayName = "CertificateTemplate";

export default CertificateTemplate;
