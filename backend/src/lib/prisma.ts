import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({});
} else {
  const globalWithPrisma = global as { prismaDb?: PrismaClient };
  if (!globalWithPrisma.prismaDb) {
    globalWithPrisma.prismaDb = new PrismaClient({});
  }
  prisma = globalWithPrisma.prismaDb;
}

export default prisma;
