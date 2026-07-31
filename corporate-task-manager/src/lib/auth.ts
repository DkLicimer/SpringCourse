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

        console.log("🔑 Попытка входа с email:", credentials.email);

        try {
          // Ищем пользователя в БД
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          if (!user) {
            console.log("❌ Ошибка авторизации: Пользователь с таким email не найден в БД");
            throw new Error("Пользователь не найден");
          }

          console.log("👤 Пользователь найден:", user.name);

          // Сравнение пароля
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            console.log("❌ Ошибка авторизации: Пароль не совпал с хешем в БД");
            throw new Error("Неверный пароль");
          }

          console.log("✅ Авторизация успешна для:", user.name);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            initials: user.initials,
          };
        } catch (error: any) {
          console.error("🚨 Исключение в процессе авторизации:", error.message || error);
          return null; // Возвращаем null, чтобы NextAuth вывел ошибку на клиенте
        }
      }
    })
  ],
  callbacks: {
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