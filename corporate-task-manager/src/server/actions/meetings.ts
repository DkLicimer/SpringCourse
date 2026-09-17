// src/server/actions/meetings.ts
"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

declare global {
  var activeMeetingRooms: Map<string, { startedById: string; startedByName: string; title: string; startedAt: number }> | undefined;
}

const activeRooms = globalThis.activeMeetingRooms ?? new Map();
if (process.env.NODE_ENV !== "production") {
  globalThis.activeMeetingRooms = activeRooms;
}

export async function checkMeetingRoomStatus(roomName: string) {
  const room = activeRooms.get(roomName);
  if (!room) {
    return { isActive: false };
  }
  return {
    isActive: true,
    startedByName: room.startedByName,
    title: room.title,
    startedAt: room.startedAt,
  };
}

export async function startMeetingRoom(roomName: string, title: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Только руководитель или администратор может запускать совещание");
  }

  activeRooms.set(roomName, {
    startedById: session.user.id,
    startedByName: session.user.name || "Руководитель",
    title,
    startedAt: Date.now(),
  });

  revalidatePath("/app/calendar");
  return { success: true };
}

export async function closeMeetingRoom(roomName: string) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Недостаточно прав для закрытия комнаты");
  }

  activeRooms.delete(roomName);
  revalidatePath("/app/calendar");
  return { success: true };
}