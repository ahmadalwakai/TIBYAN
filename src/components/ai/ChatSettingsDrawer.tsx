"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Input,
  Textarea,
  Button,
  IconButton,
} from "@chakra-ui/react";
import { motion, AnimatePresence } from "framer-motion";
import { LuX, LuSettings, LuRotateCcw } from "react-icons/lu";
import {
  type ChatSettings,
  DEFAULT_SETTINGS,
  saveSettings,
  resetSettings,
} from "./chatSettingsStore";

// ============================================================================
// TYPES
// ============================================================================

interface ChatSettingsDrawerProps {
  isOpen: boolean;
  locale: "ar" | "en";
  settings: ChatSettings;
  onClose: () => void;
  onSettingsChange: (settings: ChatSettings) => void;
}

// ============================================================================
// TRANSLATIONS
// ============================================================================

const translations = {
  ar: {
    settings: "الإعدادات",
    save: "حفظ",
    reset: "إعادة تعيين",
    cancel: "إلغاء",
    // Personalization
    personalization: "التخصيص",
    displayName: "الاسم المعروض",
    displayNameHint: "كيف تريد أن يناديك المساعد؟",
    role: "الدور",
    roleStudent: "طالب",
    roleParent: "ولي أمر",
    roleTeacher: "معلم",
    roleAdmin: "مدير",
    roleOther: "أخرى",
    level: "المستوى",
    levelBeginner: "مبتدئ",
    levelIntermediate: "متوسط",
    levelAdvanced: "متقدم",
    goals: "الأهداف",
    goalsHint: "ما الذي تريد تحقيقه؟ (300 حرف)",
    customInstructions: "تعليمات مخصصة",
    customInstructionsHint: "أي تفضيلات خاصة للردود؟ (800 حرف)",
    // Response
    responseStyle: "أسلوب الرد",
    tone: "النبرة",
    toneProfessional: "احترافية",
    toneFriendly: "ودية",
    toneStrict: "صارمة",
    verbosity: "الإسهاب",
    verbosityShort: "مختصر",
    verbosityBalanced: "متوازن",
    verbosityDetailed: "مفصل",
    format: "التنسيق",
    formatParagraphs: "فقرات",
    formatBullets: "نقاط",
    formatStepByStep: "خطوة بخطوة",
    // Language
    languageSettings: "اللغة",
    languageMode: "وضع اللغة",
    languageAuto: "تلقائي",
    languageLockedAr: "عربي فقط",
    languageLockedEn: "إنجليزي فقط",
    strictNoThirdLanguage: "منع اللغات الأخرى",
    strictNoThirdLanguageHint: "لا ردود بلغات غير العربية والإنجليزية",
    // Privacy
    privacy: "الخصوصية",
    saveChats: "حفظ المحادثات",
    saveChatsHint: "احفظ المحادثات محلياً للرجوع إليها لاحقاً",
    // Accessibility
    accessibility: "إمكانية الوصول",
    fontScale: "حجم الخط",
    fontSmall: "صغير",
    fontNormal: "عادي",
    fontLarge: "كبير",
    fontExtraLarge: "كبير جداً",
    reduceMotion: "تقليل الحركة",
    reduceMotionHint: "تعطيل الرسوم المتحركة والنبضات",
    // Streaming
    streaming: "البث",
    humanize: "كتابة بشرية",
    humanizeHint: "تأثير الكتابة التدريجية",
    speed: "السرعة",
    speedRealistic: "واقعية",
    speedFast: "سريعة",
  },
  en: {
    settings: "Settings",
    save: "Save",
    reset: "Reset",
    cancel: "Cancel",
    // Personalization
    personalization: "Personalization",
    displayName: "Display Name",
    displayNameHint: "How would you like the assistant to address you?",
    role: "Role",
    roleStudent: "Student",
    roleParent: "Parent",
    roleTeacher: "Teacher",
    roleAdmin: "Admin",
    roleOther: "Other",
    level: "Level",
    levelBeginner: "Beginner",
    levelIntermediate: "Intermediate",
    levelAdvanced: "Advanced",
    goals: "Goals",
    goalsHint: "What do you want to achieve? (300 chars)",
    customInstructions: "Custom Instructions",
    customInstructionsHint: "Any special preferences for responses? (800 chars)",
    // Response
    responseStyle: "Response Style",
    tone: "Tone",
    toneProfessional: "Professional",
    toneFriendly: "Friendly",
    toneStrict: "Strict",
    verbosity: "Verbosity",
    verbosityShort: "Short",
    verbosityBalanced: "Balanced",
    verbosityDetailed: "Detailed",
    format: "Format",
    formatParagraphs: "Paragraphs",
    formatBullets: "Bullets",
    formatStepByStep: "Step by Step",
    // Language
    languageSettings: "Language",
    languageMode: "Language Mode",
    languageAuto: "Auto",
    languageLockedAr: "Arabic Only",
    languageLockedEn: "English Only",
    strictNoThirdLanguage: "Block Other Languages",
    strictNoThirdLanguageHint: "No responses in languages other than Arabic and English",
    // Privacy
    privacy: "Privacy",
    saveChats: "Save Chats",
    saveChatsHint: "Save chats locally for later reference",
    // Accessibility
    accessibility: "Accessibility",
    fontScale: "Font Size",
    fontSmall: "Small",
    fontNormal: "Normal",
    fontLarge: "Large",
    fontExtraLarge: "Extra Large",
    reduceMotion: "Reduce Motion",
    reduceMotionHint: "Disable animations and pulsing",
    // Streaming
    streaming: "Streaming",
    humanize: "Humanized Typing",
    humanizeHint: "Gradual typing effect",
    speed: "Speed",
    speedRealistic: "Realistic",
    speedFast: "Fast",
  },
};

