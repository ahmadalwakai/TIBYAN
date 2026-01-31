import { PrismaClient } from '@prisma/client';

// Force Node.js runtime for Prisma (not Edge)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  // Use DIRECT_DATABASE_URL if available (bypasses Vercel's proxy), otherwise DATABASE_URL
  const databaseUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
};

// Use global instance to prevent multiple connections in development
export const db = globalForPrisma.prisma ?? createPrismaClient();

// Alias for convenience
export const prisma = db;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

