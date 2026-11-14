// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// ---------------------------------------------------------------------------
// Защита от перебора паролей.
// Счётчик хранится в памяти процесса — приложение должно работать в ОДНОМ
// процессе (так настроен pm2 в ecosystem.config.js).
// Считаются только НЕУДАЧНЫЕ попытки. IP берётся из заголовка, который
// перезаписывает nginx (клиент подделать его не может).
// ---------------------------------------------------------------------------
const WINDOW_MS = 15 * 60 * 1000; // окно 15 минут
const MAX_FAILS_PER_ACCOUNT_IP = 5; // неудач на пару «email + IP»
const MAX_FAILS_PER_IP = 40; // неудач с одного IP (общий IP офиса — лимит большой)

type Bucket = { fails: number; first: number };
const buckets = new Map<string, Bucket>();

function isLocked(key: string, max: number): boolean {
  const b = buckets.get(key);
  if (!b) return false;
  if (Date.now() - b.first > WINDOW_MS) {
    buckets.delete(key);
    return false;
  }
  return b.fails >= max;
}

function registerFail(key: string) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.first > WINDOW_MS) {
    buckets.set(key, { fails: 1, first: now });
  } else {
    b.fails += 1;
  }
  // чистим память, если накопилось много записей
  if (buckets.size > 10000) {
    for (const [k, v] of buckets) {
      if (now - v.first > WINDOW_MS) buckets.delete(k);
    }
  }
}

function getIp(req: any): string {
  const h = req?.headers ?? {};
  const raw = h["x-real-ip"] ?? h["x-forwarded-for"] ?? "";
  return String(Array.isArray(raw) ? raw[0] : raw).split(",")[0].trim() || "unknown";
}

// Фиктивный хеш: bcrypt выполняется всегда, даже если email не найден,
// чтобы по времени ответа нельзя было узнать, какие email существуют.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", 10);

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 12 * 60 * 60, // сессия живёт 12 часов
  },
  jwt: {
    maxAge: 12 * 60 * 60,
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Заполните все поля");
        }

        const email = credentials.email.trim().toLowerCase();
        const password = credentials.password;

        // защита от слишком длинных значений (bcrypt / лишняя нагрузка)
        if (email.length > 254 || password.length > 200) return null;

        const ip = getIp(req);
        const accountKey = `acc:${email}|${ip}`;
        const ipKey = `ip:${ip}`;

        if (
          isLocked(accountKey, MAX_FAILS_PER_ACCOUNT_IP) ||
          isLocked(ipKey, MAX_FAILS_PER_IP)
        ) {
          return null;
        }

        try {
          // регистронезависимый поиск: подходят и старые записи с заглавными буквами
          const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
          });

          const isPasswordValid = await bcrypt.compare(
            password,
            user ? user.passwordHash : DUMMY_HASH
          );

          if (!user || !isPasswordValid) {
            registerFail(accountKey);
            registerFail(ipKey);
            return null;
          }

          buckets.delete(accountKey);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            initials: user.initials,
          };
        } catch (error: any) {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // СТРОГИЙ РЕДИРЕКТ НА ДОМЕН БЕЗ ПОРТА 3000
    async redirect({ url, baseUrl }) {
      const cleanBaseUrl = process.env.NEXTAUTH_URL || baseUrl;
      if (url.startsWith("/")) {
        return `${cleanBaseUrl}${url}`;
      }
      try {
        const parsedUrl = new URL(url);
        const parsedBase = new URL(cleanBaseUrl);
        if (parsedUrl.hostname === parsedBase.hostname) {
          return `${cleanBaseUrl}${parsedUrl.pathname}${parsedUrl.search}`;
        }
      } catch (e) {
        // Игнорируем ошибки парсинга
      }
      return cleanBaseUrl;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.initials = user.initials;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.initials = token.initials;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
