// src/app/api/livekit/diag/route.ts
import { NextResponse } from "next/server";
import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  const rawUrl = process.env.LIVEKIT_URL;
  const rawPublicUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const rawKey = process.env.LIVEKIT_API_KEY;
  const rawSecret = process.env.LIVEKIT_API_SECRET;

  const cleanKey = rawKey?.trim();
  const cleanSecret = rawSecret?.trim();
  const cleanUrl = rawUrl?.trim();

  const report: any = {
    auth: {
      isAuthorized: !!session,
      user: session?.user?.name || "Anonymous",
      userId: session?.user?.id || "none",
    },
    env: {
      LIVEKIT_URL: cleanUrl ? `${cleanUrl.slice(0, 15)}... (длина: ${cleanUrl.length})` : "ОТСУТСТВУЕТ",
      NEXT_PUBLIC_LIVEKIT_URL: rawPublicUrl ? `${rawPublicUrl.slice(0, 15)}...` : "ОТСУТСТВУЕТ",
      LIVEKIT_API_KEY: cleanKey ? `${cleanKey.slice(0, 4)}**** (длина: ${cleanKey.length})` : "ОТСУТСТВУЕТ",
      LIVEKIT_API_SECRET: cleanSecret ? `${cleanSecret.slice(0, 4)}**** (длина: ${cleanSecret.length})` : "ОТСУТСТВУЕТ",
      hasHiddenSpacesInKey: rawKey !== cleanKey,
      hasHiddenSpacesInSecret: rawSecret !== cleanSecret,
    },
    serverTime: {
      utcNow: new Date().toISOString(),
      timestampSeconds: Math.floor(Date.now() / 1000),
    },
    tests: {},
  };

  if (!cleanKey || !cleanSecret || !cleanUrl) {
    report.tests.summary = "❌ ОШИБКА: Не все переменные LiveKit заданы в .env!";
    return NextResponse.json(report, { status: 500 });
  }

  // 1. Тест прямого обращения к LiveKit Cloud через REST API
  try {
    const httpUrl = cleanUrl.replace("wss://", "https://").replace("ws://", "http://");
    const roomService = new RoomServiceClient(httpUrl, cleanKey, cleanSecret);
    const rooms = await roomService.listRooms();
    report.tests.livekitCloudRestApi = {
      status: "SUCCESS ✅",
      message: "Ключи API Key и Secret успешно приняты сервером LiveKit Cloud!",
      activeRoomsCount: rooms.length,
    };
  } catch (err: any) {
    report.tests.livekitCloudRestApi = {
      status: "FAILED ❌ (ОШИБКА АВТОРИЗАЦИИ В LIVEKIT CLOUD)",
      errorMessage: err.message || String(err),
      hint: "LiveKit Cloud отклонил пару Key/Secret. Проверьте, не пересоздавался ли ключ в панели cloud.livekit.io",
    };
  }

  // 2. Тест генерации JWT токена
  try {
    const identity = session?.user?.id || "test-user-id";
    const at = new AccessToken(cleanKey, cleanSecret, {
      identity,
      name: session?.user?.name || "Test User",
      ttl: "2h",
    });

    at.addGrant({
      room: "test-room",
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    const jwtToken = await at.toJwt();
    const parts = jwtToken.split(".");
    
    let decodedHeader = {};
    let decodedPayload = {};
    if (parts.length === 3) {
      decodedHeader = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf-8"));
      decodedPayload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
    }

    report.tests.tokenGeneration = {
      status: "SUCCESS ✅",
      tokenLength: jwtToken.length,
      decodedHeader,
      decodedPayload,
      sampleTokenPreview: `${jwtToken.slice(0, 25)}...${jwtToken.slice(-15)}`,
    };
  } catch (err: any) {
    report.tests.tokenGeneration = {
      status: "FAILED ❌",
      errorMessage: err.message,
    };
  }

  return NextResponse.json(report, { status: 200 });
}