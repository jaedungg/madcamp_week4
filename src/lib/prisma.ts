// lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'], // 필요 시 생략 가능
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
