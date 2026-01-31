/**
 * Centralized Arabic educational content for Tibyan Academy
 * This file contains all real course data, pricing, and teacher information
 */

export interface CourseLevel {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  duration: string;
  totalSessions: number;
  monthlyPayment: number;
  subjects: string[];
  objectives: string[];
  level: 'تمهيدي' | 'شرعي أول' | 'شرعي ثاني' | 'شرعي ثالث' | 'قراءة';
}

export interface Teacher {
  id: string;
  name: string;
  specialization?: string;
  credentials?: string;
  experience?: string;
}

// ===============================
// EDUCATIONAL LEVELS
// ===============================

export const preparatoryLevel: CourseLevel = {
  id: 'preparatory',
  name: 'السنة التمهيدية',
  slug: 'preparatory-year',
  description: 'السنة التمهيدية لدى معهد تبيان الإفتراضي، تهدف لإعداد المتعلم نفسياً ومعرفياً ومهارياً وعلمياً لانطلاق مسيرته الطويلة في طلب العلم.',
  price: 400,
  currency: 'EUR',
  duration: '٨ شهور',
  totalSessions: 160,
  monthlyPayment: 50,
  level: 'تمهيدي',
  subjects: [
    'التفسير الموضوعي - بواسطة دراسة أشهر سور القرآن الكريم بمنهجية مبتكرة تسمى التفسير الموضوعي، لتبيان أكبر عدد من أحكام وعلوم القرآن مع إبراز أساليب القرآن الكريم في المعاني والبلاغة والقصص.',
    'مصطلح الحديث - يشتمل المقرر الأول في مصطلح الحديث، على تعريف الحديث وأقسامه، مع تدريبات على آلية دراسة ومعرفة الأحاديث.',
    'علم التجويد - أحكام علم التجويد من الأحكام الأساسية في القرآن الكريم، والذي يجب على كل مسلم أن يتعلمه. يدرس خلال هذه السنة بشكل أحكام القراءة.',
    'العقيدة - الجزء الأول من منهاج العقيدة، ويشتمل على أصول العلم والمعرفة، وعلى أحكام وأدلة التوحيد بشكل نظري وعملي.',
    'الفقه - مبادئ علم الفقه، معرفة مباحث الحكم الشرعي، والإجماع والاختلاف والمصالح المرسلة وغيرها من المباحث. ودراسة فقه العبادات بشكل نظري تطبيقي.',
    'أصول الفقه - دراسة مبادئ أصول الفقه، وفيه يدرس مباحث في علم اللغة ومباحث الأدلة ومباحث في الأحكام.',
    'البلاغة - دراسة علم البلاغة بأقسامها: البيان، المعاني، البديع، بمنهجية وطريقة سهلة وواضحة، مع التدريب على مهارة الفهم للمفردات والأساليب البلاغية.',
    'النحو والصرف - يشتمل الجزء الأول من النحو على علامات الاعراب، ودراسة جميع مباحث المرفوعات، والمنصوبات، والمجرورات، والمجزومات، إضافة لمباحث مختارة في علم الصرف.'
  ],
  objectives: [
    'زيادة المعرفة الشرعية: توسيع معرفة المتعلم بكتاب الله وسنة نبيه محمد صلى الله عليه وسلم.',
    'بناء منهجية التعلم: اكتساب مهارات البحث والتحليل التي تعينه على اتقان المسيرة التعليمية فيما بعد.',
    'تطوير الخشوع الروحي: تنمية العمق الروحي للمتعلم من خلال الروابط العلمية بأدلة القرآن والسنة.',
    'تطوير المهارات اللغوية: تحسين اللغة العربية للمتعلم بشكل يمكنه من فهم النصوص الشرعية بشكل دقيق، من خلال دراسة علمي النحو والبلاغة.'
  ]
};

export const shariahFirstYear: CourseLevel = {
  id: 'shariah-1',
  name: 'الشرعي الأول',
  slug: 'shariah-first-year',
  description: 'السنة الأولى من المسار الشرعي، تركز على بناء الأساسيات العلمية والمعرفية في العلوم الإسلامية.',
  price: 450,
  currency: 'EUR',
  duration: '٧ شهور',
  totalSessions: 112,
  monthlyPayment: 65,
  level: 'شرعي أول',
  subjects: [
    'التفسير التحليلي',
    'مصطلح الحديث المتقدم',
    'العقيدة الإسلامية المتقدمة',
    'الفقه المقارن',
    'أصول الفقه المتقدم',
    'البلاغة التطبيقية',
    'النحو والصرف المتقدم'
  ],
  objectives: [
    'تعميق الفهم الشرعي',
    'إتقان المنهجية العلمية',
    'تطوير مهارات التحليل والاستنباط',
    'بناء القدرة على الاجتهاد'
  ]
};

