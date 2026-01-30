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
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld";
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
  metadataBase: new URL("https://www.ti-by-an.com"),
  title: {
    default: "Tibyan Academy | معهد تبيان - Islamic Learning for Arab Children in Germany",
    template: "%s | Tibyan Academy",
  },
  description:
    "Online Islamic and Arabic educational platform for Syrian and Arab children in Germany. Comprehensive courses in Quran, Arabic language, and Islamic sciences taught by specialized instructors.",
  keywords: [
    "Islamic education Germany",
    "Arabic courses for children",
    "Quran learning online",
    "Syrian teachers Germany",
    "Arab children education",
    "تعليم إسلامي ألمانيا",
    "معهد تبيان",
    "Islamische Bildung Deutschland",
    "Arabisch Kinder",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    url: "https://www.ti-by-an.com",
    siteName: "Tibyan Academy",
    title: "Tibyan Academy | معهد تبيان - Islamic Learning for Arab Children",
    description:
      "Online Islamic and Arabic education platform for Syrian and Arab children in Germany with professional specialized instructors.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Tibyan Academy | معهد تبيان",
    description:
      "Islamic and Arabic education for Arab children in Germany",
  },
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
      <head>
        {/* Organization & Website Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }}
        />
      </head>
      <body>
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
