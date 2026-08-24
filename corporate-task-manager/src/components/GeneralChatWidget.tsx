// src/components/GeneralChatWidget.tsx
"use client";

import React, { useState, useEffect, useRef, useTransition } from "react";
import { MessageSquare, Send, X, Trash2, Users, Sparkles } from "lucide-react";
import { sendGeneralMessage, getGeneralMessages, deleteGeneralMessage } from "@/server/actions/generalChat";

interface GeneralChatWidgetProps {
  currentUserId: string;
  isAdmin: boolean;
}

type ChatMessage = {
  id: string;
  text: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    initials: string;
    department?: string | null;
    role: string;
  };
};

export function GeneralChatWidget({ currentUserId, isAdmin }: GeneralChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [inputText, setInputText] = useState("");
  const [isPending, startTransition] = useTransition();
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Получаем таймштамп последнего прочтения из localStorage
  const getLastReadTime = (): number => {
    if (typeof window === "undefined") return 0;
    const val = localStorage.getItem(`general_chat_last_read_${currentUserId}`);
    return val ? parseInt(val, 10) : 0;
  };

  // Пометить сообщения как прочитанные
  const markAsRead = () => {
    if (typeof window === "undefined") return;
    const now = Date.now();
    localStorage.setItem(`general_chat_last_read_${currentUserId}`, String(now));
    setUnreadCount(0);
  };

  // Расчет количества непрочитанных сообщений от других участников
  const calculateUnread = (msgs: ChatMessage[]) => {
    const lastRead = getLastReadTime();
    const count = msgs.filter((m) => {
      // Сообщения текущего пользователя не считаются непрочитанными
      if (m.user.id === currentUserId) return false;
      return new Date(m.createdAt).getTime() > lastRead;
    }).length;
    setUnreadCount(count);
  };

  const fetchMessages = async () => {
    try {
      const data = await getGeneralMessages();
      setMessages(data as any);

      // Если окно чата открыто — сразу сбрасываем непрочитанные, иначе пересчитываем
      if (isOpen) {
        markAsRead();
      } else {
        calculateUnread(data as any);
      }
    } catch (err) {
      console.error("Ошибка загрузки сообщений чата:", err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [isOpen, currentUserId]);

  // Сброс бейджа при открытии окна чата
  useEffect(() => {
    if (isOpen) {
      markAsRead();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const textToSend = inputText.trim();
    setInputText("");

    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      text: textToSend,
      createdAt: new Date().toISOString(),
      user: {
        id: currentUserId,
        name: "Вы",
        initials: "ВЫ",
        role: isAdmin ? "ADMIN" : "EMPLOYEE",
      },
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    markAsRead();

    startTransition(async () => {
      try {
        await sendGeneralMessage(textToSend);
        await fetchMessages();
      } catch (err) {
        console.error(err);
        await fetchMessages();
      }
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      try {
        await deleteGeneralMessage(id);
        setMessages((prev) => prev.filter((m) => m.id !== id));
      } catch (err) {
        console.error(err);
      }
    });
  };

  const displayBadge = unreadCount > 99 ? "99+" : String(unreadCount);

  return (
    <div className="relative">
      {/* 💬 КНОПКА ОТКРЫТИЯ ЧАТА В ШАПКЕ */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            markAsRead();
            fetchMessages();
          }
        }}
        className="relative flex items-center gap-1.5 px-2.5 py-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-full transition-all text-xs font-bold cursor-pointer"
        title="Общий чат команды"
      >
        <MessageSquare className="h-4 w-4 text-blue-600 shrink-0" />
        <span className="hidden sm:inline">Чат команды</span>
        
        {/* ⚡ БЕЙДЖ НЕПРОЧИТАННЫХ СООБЩЕНИЙ (С ОГРАНИЧЕНИЕМ 99+) */}
        {unreadCount > 0 && (
          <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded-full text-[10px] font-black animate-pulse">
            {displayBadge}
          </span>
        )}
      </button>

      {/* 📋 ВСПЛЫВАЮЩЕЕ ОКНО ЧАТА */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed top-16 right-4 sm:right-6 md:right-12 z-50 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden w-84 sm:w-96 flex flex-col h-[500px] max-h-[80vh] animate-slide-up">
            {/* Шапка окна чата */}
            <div className="px-4 py-3 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                <div>
                  <div className="font-bold text-xs">Рабочий чат команды</div>
                  <div className="text-[9px] text-slate-400">Быстрые сообщения и поручения</div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Список сообщений */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-50/50">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
                  <Sparkles className="h-6 w-6 text-blue-400 mb-2 animate-bounce" />
                  <span>Сообщений пока нет.<br />Напишите первое сообщение коллегам!</span>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.user.id === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col group ${isMe ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5 px-1">
                        <span className="font-bold text-slate-600">{isMe ? "Вы" : msg.user.name.split(" ")[0]}</span>
                        {msg.user.department && (
                          <span className="text-[9px] text-blue-500 font-semibold">({msg.user.department})</span>
                        )}
                        <span>• {new Date(msg.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                        
                        {(isMe || isAdmin) && !msg.id.startsWith("temp-") && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity ml-1 cursor-pointer"
                            title="Удалить"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      <div
                        className={`p-2.5 rounded-2xl text-xs max-w-[85%] whitespace-pre-line leading-relaxed shadow-sm ${
                          isMe
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-white border border-slate-200 text-slate-800 rounded-bl-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Поле ввода сообщения */}
            <form onSubmit={handleSend} className="p-2.5 bg-white border-t border-slate-200 flex gap-2 items-center shrink-0">
              <input
                type="text"
                required
                placeholder="Напишите сообщение..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800 bg-slate-50"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
              />
              <button
                type="submit"
                disabled={isPending || !inputText.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:bg-blue-300 shrink-0 cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}