export const shariahSecondYear: CourseLevel = {
  id: 'shariah-2',
  name: 'الشرعي الثاني',
  slug: 'shariah-second-year',
  description: 'السنة الثانية من المسار الشرعي، تتقدم في العلوم الشرعية والفقهية.',
  price: 500,
  currency: 'EUR',
  duration: '٧ شهور',
  totalSessions: 112,
  monthlyPayment: 72,
  level: 'شرعي ثاني',
  subjects: [
    'التفسير الموضوعي المتقدم',
    'دراسات حديثية متخصصة',
    'العقيدة والفرق',
    'الفقه المقارن المتقدم',
    'أصول الفقه والقواعد الفقهية',
    'البلاغة القرآنية',
    'النحو التطبيقي'
  ],
  objectives: [
    'التخصص في مجالات محددة',
    'القدرة على البحث والتأليف',
    'فهم الاختلافات الفقهية',
    'إتقان الأدلة والترجيح'
  ]
};

export const shariahThirdYear: CourseLevel = {
  id: 'shariah-3',
  name: 'الشرعي الثالث',
  slug: 'shariah-third-year',
  description: 'السنة الثالثة والأخيرة من المسار الشرعي، تمثل قمة التخصص والإتقان.',
  price: 550,
  currency: 'EUR',
  duration: '٦ شهور',
  totalSessions: 96,
  monthlyPayment: 75,
  level: 'شرعي ثالث',
  subjects: [
    'التفسير التحليلي المتقدم',
    'علوم الحديث المتقدمة',
    'العقيدة والمذاهب الفكرية',
    'الفقه التطبيقي والنوازل',
    'أصول الفقه والاجتهاد',
    'البلاغة والإعجاز',
    'اللغة العربية المتقدمة'
  ],
  objectives: [
    'الوصول لمستوى الاجتهاد',
    'القدرة على الإفتاء في النوازل',
    'التأليف والبحث العلمي',
    'التدريس ونقل العلم'
  ]
};

// ===============================
// ARABIC READING PROGRAM
// ===============================

export const arabicReadingProgram: CourseLevel = {
  id: 'arabic-reading',
  name: 'برنامج القراءة العربية',
  slug: 'arabic-reading-program',
  description: 'برنامج القراءة العربية هو أحد البرامج التي يقدمها معهد تبيان الافتراضي، يمتاز بتعليم اللغة العربية الفصحى بطريقة ممنهجة ومتدرجة، انطلاقاً من معرفة الأحرف مروراً بحركات المد والسكون والشدة والتنوين، وصولاً إلى الطلاقة والإتقان في القراءة. حيث يقدم المعهد محتوى تفاعلي ممنهج لجميع الأعمار والمستويات.\n\n• المدة : ٧ شهور\n• عدد الجلسات : ١١٢ جلسة\n• متوسط الدفع الشهري : €٦٥',
  price: 455,
  currency: 'EUR',
  duration: '٧ شهور',
  totalSessions: 112,
  monthlyPayment: 65,
  level: 'قراءة',
  subjects: [
    'تعليم الحروف الأبجدية',
    'الحركات والسكون',
    'حروف المد',
    'التنوين والشدة',
    'القراءة التطبيقية',
    'الطلاقة في القراءة'
  ],
  objectives: [
    'إتقان قراءة اللغة العربية الفصحى',
    'القدرة على قراءة القرآن الكريم بشكل صحيح',
    'بناء أساس متين للعلوم الشرعية',
    'تطوير مهارات القراءة والفهم'
  ]
};

// ===============================
// SPECIALIZED PROGRAMS & CERTIFICATES
// ===============================

