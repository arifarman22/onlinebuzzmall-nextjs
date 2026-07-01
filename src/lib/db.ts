import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasourceUrl: process.env.DATABASE_URL + '&connection_limit=3&pool_timeout=10&connect_timeout=10',
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
