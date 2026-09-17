// src/app/api/livekit/token/route.ts
import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const room = searchParams.get("room");

  if (!room) {
    return NextResponse.json({ error: "Missing room parameter" }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json(
      { error: "LiveKit credentials not configured in .env" },
      { status: 500 }
    );
  }

  try {
    // ⚡ Уникальный ID подключения (предотвращает конфликт при входе под одной учеткой с ПК и телефона)
    const connectionUniqueId = `${session.user.id}__${Math.random().toString(36).substring(2, 7)}`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity: connectionUniqueId,
      name: session.user.name || "Сотрудник",
      metadata: JSON.stringify({
        userId: session.user.id,
        name: session.user.name || "Сотрудник",
        role: session.user.role,
        initials: session.user.initials || "СО",
      }),
      ttl: "6h",
    });

    at.addGrant({
      room,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({ token });
  } catch (err: any) {
    console.error("Ошибка при генерации токена LiveKit:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}