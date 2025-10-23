import pkg from '@prisma/client';
import { env, isProduction } from './env';

const { PrismaClient } = pkg;
type PrismaClientType = InstanceType<typeof PrismaClient>;

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClientType | undefined;
}

const prismaClient =
  globalThis.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
    log: isProduction ? ['error'] : ['error', 'warn'],
  });

if (!isProduction) {
  globalThis.prisma = prismaClient;
}

export const db = prismaClient;
