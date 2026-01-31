import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createWelcomePost() {
  // First, find an admin user
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, name: true },
  });

  console.log("Admin found:", admin);

  const authorId = admin?.id || "admin-placeholder";

  const post = await prisma.post.create({
    data: {
      title: "مرحباً بكم في مجتمع تبيان! 🎉",
      content: `<b>السلام عليكم ورحمة الله وبركاته</b>

أهلاً وسهلاً بكم في منصة تبيان التعليمية!

يسعدنا أن نرحب بكم في مجتمعنا التعليمي المميز. نحن هنا لنقدم لكم أفضل المحتويات التعليمية في مختلف المجالات.

<b>ما الذي ستجدونه في تبيان؟</b>
• دورات تعليمية متنوعة بجودة عالية
• معلمون متميزون ذوو خبرة
• شهادات معتمدة عند إتمام الدورات
• مجتمع تفاعلي للتعلم والمشاركة

نتمنى لكم رحلة تعليمية ممتعة ومثمرة! 📚✨

مع أطيب التحيات،
<b>أ. أحمد</b>
إدارة تبيان`,
      excerpt:
        "مرحباً بكم في منصة تبيان التعليمية! نتمنى لكم رحلة تعليمية ممتعة ومثمرة.",
      styling: {
        fontFamily: "inherit",
        fontSize: "lg",
        fontColor: "#1a1a1a",
        textAlign: "right",
      },
      authorId: authorId,
      authorType: "ADMIN",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      isPinned: true,
      allowComments: true,
      allowLikes: true,
      publishedAt: new Date(),
    },
  });

  console.log("✅ Welcome post created successfully!");
  console.log("Post ID:", post.id);
  console.log("Title:", post.title);
}

createWelcomePost()
  .catch((e) => console.error("Error:", e))
  .finally(() => prisma.$disconnect());
