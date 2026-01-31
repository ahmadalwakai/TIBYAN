import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
};

// Use global instance to prevent multiple connections in development
export const db = globalForPrisma.prisma ?? createPrismaClient();

// Alias for convenience
export const prisma = db;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

