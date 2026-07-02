import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const connectionParams = process.env.NODE_ENV === 'production'
  ? '&connection_limit=5&pool_timeout=15&connect_timeout=15&socket_timeout=30'
  : '&connection_limit=3&pool_timeout=10&connect_timeout=10';

export const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasourceUrl: process.env.DATABASE_URL + connectionParams,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
