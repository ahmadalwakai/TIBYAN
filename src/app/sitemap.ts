import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://tibyan.com";

  // Static pages
  const staticPages = [
    "",
    "/courses",
    "/programs",
    "/instructors",
    "/pricing",
    "/help",
    "/faq",
    "/blog",
    "/about",
    "/assessment",
    "/auth/login",
    "/auth/register",
    "/legal/terms",
    "/legal/privacy",
    "/legal/content",
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : route.startsWith("/courses") ? 0.9 : 0.7,
  }));

  return staticRoutes;
}