// ============================================================================
// STYLE CONSTANTS
// ============================================================================

const TEXT_PRIMARY = "whiteAlpha.900";
const TEXT_MUTED = "whiteAlpha.700";
const BORDER_COLOR = "whiteAlpha.200";

// ============================================================================
// MOTION COMPONENTS
// ============================================================================

const MotionBox = motion.create(Box);

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
  return (
    <VStack align="stretch" gap={3} w="100%">
      <Text
        fontSize="sm"
        fontWeight="600"
        color="yellow.400"
        textTransform="uppercase"
        letterSpacing="wide"
      >
        {title}
      </Text>
      <VStack align="stretch" gap={2} pl={2}>
        {children}
      </VStack>
    </VStack>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <VStack align="stretch" gap={1}>
      <Text fontSize="sm" fontWeight="500" color={TEXT_PRIMARY}>
        {label}
      </Text>
      {hint && (
        <Text fontSize="xs" color={TEXT_MUTED}>
          {hint}
        </Text>
      )}
      {children}
    </VStack>
  );
}

interface ToggleProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function Toggle({ label, hint, checked, onChange }: ToggleProps) {
  return (
    <Flex justify="space-between" align="center" py={1}>
      <VStack align="start" gap={0}>
        <Text fontSize="sm" fontWeight="500" color={TEXT_PRIMARY}>
          {label}
        </Text>
        {hint && (
          <Text fontSize="xs" color={TEXT_MUTED}>
            {hint}
          </Text>
        )}
      </VStack>
      <Box
        as="button"
        w={12}
        h={6}
        borderRadius="full"
        bg={checked ? "green.500" : "gray.600"}
        position="relative"
        transition="background 0.2s"
        onClick={() => onChange(!checked)}
        cursor="pointer"
        _hover={{ opacity: 0.9 }}
      >
        <Box
          position="absolute"
          top="2px"
          left={checked ? "26px" : "2px"}
          w={5}
          h={5}
          borderRadius="full"
          bg="white"
          transition="left 0.2s"
        />
      </Box>
    </Flex>
  );
}

interface SelectButtonsProps<T extends string> {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
}

function SelectButtons<T extends string>({
  options,
  value,
  onChange,
}: SelectButtonsProps<T>) {
  return (
    <HStack gap={1} flexWrap="wrap">
      {options.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={value === option.value ? "solid" : "outline"}
          bg={value === option.value ? "yellow.500" : "transparent"}
          color={value === option.value ? "gray.900" : TEXT_PRIMARY}
          borderColor={BORDER_COLOR}
          _hover={{
            bg: value === option.value ? "yellow.400" : "whiteAlpha.100",
          }}
          onClick={() => onChange(option.value)}
          fontWeight={value === option.value ? "600" : "400"}
        >
          {option.label}
        </Button>
      ))}
    </HStack>
  );
}

// Font scale buttons - separate component for number values
interface FontScaleButtonsProps {
  options: Array<{ value: 0.9 | 1 | 1.1 | 1.2; label: string }>;
  value: 0.9 | 1 | 1.1 | 1.2;
  onChange: (value: 0.9 | 1 | 1.1 | 1.2) => void;
}

