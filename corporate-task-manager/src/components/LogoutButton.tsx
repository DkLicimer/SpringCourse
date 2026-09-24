// src/components/LogoutButton.tsx
"use client";

import React from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-sm font-medium"
    >
      <LogOut className="h-5 w-5" />
      Выйти
    </button>
  );
}