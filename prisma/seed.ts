import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { allCourses, teachers } from "../src/content/courses.ar";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@tibyan.academy" },
    update: {},
    create: {
      email: "admin@tibyan.academy",
      name: "مدير النظام",
      password: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
      bio: "مدير منصة تبيان التعليمية",
    },
  });

  // Create instructors from real teachers data
  const instructorPassword = await bcrypt.hash("instructor123", 10);
  const instructorUsers = [];
  
  for (let i = 0; i < 5; i++) {
    const teacher = teachers[i];
    const instructor = await prisma.user.upsert({
      where: { email: `${teacher.id}@tibyan.academy` },
      update: {},
      create: {
        email: `${teacher.id}@tibyan.academy`,
        name: teacher.name,
        password: instructorPassword,
        role: "INSTRUCTOR",
        status: "ACTIVE",
        bio: `معلم في معهد تبيان - ${teacher.specialization || 'العلوم الشرعية'}`,
      },
    });
    instructorUsers.push(instructor);
  }

  // Create students
  const studentPassword = await bcrypt.hash("student123", 10);
  const students = [];
  for (let i = 1; i <= 5; i++) {
    const student = await prisma.user.upsert({
      where: { email: `student${i}@example.com` },
      update: {},
      create: {
        email: `student${i}@example.com`,
        name: `طالب ${i}`,
        password: studentPassword,
        role: "STUDENT",
        status: "ACTIVE",
      },
    });
    students.push(student);
  }

  // Create courses using real educational content
  const courseRecords = [];
  
  // Preparatory Year
  const course1 = await prisma.course.upsert({
    where: { slug: allCourses[0].slug },
    update: {},
    create: {
      title: allCourses[0].name,
      slug: allCourses[0].slug,
      description: allCourses[0].description,
      status: "PUBLISHED",
      price: allCourses[0].price,
      duration: allCourses[0].totalSessions * 60, // in minutes
      level: "BEGINNER",
      instructorId: instructorUsers[0].id,
      publishedAt: new Date(),
    },
  });
  courseRecords.push(course1);

  // Shariah First Year
  const course2 = await prisma.course.upsert({
    where: { slug: allCourses[1].slug },
    update: {},
    create: {
      title: allCourses[1].name,
      slug: allCourses[1].slug,
      description: allCourses[1].description,
      status: "PUBLISHED",
      price: allCourses[1].price,
      duration: allCourses[1].totalSessions * 60,
      level: "INTERMEDIATE",
      instructorId: instructorUsers[1].id,
      publishedAt: new Date(),
    },
  });
  courseRecords.push(course2);

  // Shariah Second Year
  const course3 = await prisma.course.upsert({
    where: { slug: allCourses[2].slug },
    update: {},
    create: {
      title: allCourses[2].name,
      slug: allCourses[2].slug,
      description: allCourses[2].description,
      status: "PUBLISHED",
      price: allCourses[2].price,
      duration: allCourses[2].totalSessions * 60,
      level: "ADVANCED",
      instructorId: instructorUsers[2].id,
      publishedAt: new Date(),
    },
  });
  courseRecords.push(course3);

  // Shariah Third Year
  const course4 = await prisma.course.upsert({
    where: { slug: allCourses[3].slug },
    update: {},
    create: {
      title: allCourses[3].name,
      slug: allCourses[3].slug,
      description: allCourses[3].description,
      status: "PUBLISHED",
      price: allCourses[3].price,
      duration: allCourses[3].totalSessions * 60,
      level: "ADVANCED",
      instructorId: instructorUsers[3].id,
      publishedAt: new Date(),
    },
  });
  courseRecords.push(course4);

  // Arabic Reading Program
  const course5 = await prisma.course.upsert({
    where: { slug: allCourses[4].slug },
    update: {},
    create: {
      title: allCourses[4].name,
      slug: allCourses[4].slug,
      description: allCourses[4].description,
      status: "REVIEW",
      price: allCourses[4].price,
      duration: allCourses[4].totalSessions * 60,
      level: "BEGINNER",
      instructorId: instructorUsers[4].id,
    },
  });
  courseRecords.push(course5);

  // Create lessons for preparatory course
  await prisma.lesson.createMany({
    data: allCourses[0].subjects.slice(0, 8).map((subject, index) => ({
      title: subject.split(' - ')[0],
      description: subject,
      content: `محتوى تفصيلي لموضوع: ${subject}`,
      order: index + 1,
      duration: 120, // 2 hours per lesson
      courseId: course1.id,
    })),
  });

  // Create enrollments
  for (const student of students.slice(0, 3)) {
    await prisma.enrollment.create({
      data: {
        userId: student.id,
        courseId: course1.id,
        status: "ACTIVE",
        progress: Math.floor(Math.random() * 100),
      },
    });
  }

  // Create reviews
  await prisma.review.create({
    data: {
      userId: students[0].id,
      courseId: course1.id,
      rating: 5,
      comment: "برنامج ممتاز! السنة التمهيدية أعطتني أساساً قوياً في العلوم الشرعية",
    },
  });

  await prisma.review.create({
    data: {
      userId: students[1].id,
      courseId: course1.id,
      rating: 5,
      comment: "المنهج متكامل والمدرسون متمكنون، أنصح به بشدة",
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log({
    admin,
    instructors: instructorUsers.length,
    students: students.length,
    courses: courseRecords.length,
  });
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
