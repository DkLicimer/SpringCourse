// prisma.config.ts
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  datasource: {
    // Прописываем строку подключения текстом напрямую сюда (без env),
    // чтобы Prisma CLI гарантированно прочитала её на Windows без конфликтов СУБД
    url: "postgresql://postgres:mysecretpassword@127.0.0.1:5433/task_manager_db?schema=public",
  },
});