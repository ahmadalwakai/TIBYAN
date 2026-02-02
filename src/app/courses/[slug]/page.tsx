import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { allCourses } from "@/content/courses.ar";
import { courseJsonLd } from "@/lib/seo/jsonld";
import CoursePageClient from "./CoursePageClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const course = allCourses.find((c) => c.slug === slug);

  if (!course) {
    return {};
  }

  return {
    title: course.name,
    description: course.description,
    openGraph: {
      title: course.name,
      description: course.description,
      type: "website",
    },
  };
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const course = allCourses.find((c) => c.slug === slug);

  if (!course) {
    notFound();
  }

  return (
    <>
      {/* Course Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            courseJsonLd({
              name: course.name,
              description: course.description,
              level: course.level,
              slug: course.slug,
            })
          ),
        }}
      />
      <CoursePageClient course={course} />
    </>
  );
}
