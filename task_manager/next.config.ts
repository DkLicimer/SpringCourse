// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Исключаем Prisma и pg из компиляции Turbopack
  serverExternalPackages: ["@prisma/client", "pg"],
};

export default nextConfig;