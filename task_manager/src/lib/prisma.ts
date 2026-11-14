// src/lib/prisma.ts
import "dotenv/config";

// Принудительно очищаем системные переменные PG*, чтобы они не перебивали наш .env
delete process.env.PGUSER;
delete process.env.PGPASSWORD;
delete process.env.PGHOST;
delete process.env.PGPORT;
delete process.env.PGDATABASE;

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const prismaClientSingleton = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }

  // ВАЖНО: DATABASE_URL (с паролем) нигде не логируем.
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  const adapter = new PrismaPg(pool);

  return new PrismaClient({ adapter });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
