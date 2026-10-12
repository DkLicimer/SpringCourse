// src/app/app/protocols/ProtocolsClient.tsx
"use client";

import React, { useState, useTransition } from "react";
import { 
  FileText, 
  Search, 
  Trash2, 
  Eye, 
  Calendar, 
  Users, 
  CheckSquare, 
  ArrowRight,
  Printer,
  Mail
} from "lucide-react";
import Link from "next/link";
import { deleteMeetingProtocol, sendProtocolEmailBlast } from "@/server/actions/protocols";

interface ProtocolsClientProps {
  initialProtocols: any[];
  isAdmin: boolean;
  currentUserId: string;
}

export function ProtocolsClient({ initialProtocols, isAdmin, currentUserId }: ProtocolsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = initialProtocols.filter(
    (p) =>
      p.protocolNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.chairman.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string, num: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить протокол № ${num}?`)) return;

    startTransition(async () => {
      try {
        await deleteMeetingProtocol(id);
      } catch (err: any) {
        alert(err.message || "Ошибка удаления");
      }
    });
  };

  const handleEmailBlast = async (id: string, num: string) => {
    if (!window.confirm(`Отправить протокол ${num} всем участникам на электронную почту?`)) return;

    startTransition(async () => {
      try {
        await sendProtocolEmailBlast(id);
        alert("Протокол успешно разослан всем участникам!");
      } catch (err: any) {
        alert(err.message || "Ошибка отправки");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Протоколы совещаний</h2>
          <p className="text-slate-500 text-sm">
            Официальный реестр протоколов, поручений и составов участников
          </p>
        </div>
      </div>

      {/* Поиск */}
      <div className="relative max-w-md bg-white rounded-xl shadow-sm">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск по номеру, теме, председателю..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Список протоколов */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 italic">
            Протоколов совещаний пока нет
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg">
                    {p.protocolNumber}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    Утвержден
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{p.title}</h3>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{new Date(p.meetingDate).toLocaleDateString("ru-RU")}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{p.attendees.length} участников</span>
                  </div>
                </div>

                {p.tasks.length > 0 && (
                  <div className="text-xs text-blue-700 font-semibold bg-blue-50/50 p-2 rounded-lg border border-blue-100 flex items-center gap-1.5">
                    <CheckSquare className="h-3.5 w-3.5 text-blue-600" />
                    <span>Выдано поручений: {p.tasks.length}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEmailBlast(p.id, p.protocolNumber)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    title="Разослать на Email всем участникам"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(p.id, p.protocolNumber)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <Link
                  href={`/app/protocols/${p.id}`}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Открыть бланк <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}