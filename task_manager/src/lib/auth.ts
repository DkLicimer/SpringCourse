// src/lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Заполните все поля");
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            return null;
          }

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
      }
    })
  ],
  callbacks: {
    // ⚡ СТРОГИЙ РЕДИРЕКТ НА ДОМЕН БЕЗ ПОРТА 3000
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
    }
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};