export const strategicAnalysisCertificate: CourseLevel = {
  id: 'strategic-analysis',
  name: 'شهادة التحليل الاستراتيجي',
  slug: 'strategic-analysis',
  description: 'برنامج مكثف لتطوير مهارات التحليل وصناعة القرار، مصمم لتأهيل القادة والمتخصصين في مجالات التخطيط والإدارة الاستراتيجية.',
  price: 290,
  currency: 'EUR',
  duration: '12 أسبوعًا',
  totalSessions: 48,
  monthlyPayment: 97,
  level: 'تمهيدي',
  subjects: [
    'أسس التحليل الاستراتيجي',
    'منهجيات صناعة القرار',
    'التخطيط الاستراتيجي',
    'تحليل البيئة الداخلية والخارجية',
    'أدوات التحليل الحديثة',
    'دراسات حالة تطبيقية'
  ],
  objectives: [
    'إتقان مهارات التحليل الاستراتيجي',
    'تطوير القدرة على صناعة القرار الرشيد',
    'فهم منهجيات التخطيط المتقدمة',
    'القدرة على تحليل المشكلات المعقدة'
  ]
};

export const islamicResearcherProgram: CourseLevel = {
  id: 'islamic-researcher',
  name: 'برنامج إعداد الباحث الشرعي',
  slug: 'islamic-researcher',
  description: 'منهج متكامل لبناء المهارات البحثية والتأصيل الشرعي، يؤهل المتخرج للبحث العلمي في المجالات الشرعية.',
  price: 210,
  currency: 'EUR',
  duration: '10 أسابيع',
  totalSessions: 40,
  monthlyPayment: 84,
  level: 'تمهيدي',
  subjects: [
    'منهجية البحث الشرعي',
    'أصول التأصيل العلمي',
    'التوثيق والمراجع',
    'كتابة البحث الأكاديمي',
    'تحقيق المخطوطات',
    'النقد العلمي والتحليل'
  ],
  objectives: [
    'إتقان منهجية البحث الشرعي',
    'القدرة على التأصيل العلمي',
    'مهارات الكتابة الأكاديمية',
    'التعامل مع المصادر والمراجع'
  ]
};

export const educationalLeadershipDiploma: CourseLevel = {
  id: 'educational-leadership',
  name: 'دبلوم قيادة الفرق التعليمية',
  slug: 'educational-leadership',
  description: 'قيادة تعليمية عملية مع أدوات قياس الأثر، يؤهل المتخرج لقيادة الفرق التعليمية وإدارة المؤسسات التربوية.',
  price: 320,
  currency: 'EUR',
  duration: '14 أسبوعًا',
  totalSessions: 56,
  monthlyPayment: 91,
  level: 'تمهيدي',
  subjects: [
    'أسس القيادة التعليمية',
    'إدارة الفرق التعليمية',
    'قياس الأثر التعليمي',
    'تطوير المناهج والبرامج',
    'التقييم والمتابعة',
    'مهارات التواصل القيادي'
  ],
  objectives: [
    'إتقان مهارات القيادة التعليمية',
    'القدرة على إدارة الفرق بفعالية',
    'استخدام أدوات قياس الأثر',
    'تطوير البرامج التعليمية'
  ]
};

// ===============================
// ALL COURSES ARRAY
// ===============================

export const allCourses: CourseLevel[] = [
  preparatoryLevel,
  shariahFirstYear,
  shariahSecondYear,
  shariahThirdYear,
  arabicReadingProgram,
  strategicAnalysisCertificate,
  islamicResearcherProgram,
  educationalLeadershipDiploma
];

// ===============================
// TEACHERS
// ===============================

