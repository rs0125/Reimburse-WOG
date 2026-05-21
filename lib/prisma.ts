import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [
            { level: "query", emit: "event" },
            { level: "warn", emit: "stdout" },
            { level: "error", emit: "stdout" },
          ]
        : [{ level: "error", emit: "stdout" }],
  });

if (process.env.NODE_ENV === "development") {
  // @ts-expect-error - event listener typing varies by Prisma version
  prisma.$on("query", (e: { duration: number; query: string }) => {
    const sql = e.query.length > 140 ? e.query.slice(0, 140) + "…" : e.query;
    console.log(`[prisma ${e.duration}ms] ${sql}`);
  });
}

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