function FontScaleButtons({
  options,
  value,
  onChange,
}: FontScaleButtonsProps) {
  return (
    <HStack gap={1} flexWrap="wrap">
      {options.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={value === option.value ? "solid" : "outline"}
          bg={value === option.value ? "yellow.500" : "transparent"}
          color={value === option.value ? "gray.900" : TEXT_PRIMARY}
          borderColor={BORDER_COLOR}
          _hover={{
            bg: value === option.value ? "yellow.400" : "whiteAlpha.100",
          }}
          onClick={() => onChange(option.value)}
          fontWeight={value === option.value ? "600" : "400"}
        >
          {option.label}
        </Button>
      ))}
    </HStack>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ChatSettingsDrawer({
  isOpen,
  locale,
  settings,
  onClose,
  onSettingsChange,
}: ChatSettingsDrawerProps) {
  const isRTL = locale === "ar";
  const t = translations[locale];

  // Local state for editing
  const [draft, setDraft] = useState<ChatSettings>(settings);

  // Reset draft when settings change externally or drawer opens
  const resetDraft = useCallback(() => {
    setDraft(settings);
  }, [settings]);

  // Update draft field helper - type-safe version
  const updatePersonalization = useCallback(
    (field: keyof ChatSettings["personalization"], value: ChatSettings["personalization"][typeof field]) => {
      setDraft((prev) => ({
        ...prev,
        personalization: { ...prev.personalization, [field]: value },
      }));
    },
    []
  );

  const updateResponse = useCallback(
    (field: keyof ChatSettings["response"], value: ChatSettings["response"][typeof field]) => {
      setDraft((prev) => ({
        ...prev,
        response: { ...prev.response, [field]: value },
      }));
    },
    []
  );

  const updateLanguage = useCallback(
    (field: keyof ChatSettings["language"], value: ChatSettings["language"][typeof field]) => {
      setDraft((prev) => ({
        ...prev,
        language: { ...prev.language, [field]: value },
      }));
    },
    []
  );

  const updatePrivacy = useCallback(
    (field: keyof ChatSettings["privacy"], value: boolean) => {
      setDraft((prev) => ({
        ...prev,
        privacy: { ...prev.privacy, [field]: value },
      }));
    },
    []
  );

  const updateAccessibility = useCallback(
    (field: keyof ChatSettings["accessibility"], value: ChatSettings["accessibility"][typeof field]) => {
      setDraft((prev) => ({
        ...prev,
        accessibility: { ...prev.accessibility, [field]: value },
      }));
    },
    []
  );

  const updateStreaming = useCallback(
    (field: keyof ChatSettings["streaming"], value: ChatSettings["streaming"][typeof field]) => {
      setDraft((prev) => ({
        ...prev,
        streaming: { ...prev.streaming, [field]: value },
      }));
    },
    []
  );

  // Handle save
  const handleSave = useCallback(() => {
    saveSettings(draft);
    onSettingsChange(draft);
    onClose();
  }, [draft, onSettingsChange, onClose]);

  // Handle reset
  const handleReset = useCallback(() => {
    const defaults = resetSettings();
    setDraft(defaults);
    onSettingsChange(defaults);
  }, [onSettingsChange]);

  // Role options
  const roleOptions = useMemo(
    () => [
      { value: "student" as const, label: t.roleStudent },
      { value: "parent" as const, label: t.roleParent },
      { value: "teacher" as const, label: t.roleTeacher },
      { value: "admin" as const, label: t.roleAdmin },
      { value: "other" as const, label: t.roleOther },
    ],
    [t]
  );

  // Level options
  const levelOptions = useMemo(
    () => [
      { value: "beginner" as const, label: t.levelBeginner },
      { value: "intermediate" as const, label: t.levelIntermediate },
      { value: "advanced" as const, label: t.levelAdvanced },
    ],
    [t]
  );

  // Tone options
  const toneOptions = useMemo(
    () => [
      { value: "professional" as const, label: t.toneProfessional },
      { value: "friendly" as const, label: t.toneFriendly },
      { value: "strict" as const, label: t.toneStrict },
    ],
    [t]
  );

  // Verbosity options
  const verbosityOptions = useMemo(
    () => [
      { value: "short" as const, label: t.verbosityShort },
      { value: "balanced" as const, label: t.verbosityBalanced },
      { value: "detailed" as const, label: t.verbosityDetailed },
    ],
    [t]
  );

  // Format options
  const formatOptions = useMemo(
    () => [
      { value: "paragraphs" as const, label: t.formatParagraphs },
      { value: "bullets" as const, label: t.formatBullets },
      { value: "step_by_step" as const, label: t.formatStepByStep },
    ],
    [t]
  );

  // Language mode options
  const languageModeOptions = useMemo(
    () => [
      { value: "auto" as const, label: t.languageAuto },
      { value: "locked_ar" as const, label: t.languageLockedAr },
      { value: "locked_en" as const, label: t.languageLockedEn },
    ],
    [t]
  );

  // Font scale options
  const fontScaleOptions = useMemo(
    () => [
      { value: 0.9 as const, label: t.fontSmall },
      { value: 1 as const, label: t.fontNormal },
      { value: 1.1 as const, label: t.fontLarge },
      { value: 1.2 as const, label: t.fontExtraLarge },
    ],
    [t]
  );

  // Speed options
  const speedOptions = useMemo(
    () => [
      { value: "realistic" as const, label: t.speedRealistic },
      { value: "fast" as const, label: t.speedFast },
    ],
    [t]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            position="fixed"
            inset={0}
            bg="blackAlpha.700"
            zIndex={300}
            onClick={onClose}
          />

          {/* Drawer */}
          <MotionBox
            initial={{ x: isRTL ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRTL ? "-100%" : "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            position="fixed"
            top={0}
            bottom={0}
            {...(isRTL ? { left: 0 } : { right: 0 })}
            w={{ base: "100%", sm: "400px" }}
            maxW="100vw"
            bg="gray.900"
            zIndex={301}
            borderColor="yellow.500"
            {...(isRTL
              ? { borderRight: "1px solid" }
              : { borderLeft: "1px solid" })}
            boxShadow="0 0 30px rgba(236, 201, 75, 0.3)"
            display="flex"
            flexDirection="column"
          >
            {/* Header */}
            <Flex
              align="center"
              justify="space-between"
              p={4}
              borderBottom="1px solid"
              borderColor={BORDER_COLOR}
            >
              <HStack gap={2}>
                <LuSettings size={20} color="var(--chakra-colors-yellow-400)" />
                <Text fontSize="lg" fontWeight="600" color={TEXT_PRIMARY}>
                  {t.settings}
                </Text>
              </HStack>
              <IconButton
                aria-label="Close"
                size="sm"
                variant="ghost"
                color={TEXT_PRIMARY}
                _hover={{ bg: "whiteAlpha.100" }}
                onClick={onClose}
              >
                <LuX size={18} />
              </IconButton>
            </Flex>

            {/* Content */}
            <Box
              flex={1}
              overflowY="auto"
              p={4}
              dir={isRTL ? "rtl" : "ltr"}
              css={{
                "&::-webkit-scrollbar": { width: "6px" },
                "&::-webkit-scrollbar-track": { background: "transparent" },
                "&::-webkit-scrollbar-thumb": {
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "3px",
                },
              }}
            >
              <VStack align="stretch" gap={6}>
                {/* ===== PERSONALIZATION ===== */}
                <Section title={t.personalization}>
                  <Field label={t.displayName} hint={t.displayNameHint}>
                    <Input
                      size="sm"
                      value={draft.personalization.displayName || ""}
                      onChange={(e) =>
                        updatePersonalization(
                          "displayName",
                          e.target.value || undefined
                        )
                      }
                      maxLength={50}
                      bg="whiteAlpha.50"
                      border="1px solid"
                      borderColor={BORDER_COLOR}
                      color={TEXT_PRIMARY}
                      _placeholder={{ color: TEXT_MUTED }}
                      _focus={{ borderColor: "yellow.400", boxShadow: "none" }}
                    />
                  </Field>

                  <Field label={t.role}>
                    <SelectButtons
                      options={roleOptions}
                      value={draft.personalization.role || "other"}
                      onChange={(v) =>
                        updatePersonalization(
                          "role",
                          v === "other" ? undefined : v
                        )
                      }
                    />
                  </Field>

                  <Field label={t.level}>
                    <SelectButtons
                      options={levelOptions}
                      value={draft.personalization.level || "beginner"}
                      onChange={(v) => updatePersonalization("level", v)}
                    />
                  </Field>

                  <Field label={t.goals} hint={t.goalsHint}>
                    <Textarea
                      size="sm"
                      value={draft.personalization.goals || ""}
                      onChange={(e) =>
                        updatePersonalization(
                          "goals",
                          e.target.value || undefined
                        )
                      }
                      maxLength={300}
                      rows={2}
                      bg="whiteAlpha.50"
                      border="1px solid"
                      borderColor={BORDER_COLOR}
                      color={TEXT_PRIMARY}
                      _placeholder={{ color: TEXT_MUTED }}
                      _focus={{ borderColor: "yellow.400", boxShadow: "none" }}
                      resize="none"
                    />
                  </Field>

                  <Field label={t.customInstructions} hint={t.customInstructionsHint}>
                    <Textarea
                      size="sm"
                      value={draft.personalization.customInstructions || ""}
                      onChange={(e) =>
                        updatePersonalization(
                          "customInstructions",
                          e.target.value || undefined
                        )
                      }
                      maxLength={800}
                      rows={3}
                      bg="whiteAlpha.50"
                      border="1px solid"
                      borderColor={BORDER_COLOR}
                      color={TEXT_PRIMARY}
                      _placeholder={{ color: TEXT_MUTED }}
                      _focus={{ borderColor: "yellow.400", boxShadow: "none" }}
                      resize="none"
                    />
                  </Field>
                </Section>

                {/* ===== RESPONSE STYLE ===== */}
                <Section title={t.responseStyle}>
                  <Field label={t.tone}>
                    <SelectButtons
                      options={toneOptions}
                      value={draft.response.tone}
                      onChange={(v) => updateResponse("tone", v)}
                    />
                  </Field>

                  <Field label={t.verbosity}>
                    <SelectButtons
                      options={verbosityOptions}
                      value={draft.response.verbosity}
                      onChange={(v) => updateResponse("verbosity", v)}
                    />
                  </Field>

                  <Field label={t.format}>
                    <SelectButtons
                      options={formatOptions}
                      value={draft.response.format}
                      onChange={(v) => updateResponse("format", v)}
                    />
                  </Field>
                </Section>

                {/* ===== LANGUAGE ===== */}
                <Section title={t.languageSettings}>
                  <Field label={t.languageMode}>
                    <SelectButtons
                      options={languageModeOptions}
                      value={draft.language.mode}
                      onChange={(v) => updateLanguage("mode", v)}
                    />
                  </Field>

                  <Toggle
                    label={t.strictNoThirdLanguage}
                    hint={t.strictNoThirdLanguageHint}
                    checked={draft.language.strictNoThirdLanguage}
                    onChange={(v) =>
                      updateLanguage("strictNoThirdLanguage", v)
                    }
                  />
                </Section>

                {/* ===== PRIVACY ===== */}
                <Section title={t.privacy}>
                  <Toggle
                    label={t.saveChats}
                    hint={t.saveChatsHint}
                    checked={draft.privacy.saveChats}
                    onChange={(v) => updatePrivacy("saveChats", v)}
                  />
                </Section>

                {/* ===== ACCESSIBILITY ===== */}
                <Section title={t.accessibility}>
                  <Field label={t.fontScale}>
                    <FontScaleButtons
                      options={fontScaleOptions}
                      value={draft.accessibility.fontScale}
                      onChange={(v) => updateAccessibility("fontScale", v)}
                    />
                  </Field>

                  <Toggle
                    label={t.reduceMotion}
                    hint={t.reduceMotionHint}
                    checked={draft.accessibility.reduceMotion}
                    onChange={(v) => updateAccessibility("reduceMotion", v)}
                  />
                </Section>

                {/* ===== STREAMING ===== */}
                <Section title={t.streaming}>
                  <Toggle
                    label={t.humanize}
                    hint={t.humanizeHint}
                    checked={draft.streaming.humanize}
                    onChange={(v) => updateStreaming("humanize", v)}
                  />

                  <Field label={t.speed}>
                    <SelectButtons
                      options={speedOptions}
                      value={draft.streaming.speed}
                      onChange={(v) => updateStreaming("speed", v)}
                    />
                  </Field>
                </Section>
              </VStack>
            </Box>

            {/* Footer */}
            <Flex
              p={4}
              gap={2}
              borderTop="1px solid"
              borderColor={BORDER_COLOR}
              direction={isRTL ? "row-reverse" : "row"}
            >
              <Button
                flex={1}
                size="sm"
                variant="outline"
                color={TEXT_PRIMARY}
                borderColor={BORDER_COLOR}
                _hover={{ bg: "whiteAlpha.100" }}
                onClick={() => {
                  resetDraft();
                  onClose();
                }}
              >
                {t.cancel}
              </Button>
              <Button
                flex={1}
                size="sm"
                variant="outline"
                color="red.400"
                borderColor="red.400"
                _hover={{ bg: "red.900/30" }}
                onClick={handleReset}
              >
                <LuRotateCcw
                  size={14}
                  style={{ marginInlineEnd: "6px" }}
                />
                {t.reset}
              </Button>
              <Button
                flex={1}
                size="sm"
                bg="yellow.500"
                color="gray.900"
                _hover={{ bg: "yellow.400" }}
                fontWeight="600"
                onClick={handleSave}
              >
                {t.save}
              </Button>
            </Flex>
          </MotionBox>
        </>
      )}
    </AnimatePresence>
  );
}