export const teachers: Teacher[] = [
  { 
    id: 't1', 
    name: 'د. محمد أيوب يحيى العلي', 
    specialization: 'التفسير وعلوم القرآن',
    credentials: 'دكتوراه في التفسير - جامعة الأزهر',
    experience: '+15 سنة خبرة في التدريس'
  },
  { 
    id: 't2', 
    name: 'أ. نسرين صالح الموسى', 
    specialization: 'اللغة العربية والنحو',
    credentials: 'ماجستير في اللغة العربية - جامعة دمشق',
    experience: '+10 سنوات خبرة'
  },
  { 
    id: 't3', 
    name: 'د. جهادية الخليف', 
    specialization: 'الفقه وأصوله',
    credentials: 'دكتوراه في الفقه - جامعة الإمام محمد بن سعود',
    experience: '+12 سنة خبرة'
  },
  { 
    id: 't4', 
    name: 'أ. هناء فوزي النوري', 
    specialization: 'العقيدة والسيرة النبوية',
    credentials: 'ماجستير في العقيدة - جامعة الشام',
    experience: '+8 سنوات خبرة'
  },
  { 
    id: 't5', 
    name: 'د. نور عطا الله جريص', 
    specialization: 'الحديث ومصطلحه',
    credentials: 'دكتوراه في علوم الحديث',
    experience: '+11 سنة خبرة'
  },
  { 
    id: 't6', 
    name: 'أ. بندر الناصر', 
    specialization: 'أصول الفقه',
    credentials: 'ماجستير في أصول الفقه',
    experience: '+7 سنوات خبرة'
  },
  { 
    id: 't7', 
    name: 'د. أحمد سلوم العمر', 
    specialization: 'البلاغة والأدب',
    credentials: 'دكتوراه في البلاغة العربية',
    experience: '+14 سنة خبرة'
  },
  { 
    id: 't8', 
    name: 'أ. خالد جاسم المحمد', 
    specialization: 'النحو والصرف',
    credentials: 'ماجستير في النحو والصرف',
    experience: '+9 سنوات خبرة'
  },
  { 
    id: 't9', 
    name: 'أ. خريف محمد اليونس', 
    specialization: 'التجويد والقراءات',
    credentials: 'إجازة في القراءات العشر',
    experience: '+13 سنة خبرة'
  },
  { 
    id: 't10', 
    name: 'أ. زينب ضياء الدين عايد', 
    specialization: 'التربية الإسلامية',
    credentials: 'ماجستير في التربية الإسلامية',
    experience: '+6 سنوات خبرة'
  },
  { 
    id: 't11', 
    name: 'أ. فاطمة هارون', 
    specialization: 'القرآن الكريم وتحفيظه',
    credentials: 'إجازة في حفظ القرآن الكريم',
    experience: '+10 سنوات خبرة'
  },
  { 
    id: 't12', 
    name: 'أ. ثراء هارون', 
    specialization: 'التفسير التربوي',
    credentials: 'بكالوريوس في الدراسات الإسلامية',
    experience: '+5 سنوات خبرة'
  }
];

// ===============================
// PRICING STRUCTURE
// ===============================

export const pricingPlans = {
  free: {
    name: 'الخطة المجانية',
    price: 0,
    currency: 'EUR',
    features: [
      'محتوى تعريفي محدود',
      'الوصول إلى المجتمع',
      'دروس تجريبية'
    ]
  },
  preparatory: {
    name: 'السنة التمهيدية',
    price: 50,
    priceUnit: 'شهرياً',
    totalPrice: 400,
    currency: 'EUR',
    duration: '٨ شهور',
    sessions: 160,
    features: preparatoryLevel.subjects
  },
  shariah1: {
    name: 'الشرعي الأول',
    price: 65,
    priceUnit: 'شهرياً',
    totalPrice: 450,
    currency: 'EUR',
    duration: '٧ شهور',
    sessions: 112,
    features: shariahFirstYear.subjects
  },
  shariah2: {
    name: 'الشرعي الثاني',
    price: 72,
    priceUnit: 'شهرياً',
    totalPrice: 500,
    currency: 'EUR',
    duration: '٧ شهور',
    sessions: 112,
    features: shariahSecondYear.subjects
  },
  shariah3: {
    name: 'الشرعي الثالث',
    price: 75,
    priceUnit: 'شهرياً',
    totalPrice: 550,
    currency: 'EUR',
    duration: '٦ شهور',
    sessions: 96,
    features: shariahThirdYear.subjects
  },
  arabicReading: {
    name: 'برنامج القراءة العربية',
    price: 65,
    priceUnit: 'شهرياً',
    totalPrice: 455,
    currency: 'EUR',
    duration: '٧ شهور',
    sessions: 112,
    features: arabicReadingProgram.subjects
  }
};

// ===============================
// HELPER FUNCTIONS
// ===============================

export function getCourseById(id: string): CourseLevel | undefined {
  return allCourses.find(course => course.id === id);
}

export function getCourseBySlug(slug: string): CourseLevel | undefined {
  return allCourses.find(course => course.slug === slug);
}

export function getTeacherById(id: string): Teacher | undefined {
  return teachers.find(teacher => teacher.id === id);
}
