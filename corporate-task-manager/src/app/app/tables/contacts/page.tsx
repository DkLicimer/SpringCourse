// src/app/app/tables/contacts/page.tsx
import React from "react";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ContactsClient } from "./ContactsClient";

export default async function ContactsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  // Загружаем все контакты компании из БД (сортируем по имени)
  const contacts = await prisma.contact.findMany({
    orderBy: { fullName: "asc" },
  });

  const isAdmin = session.user.role === "ADMIN";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ContactsClient 
        initialContacts={JSON.parse(JSON.stringify(contacts))} 
        isAdmin={isAdmin} 
      />
    </div>
  );
}