"use client";

import { Box, SimpleGrid, Text, VStack, Heading } from "@chakra-ui/react";
import { motion } from "framer-motion";
import {
  LuFileText,
  LuBookOpen,
  LuClipboardCheck,
  LuCalendar,
  LuLanguages,
  LuSpellCheck,
} from "react-icons/lu";
import type { ReactNode } from "react";

// ============================================================================
// TYPES
// ============================================================================

interface Template {
  id: string;
  labelAr: string;
  labelEn: string;
  icon: ReactNode;
  promptAr: string;
  promptEn: string;
  color: string;
}

interface ChatTemplatesProps {
  locale: "ar" | "en";
  onSelectTemplate: (prompt: string) => void;
}

// ============================================================================
// STYLE CONSTANTS
// ============================================================================

const TEXT_PRIMARY = "whiteAlpha.900";

// ============================================================================
// TEMPLATES DATA
// ============================================================================

const templates: Template[] = [
  {
    id: "summarize",
    labelAr: "تلخيص",
    labelEn: "Summarize",
    icon: <LuFileText size={24} />,
    promptAr: `ألخص لي الموضوع التالي بشكل مبسط وواضح:

[أدخل النص أو الموضوع هنا]

أريد ملخصاً يتضمن:
• النقاط الرئيسية
• الأفكار المهمة
• خلاصة موجزة`,
    promptEn: `Please summarize the following topic in a clear and simple way:

[Enter the text or topic here]

I want a summary that includes:
• Key points
• Important ideas
• Brief conclusion`,
    color: "blue.400",
  },
  {
    id: "explain",
    labelAr: "شرح",
    labelEn: "Explain",
    icon: <LuBookOpen size={24} />,
    promptAr: `اشرح لي المفهوم التالي بطريقة سهلة ومفصلة:

[أدخل المفهوم أو الموضوع هنا]

أريد الشرح أن يتضمن:
• تعريف بسيط
• أمثلة توضيحية
• تطبيقات عملية`,
    promptEn: `Please explain the following concept in an easy and detailed way:

[Enter the concept or topic here]

I want the explanation to include:
• Simple definition
• Illustrative examples
• Practical applications`,
    color: "green.400",
  },
  {
    id: "quiz",
    labelAr: "اختبار",
    labelEn: "Quiz",
    icon: <LuClipboardCheck size={24} />,
    promptAr: `أنشئ لي اختباراً قصيراً عن الموضوع التالي:

[أدخل الموضوع هنا]

أريد الاختبار أن يتضمن:
• 5 أسئلة متنوعة (اختيار من متعدد، صح/خطأ، إكمال)
• مستويات صعوبة متدرجة
• الإجابات الصحيحة في النهاية`,
    promptEn: `Create a short quiz about the following topic:

[Enter the topic here]

I want the quiz to include:
• 5 varied questions (multiple choice, true/false, fill-in)
• Graduated difficulty levels
• Correct answers at the end`,
    color: "purple.400",
  },
  {
    id: "study-plan",
    labelAr: "خطة مذاكرة",
    labelEn: "Study Plan",
    icon: <LuCalendar size={24} />,
    promptAr: `ساعدني في إنشاء خطة مذاكرة للموضوع التالي:

[أدخل الموضوع أو المادة هنا]

المعلومات:
• الوقت المتاح: [عدد الأيام/الأسابيع]
• مستوى الصعوبة: [مبتدئ/متوسط/متقدم]
• الهدف: [اختبار/فهم عام/إتقان]`,
    promptEn: `Help me create a study plan for the following topic:

[Enter the topic or subject here]

Information:
• Available time: [number of days/weeks]
• Difficulty level: [beginner/intermediate/advanced]
• Goal: [exam/general understanding/mastery]`,
    color: "orange.400",
  },
  {
    id: "translate",
    labelAr: "ترجمة",
    labelEn: "Translate",
    icon: <LuLanguages size={24} />,
    promptAr: `ترجم لي النص التالي مع شرح المفردات المهمة:

[أدخل النص هنا]

أريد:
• الترجمة الدقيقة
• شرح الكلمات الصعبة
• ملاحظات لغوية إن وجدت`,
    promptEn: `Translate the following text with explanation of important vocabulary:

[Enter the text here]

I want:
• Accurate translation
• Explanation of difficult words
• Language notes if any`,
    color: "teal.400",
  },
  {
    id: "grammar",
    labelAr: "مراجعة قواعد",
    labelEn: "Grammar Review",
    icon: <LuSpellCheck size={24} />,
    promptAr: `راجع النص التالي وصحح الأخطاء النحوية والإملائية:

[أدخل النص هنا]

أريد:
• تصحيح الأخطاء
• شرح سبب الخطأ
• اقتراحات لتحسين الأسلوب`,
    promptEn: `Review the following text and correct grammatical and spelling errors:

[Enter the text here]

I want:
• Error corrections
• Explanation of why it was wrong
• Suggestions for improving style`,
    color: "pink.400",
  },
];

