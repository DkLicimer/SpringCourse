// src/app/app/protocols/page.tsx
import React from "react";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProtocolsClient } from "./ProtocolsClient";

export default async function ProtocolsPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  const protocols = await prisma.meetingProtocol.findMany({
    orderBy: { meetingDate: "desc" },
    include: {
      chairman: { select: { id: true, name: true, initials: true } },
      secretary: { select: { id: true, name: true, initials: true } },
      attendees: { select: { id: true, name: true, initials: true } },
      tasks: { select: { id: true, title: true } },
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ProtocolsClient
        initialProtocols={JSON.parse(JSON.stringify(protocols))}
        isAdmin={isAdmin}
        currentUserId={session.user.id}
      />
    </div>
  );
}