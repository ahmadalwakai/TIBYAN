export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: 'Tibyan Academy',
    url: 'https://www.ti-by-an.com',
    areaServed: 'DE',
    availableLanguage: ['de', 'ar', 'en'],
    sameAs: [],
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: 'https://www.ti-by-an.com',
    name: 'Tibyan Academy',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://www.ti-by-an.com/courses?search={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function courseJsonLd(course: {
  name: string;
  description: string;
  slug: string;
  level?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: course.description,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'Tibyan Academy',
      url: 'https://www.ti-by-an.com',
    },
    inLanguage: ['ar', 'de'],
    audience: {
      '@type': 'EducationalAudience',
      audienceType: 'Children',
    },
    educationalLevel: course.level || undefined,
  };
}
