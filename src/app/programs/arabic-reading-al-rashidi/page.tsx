import type { Metadata } from "next";
import ArabicReadingClient from "./ArabicReadingClient";

export const metadata: Metadata = {
  title: "برنامج تعليم القراءة العربية – المنهج الرشيدي | أكاديمية تبيان",
  description:
    "برنامج متكامل لتعليم القراءة العربية بطريقة المنهج الرشيدي. 36 حصة تعليمية عبر زوم تشمل الحروف والحركات والمدود والقراءة المتصلة. Arabic Reading Program using Al-Rashidi Method at Tibyan Academy.",
  keywords: [
    "تعليم القراءة العربية",
    "المنهج الرشيدي",
    "Arabic reading",
    "Al-Rashidi method",
    "تبيان",
    "Tibyan Academy",
  ],
  openGraph: {
    title: "برنامج تعليم القراءة العربية – المنهج الرشيدي",
    description: "36 حصة لتعلم القراءة العربية بطريقة المنهج الرشيدي عبر زوم",
    type: "website",
  },
};

export default function ArabicReadingAlRashidiPage() {
  return <ArabicReadingClient />;
}
