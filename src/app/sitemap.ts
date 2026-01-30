import { MetadataRoute } from "next";
import { allCourses } from "@/content/courses.ar";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.ti-by-an.com";

  const staticPages = [
    "",
    "/about",
    "/courses",
    "/programs",
    "/instructors",
    "/instructors/apply",
    "/pricing",
    "/help",
    "/faq",
    "/legal/terms",
    "/legal/privacy",
    "/legal/content",
  ];

  const staticRoutes: MetadataRoute.Sitemap = staticPages.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));

  const courseRoutes: MetadataRoute.Sitemap = allCourses.map((course) => ({
    url: `${baseUrl}/courses/${course.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...courseRoutes];
}
