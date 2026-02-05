import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  // Check if news already exists
  const existing = await db.newsTicker.count();
  if (existing > 0) {
    console.log(`ℹ️ News ticker already has ${existing} items`);
    return;
  }

  await db.newsTicker.createMany({
    data: [
      {
        textAr: "🎉 مرحباً بكم في أكاديمية تبيان - منصتكم للتعلم الإسلامي الأصيل",
        textEn: "🎉 Welcome to Tibyan Academy - Your platform for authentic Islamic learning",
        isActive: true,
        priority: 10,
      },
      {
        textAr: "📚 دورة جديدة: القراءة العربية بطريقة الرشيدي - سجل الآن!",
        textEn: "📚 New Course: Arabic Reading with Al-Rashidi Method - Register Now!",
        link: "/programs/arabic-reading-al-rashidi",
        isActive: true,
        priority: 8,
      },
      {
        textAr: "🌟 انضم إلى مجتمعنا المتنامي من أكثر من 5000 طالب حول العالم",
        textEn: "🌟 Join our growing community of over 5000 students worldwide",
        isActive: true,
        priority: 5,
      },
    ],
  });

  console.log("✅ News ticker items created!");
  const count = await db.newsTicker.count();
  console.log("Total news items:", count);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
