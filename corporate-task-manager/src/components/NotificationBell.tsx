// src/components/NotificationBell.tsx
"use client";

import React, { useState, useEffect, useTransition } from "react";
import { getMyNotifications, markAsRead, markAllAsRead } from "@/server/actions/notifications";
import { Bell, AlertCircle, MailOpen } from "lucide-react";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  text: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const data = await getMyNotifications();
      setNotifications(data as any);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = async (id: string, link: string | null) => {
    startTransition(async () => {
      try {
        await markAsRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        if (link) {
          router.push(link);
          setIsOpen(false);
        }
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleMarkAllAsRead = async () => {
    startTransition(async () => {
      try {
        await markAllAsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch (err) {
        console.error(err);
      }
    });
  };

  return (
    <div className="relative">
      {/* Кнопка Колокольчика */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all cursor-pointer z-50"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Выпадающий список уведомлений */}
      {isOpen && (
        <>
          {/* Невидимая подложка для закрытия по клику в любое место экрана */}
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => setIsOpen(false)} 
          />

          {/* 
            fixed на мобильном (выравнивание по границам экрана), 
            absolute на экранах sm и больше (выравнивание под кнопкой) 
          */}
          <div className="fixed top-16 left-4 right-4 sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mt-2 sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden flex flex-col max-h-96">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
              <span className="font-bold text-slate-800 text-sm">Уведомления</span>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={isPending}
                  className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer disabled:text-slate-400"
                >
                  <MailOpen className="h-3 w-3" /> Прочитать все
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 italic">
                  Уведомлений пока нет
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n.id, n.link)}
                    className={`p-4 flex gap-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${
                      !n.isRead ? "bg-blue-50/30" : ""
                    }`}
                  >
                    <div className={`p-1.5 rounded-full shrink-0 ${
                      !n.isRead ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
                    }`}>
                      <AlertCircle className="h-3.5 w-3.5" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <p className={`leading-relaxed ${!n.isRead ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                        {n.text}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(n.createdAt).toLocaleDateString()} в{" "}
                        {new Date(n.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {!n.isRead && (
                      <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0 mt-2" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}