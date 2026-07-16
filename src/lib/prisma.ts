import { PrismaClient } from "@prisma/client";

/**
 * Singleton de PrismaClient (evita múltiples conexiones en hot-reload).
 * Usa DATABASE_URL → Postgres local (Docker) o Neon/Supabase/Railway.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
