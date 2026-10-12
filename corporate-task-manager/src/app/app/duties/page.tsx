// src/app/app/duties/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { DutiesClient } from "./DutiesClient";

export default async function DutiesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      department: true,
      role: true,
      mainDuties: true,
      extraDuties: true,
      orderDuties: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <DutiesClient user={JSON.parse(JSON.stringify(user))} />
    </div>
  );
}