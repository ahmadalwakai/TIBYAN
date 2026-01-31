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
  price?: number;
  currency?: string;
  duration?: string;
  totalSessions?: number;
  subjects?: string[];
}) {
  const baseUrl = 'https://www.ti-by-an.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.name,
    description: course.description,
    url: `${baseUrl}/programs/${course.slug}`,
    provider: {
      '@type': 'EducationalOrganization',
      name: 'Tibyan Academy',
      alternateName: 'معهد تبيان',
      url: baseUrl,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'DE',
      },
    },
    inLanguage: ['ar', 'de', 'en'],
    audience: {
      '@type': 'EducationalAudience',
      audienceType: 'Children and Adults',
    },
    educationalLevel: course.level || undefined,
    courseMode: 'online',
    timeRequired: course.duration || undefined,
    numberOfCredits: course.totalSessions || undefined,
    ...(course.price && course.currency && {
      offers: {
        '@type': 'Offer',
        price: course.price,
        priceCurrency: course.currency,
        availability: 'https://schema.org/InStock',
        url: `${baseUrl}/checkout/${course.slug}`,
      },
    }),
    ...(course.subjects && course.subjects.length > 0 && {
      about: course.subjects.map((subject) => ({
        '@type': 'Thing',
        name: subject,
      })),
    }),
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      courseWorkload: course.duration || 'PT7M',
    },
  };
}
