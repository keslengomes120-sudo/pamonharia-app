import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "path";

function resolveDbUrl(): string {
  const raw = process.env.DATABASE_URL ?? "file:./dev.db";
  if (raw.startsWith("file:./")) {
    const rel = raw.slice("file:./".length);
    return `file:${path.resolve(process.cwd(), rel)}`;
  }
  return raw;
}

function createDb() {
  const url = resolveDbUrl();
  const authToken = process.env.TURSO_AUTH_TOKEN;
  const adapter = new PrismaLibSql({ url, ...(authToken ? { authToken } : {}) });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const db = globalForPrisma.prisma || createDb();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export function isUniqueCodeError(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code: unknown }).code === "P2002";
}
