// prisma.config.ts
import { defineConfig } from "prisma/config";
import "dotenv/config"; // Импортируем загрузчик переменных из .env

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  datasource: {
    // Теперь Prisma берет адрес и сложный пароль прямо из вашего файла .env
    url: process.env.DATABASE_URL,
  },
});