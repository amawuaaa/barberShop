import { copyFileSync, existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

/**
 * En Vercel el filesystem es de solo lectura excepto /tmp.
 * Copiamos la DB seedeada en build a /tmp para poder leer/escribir en runtime.
 */
function resolveDatabaseUrl(): string | undefined {
  if (process.env.VERCEL) {
    const source = path.join(process.cwd(), "prisma", "deploy.db");
    const target = "/tmp/sigmabarber.db";

    if (existsSync(source) && !existsSync(target)) {
      copyFileSync(source, target);
    }

    return `file:${target}`;
  }

  return process.env.DATABASE_URL;
}

const databaseUrl = resolveDatabaseUrl();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(databaseUrl
      ? {
          datasources: {
            db: { url: databaseUrl },
          },
        }
      : {}),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
