import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import LiveChatFab from "@/components/layout/LiveChatFab";
import WhatsAppFab from "@/components/layout/WhatsAppFab";
import Providers from "./providers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { getLocale } from "@/i18n/actions";
import { isRtlLocale } from "@/i18n/config";
import "./globals.css";

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-ibm-plex",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Tibyan | تبيان - Islamic Learning Platform",
    template: "%s | Tibyan",
  },
  description:
    "Tibyan (تبيان) is a comprehensive Islamic learning platform offering courses in Quran, Arabic, and Islamic sciences taught by elite specialized instructors.",
  keywords: [
    "Islamic education",
    "Quran learning",
    "Arabic courses",
    "Islamic sciences",
    "تبيان",
    "تعليم إسلامي",
    "تعلم القرآن",
    "دورات عربية",
  ],
  authors: [{ name: "Tibyan" }],
  creator: "Tibyan",
  publisher: "Tibyan",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    alternateLocale: ["en_US", "de_DE", "fr_FR", "es_ES", "sv_SE", "tr_TR"],
    url: "https://tibyan.com",
    siteName: "Tibyan",
    title: "Tibyan | تبيان - Islamic Learning Platform",
    description:
      "Comprehensive Islamic learning platform with elite instructors",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tibyan | تبيان",
    description:
      "Comprehensive Islamic learning platform with elite instructors",
  },
  alternates: {
    canonical: "https://tibyan.com",
  },
  metadataBase: new URL("https://tibyan.com"),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  const isRtl = isRtlLocale(locale);

  return (
    <html
      lang={locale}
      dir={isRtl ? "rtl" : "ltr"}
      className={`${ibmPlexArabic.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>
            <Header />
            {children}
            <Footer />
            <LiveChatFab />
            <WhatsAppFab />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
