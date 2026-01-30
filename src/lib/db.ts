import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Temporarily disabled - configure DATABASE_URL in .env to enable
export const db = globalForPrisma.prisma ?? {} as PrismaClient;

// When database is ready, use:
// export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
