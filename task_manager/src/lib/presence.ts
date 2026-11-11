// src/lib/presence.ts

declare global {
  var activeChatsGlobal: Map<string, { taskId: string; lastActive: number }> | undefined;
}

// Используем глобальную переменную, чтобы Node.js не сбрасывал карту при горячей перезагрузке (HMR) в dev-режиме
export const activeChats = globalThis.activeChatsGlobal ?? new Map<string, { taskId: string; lastActive: number }>();

if (process.env.NODE_ENV !== "production") {
  globalThis.activeChatsGlobal = activeChats;
}