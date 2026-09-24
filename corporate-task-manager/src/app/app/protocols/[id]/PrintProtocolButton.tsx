// src/app/app/protocols/[id]/PrintProtocolButton.tsx
"use client";

import React from "react";
import { Printer } from "lucide-react";

export function PrintProtocolButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
    >
      <Printer className="h-4 w-4" /> Распечатать / Сохранить в PDF
    </button>
  );
}