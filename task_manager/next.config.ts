// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Исключаем Prisma и pg из компиляции Turbopack
  serverExternalPackages: ["@prisma/client", "pg"],
  // Не сообщаем версию фреймворка в заголовке X-Powered-By
  poweredByHeader: false,
};

export default nextConfig;
