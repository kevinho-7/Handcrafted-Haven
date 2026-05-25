import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { // ensures we only have one instance of PrismaClient in development to prevent exhausting database connections
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
