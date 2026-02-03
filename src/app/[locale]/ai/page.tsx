"use client";

import { useLocale } from "next-intl";
import AIChatPage from "@/components/ai/AIChatPage";

export default function AIPage() {
  const locale = useLocale() as "ar" | "en";

  return <AIChatPage locale={locale} />;
}