// ============================================================================
// TRANSLATIONS
// ============================================================================

const translations = {
  ar: {
    title: "كيف يمكنني مساعدتك؟",
    subtitle: "اختر قالباً للبدء أو اكتب رسالتك",
  },
  en: {
    title: "How can I help you?",
    subtitle: "Choose a template to start or type your message",
  },
};

// ============================================================================
// MOTION COMPONENTS
// ============================================================================

const MotionBox = motion.create(Box);

// ============================================================================
// TEMPLATE CARD COMPONENT
// ============================================================================

interface TemplateCardProps {
  template: Template;
  locale: "ar" | "en";
  index: number;
  onClick: () => void;
}

function TemplateCard({ template, locale, index, onClick }: TemplateCardProps) {
  const label = locale === "ar" ? template.labelAr : template.labelEn;

  return (
    <MotionBox
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Box
        as="button"
        w="100%"
        p={4}
        bg="whiteAlpha.50"
        borderRadius="xl"
        border="1px solid"
        borderColor="whiteAlpha.100"
        cursor="pointer"
        transition="all 0.2s ease"
        _hover={{
          bg: "whiteAlpha.100",
          borderColor: template.color,
          boxShadow: `0 0 20px ${template.color}20`,
        }}
        onClick={onClick}
        textAlign={locale === "ar" ? "right" : "left"}
      >
        <VStack align={locale === "ar" ? "flex-end" : "flex-start"} gap={2}>
          <Box color={template.color}>{template.icon}</Box>
          <Text fontSize="sm" fontWeight={600} color={TEXT_PRIMARY}>
            {label}
          </Text>
        </VStack>
      </Box>
    </MotionBox>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ChatTemplates({ locale, onSelectTemplate }: ChatTemplatesProps) {
  const t = translations[locale];
  const isRTL = locale === "ar";

  const handleTemplateClick = (template: Template) => {
    const prompt = locale === "ar" ? template.promptAr : template.promptEn;
    onSelectTemplate(prompt);
  };

  return (
    <VStack
      flex={1}
      justify="center"
      align="center"
      px={6}
      py={8}
      gap={8}
      maxW="700px"
      mx="auto"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Header */}
      <VStack gap={2} textAlign="center">
        <MotionBox
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Heading
            as="h1"
            size="xl"
            fontWeight={700}
            bgGradient="linear(to-r, yellow.400, orange.400)"
            bgClip="text"
          >
            {t.title}
          </Heading>
        </MotionBox>
        <MotionBox
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Text fontSize="md" color={TEXT_PRIMARY} opacity={0.72}>
            {t.subtitle}
          </Text>
        </MotionBox>
      </VStack>

      {/* Templates grid */}
      <SimpleGrid columns={{ base: 2, md: 3 }} gap={4} w="100%">
        {templates.map((template, index) => (
          <TemplateCard
            key={template.id}
            template={template}
            locale={locale}
            index={index}
            onClick={() => handleTemplateClick(template)}
          />
        ))}
      </SimpleGrid>
    </VStack>
  );
}

// Export templates for potential reuse
export { templates };
export type { Template };
