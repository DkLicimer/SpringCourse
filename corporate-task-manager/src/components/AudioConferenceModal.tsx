// src/components/AudioConferenceModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  LiveKitRoom,
  useParticipants,
  useLocalParticipant,
  RoomAudioRenderer,
  useRoomContext,
  useChat,
  useTrackToggle,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import {
  Mic,
  MicOff,
  PhoneOff,
  Users,
  FileCheck,
  Plus,
  Trash2,
  Sparkles,
  Radio,
  MessageSquare,
  Send,
  Lock,
  Play,
  Clock,
  Monitor,
  MonitorOff,
  Volume2
} from "lucide-react";
import { saveMeetingProtocol, ProtocolDraftTask } from "@/server/actions/protocols";
import { checkMeetingRoomStatus, startMeetingRoom, closeMeetingRoom } from "@/server/actions/meetings";
import { useRouter } from "next/navigation";

interface AudioConferenceModalProps {
  roomName: string;
  roomTitle: string;
  calendarEventId?: string;
  isOpen: boolean;
  onClose: () => void;
  users: { id: string; name: string; initials: string }[];
  goals: { id: string; title: string; color: string }[];
  currentUserId: string;
  isAdmin: boolean;
}

// 🎛️ ОСНОВНОЙ ПУЛЬТ УПРАВЛЕНИЯ ЗВОНКОМ
function RoomControlsAndDrafting({
  roomName,
  roomTitle,
  calendarEventId,
  users,
  goals,
  currentUserId,
  isAdmin,
  onLeave,
}: {
  roomName: string;
  roomTitle: string;
  calendarEventId?: string;
  users: any[];
  goals: any[];
  currentUserId: string;
  isAdmin: boolean;
  onLeave: () => void;
}) {
  const router = useRouter();
  const room = useRoomContext();
  const participants = useParticipants();
  
  // ⚡ Официальный хук LiveKit для микрофона
  const { toggle: rawToggleMic, enabled: isMicrophoneEnabled, pending: micPending } = useTrackToggle({
    source: Track.Source.Microphone,
  });

  // ⚡ Официальный хук LiveKit для демонстрации экрана
  const { toggle: rawToggleScreen, enabled: isScreenShareEnabled, pending: screenPending } = useTrackToggle({
    source: Track.Source.ScreenShare,
  });

  // 💬 ВСТРОЕННЫЙ ЧАТ LIVEKIT
  const { chatMessages, send, isSending } = useChat();
  const [chatInputText, setChatInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [activeTab, setActiveTab] = useState<"protocol" | "chat">("protocol");

  // Счётчик непрочитанных сообщений в чате
  const [lastReadMessageCount, setLastReadMessageCount] = useState(0);

  useEffect(() => {
    if (activeTab === "chat") {
      setLastReadMessageCount(chatMessages.length);
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeTab, chatMessages.length]);

  const unreadChatCount = activeTab === "chat" ? 0 : Math.max(0, chatMessages.length - lastReadMessageCount);

  // Поля протокола
  const [agenda, setAgenda] = useState("");
  const [discussion, setDiscussion] = useState("");
  const [decisions, setDecisions] = useState("");
  const [tasks, setTasks] = useState<ProtocolDraftTask[]>([]);

  // Быстрая задача
  const [taskTitle, setTaskTitle] = useState("");
  const [taskGoalId, setTaskGoalId] = useState(goals[0]?.id || "");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (goals.length > 0 && !taskGoalId) {
      setTaskGoalId(goals[0].id);
    }
  }, [goals, taskGoalId]);

  const toggleMic = async () => {
    try {
      await rawToggleMic();
    } catch (err: any) {
      console.error("Ошибка микрофона:", err);
      alert("Не удалось получить доступ к микрофону. Проверьте разрешения в браузере.");
    }
  };

  const toggleScreenShare = async () => {
    try {
      await rawToggleScreen();
    } catch (err: any) {
      console.error("Ошибка демонстрации экрана:", err);
    }
  };

  const handleCleanExit = async () => {
    try {
      await room.disconnect();
    } catch (e) {}
    onLeave();
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || isSending) return;
    const msg = chatInputText.trim();
    setChatInputText("");
    try {
      await send(msg);
    } catch (err) {
      console.error("Ошибка отправки сообщения:", err);
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskAssigneeId || !taskGoalId) {
      alert("Заполните название задачи, тему и выберите ответственного");
      return;
    }

    setTasks((prev) => [
      ...prev,
      {
        title: taskTitle.trim(),
        goalId: taskGoalId,
        assigneeIds: [taskAssigneeId],
        deadline: taskDeadline || undefined,
        isPriority: false,
      },
    ]);

    setTaskTitle("");
  };

  const handleRemoveTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFinalizeMeeting = async () => {
    if (!window.confirm("Завершить совещание, закрыть комнату и подписать официальный протокол?")) {
      return;
    }

    setIsSaving(true);
    try {
      const attendeeIds: string[] = [];
      participants.forEach((p) => {
        if (p.metadata) {
          try {
            const meta = JSON.parse(p.metadata);
            if (meta.userId && !attendeeIds.includes(meta.userId)) {
              attendeeIds.push(meta.userId);
            }
          } catch (e) {}
        }
      });

      if (!attendeeIds.includes(currentUserId)) {
        attendeeIds.push(currentUserId);
      }

      const protocol = await saveMeetingProtocol({
        calendarEventId,
        title: roomTitle,
        agenda,
        discussionText: discussion,
        decisionsText: decisions,
        attendeeIds,
        tasksToCreate: tasks,
        status: "SIGNED",
      });

      await closeMeetingRoom(roomName);
      alert(`Протокол № ${protocol.protocolNumber} успешно сформирован! Задачи созданы.`);
      await handleCleanExit();
      router.push(`/app/protocols/${protocol.id}`);
    } catch (err: any) {
      alert(err.message || "Ошибка при сохранении протокола");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-full relative">
      {/* ЛЕВАЯ ЧАСТЬ: Аудиокомната */}
      <div className="flex-1 bg-slate-900 text-white p-6 flex flex-col justify-between border-r border-slate-800">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <h3 className="font-bold text-sm tracking-wide text-white">{roomTitle}</h3>
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Volume2 className="h-3 w-3 text-emerald-400" />
                <span>Защищенный голосовой канал</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 font-bold">
            <Users className="h-3.5 w-3.5 text-blue-400" />
            <span>Участников: {participants.length}</span>
          </div>
        </div>

        {/* Сетка участников */}
        <div className="py-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 overflow-y-auto">
          {participants.map((p) => {
            const isSpeaking = p.isSpeaking;
            const isMuted = !p.isMicrophoneEnabled;

            let displayName = p.name || "Сотрудник";
            let displayInitials = displayName.slice(0, 2).toUpperCase();

            if (p.metadata) {
              try {
                const meta = JSON.parse(p.metadata);
                if (meta.name) displayName = meta.name;
                if (meta.initials) displayInitials = meta.initials;
              } catch (e) {}
            }

            return (
              <div
                key={p.sid}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${
                  isSpeaking
                    ? "bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/50 shadow-lg scale-[1.02]"
                    : "bg-slate-800/60 border-slate-700/50"
                }`}
              >
                <div className="relative">
                  <div className={`h-14 w-14 rounded-full font-extrabold flex items-center justify-center text-sm shadow-md transition-all ${
                    isSpeaking 
                      ? "bg-gradient-to-tr from-emerald-600 to-teal-500 text-white ring-4 ring-emerald-400/40" 
                      : "bg-gradient-to-tr from-blue-600 to-indigo-600 text-white"
                  }`}>
                    {displayInitials}
                  </div>
                  {isMuted && (
                    <div className="absolute -bottom-1 -right-1 bg-rose-600 text-white p-1 rounded-full ring-2 ring-slate-900 shadow" title="Микрофон выключен">
                      <MicOff className="h-3 w-3" />
                    </div>
                  )}
                  {isSpeaking && (
                    <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full ring-2 ring-slate-900 shadow animate-pulse" title="Говорит">
                      <Radio className="h-3 w-3" />
                    </div>
                  )}
                </div>
                <span className="font-bold text-xs text-slate-200 mt-2.5 text-center truncate max-w-[110px]" title={displayName}>
                  {displayName}
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5">
                  {p.isLocal ? "(Вы)" : isSpeaking ? "Говорит..." : isMuted ? "Без звука" : "Слушает"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Пульт управления */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={toggleMic}
            disabled={micPending}
            className={`px-5 py-3 rounded-2xl font-bold flex items-center gap-2 text-xs transition-all shadow-md cursor-pointer ${
              isMicrophoneEnabled
                ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                : "bg-rose-600 hover:bg-rose-700 text-white animate-pulse"
            }`}
          >
            {isMicrophoneEnabled ? <Mic className="h-4.5 w-4.5 text-emerald-400" /> : <MicOff className="h-4.5 w-4.5" />}
            <span>{micPending ? "Подключение..." : isMicrophoneEnabled ? "Выключить микрофон" : "Включить микрофон"}</span>
          </button>

          <button
            onClick={toggleScreenShare}
            disabled={screenPending}
            className={`px-4 py-3 rounded-2xl font-bold flex items-center gap-2 text-xs transition-all border cursor-pointer ${
              isScreenShareEnabled
                ? "bg-blue-600 text-white border-blue-500"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
            }`}
            title="Демонстрация экрана"
          >
            {isScreenShareEnabled ? <MonitorOff className="h-4.5 w-4.5" /> : <Monitor className="h-4.5 w-4.5" />}
            <span className="hidden sm:inline">{isScreenShareEnabled ? "Остановить экран" : "Поделиться экраном"}</span>
          </button>

          <button
            onClick={handleCleanExit}
            className="px-4 py-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-2xl font-bold flex items-center gap-2 text-xs transition-all cursor-pointer"
          >
            <PhoneOff className="h-4.5 w-4.5" />
            <span>Выйти</span>
          </button>
        </div>
      </div>

      {/* ПРАВАЯ ЧАСТЬ: Вкладки (Протокол и задачи / Чат звонка) */}
      <div className="w-full lg:w-[480px] bg-white p-6 flex flex-col justify-between overflow-y-auto space-y-4">
        <div className="space-y-4">
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab("protocol")}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === "protocol" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <FileCheck className="h-4 w-4" />
              Протокол и задачи
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
                activeTab === "chat" ? "bg-white text-blue-600 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Чат звонка</span>
              {unreadChatCount > 0 && (
                <span className="px-1.5 py-0.2 bg-red-500 text-white rounded-full text-[9px] font-black animate-pulse">
                  {unreadChatCount}
                </span>
              )}
            </button>
          </div>

          {/* 💬 ВКЛАДКА ЧАТА (Сохраняет сообщения на протяжении созвона) */}
          <div style={{ display: activeTab === "chat" ? "flex" : "none" }} className="flex-col h-[480px] bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden">
            <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 text-xs">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                  <MessageSquare className="h-6 w-6 text-blue-400 mb-1 opacity-60" />
                  <span>Сообщений пока нет.<br />Напишите сообщение участникам совещания!</span>
                </div>
              ) : (
                chatMessages.map((m) => {
                  let senderName = m.from?.name || "Участник";
                  if (m.from?.metadata) {
                    try {
                      const meta = JSON.parse(m.from.metadata);
                      if (meta.name) senderName = meta.name;
                    } catch (e) {}
                  }

                  const senderIdentity = m.from?.identity || "";
                  const isMe = senderIdentity.startsWith(currentUserId) || m.from?.isLocal;

                  return (
                    <div key={m.timestamp} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mb-0.5 px-1">
                        <span className="font-bold text-slate-700">{isMe ? "Вы" : senderName}</span>
                        <span>• {new Date(m.timestamp).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div
                        className={`p-2.5 rounded-2xl text-xs max-w-[85%] whitespace-pre-line leading-relaxed shadow-xs ${
                          isMe
                            ? "bg-blue-600 text-white rounded-br-none"
                            : "bg-white border border-slate-200 text-slate-800 rounded-bl-none font-medium"
                        }`}
                      >
                        {m.message}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChatMessage} className="p-2.5 bg-white border-t border-slate-200 flex gap-2 items-center">
              <input
                type="text"
                placeholder="Написать в чат совещания..."
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500 bg-slate-50"
              />
              <button
                type="submit"
                disabled={!chatInputText.trim() || isSending}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:bg-blue-300 transition-colors cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* 📋 ВКЛАДКА ПРОТОКОЛА */}
          <div style={{ display: activeTab === "protocol" ? "block" : "none" }} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Повестка дня</label>
              <input
                type="text"
                placeholder="1. Итоги недели; 2. План мероприятий..."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                value={agenda}
                onChange={(e) => setAgenda(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Ключевые тезисы / Слушали</label>
              <textarea
                rows={2}
                placeholder="Краткие тезисы выступлений..."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                value={discussion}
                onChange={(e) => setDiscussion(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Решения / Постановили</label>
              <textarea
                rows={2}
                placeholder="Принятые решения..."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-500 text-slate-800"
                value={decisions}
                onChange={(e) => setDecisions(e.target.value)}
              />
            </div>

            {/* Добавление задач по итогам созвона */}
            <div className="border-t pt-3 space-y-2">
              <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                Поручения по итогам ({tasks.length})
              </span>

              {isAdmin && (
                <form onSubmit={handleAddTask} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="Что необходимо сделать?"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      required
                      value={taskAssigneeId}
                      onChange={(e) => setTaskAssigneeId(e.target.value)}
                      className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Кому поручить...</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>

                    <select
                      value={taskGoalId}
                      onChange={(e) => setTaskGoalId(e.target.value)}
                      className="px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      {goals.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2 items-center">
                    <input
                      type="date"
                      className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                      value={taskDeadline}
                      onChange={(e) => setTaskDeadline(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" /> Добавить
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {tasks.map((t, idx) => {
                  const assignee = users.find((u) => u.id === t.assigneeIds[0]);
                  return (
                    <div key={idx} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-slate-900 truncate">{t.title}</div>
                        <div className="text-[10px] text-slate-500">
                          👤 {assignee?.name || "Сотрудник"} {t.deadline && `• До ${new Date(t.deadline).toLocaleDateString("ru-RU")}`}
                        </div>
                      </div>
                      <button type="button" onClick={() => handleRemoveTask(idx)} className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {isAdmin && activeTab === "protocol" && (
          <div className="pt-3 border-t">
            <button
              onClick={handleFinalizeMeeting}
              disabled={isSaving}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:bg-emerald-300"
            >
              <FileCheck className="h-4 w-4" />
              {isSaving ? "Генерация протокола..." : "Завершить и подписать протокол"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 🛡️ ГЛАВНАЯ ОБЕРТКА (Зал ожидания + Однократное получение токена)
export function AudioConferenceModal({
  roomName,
  roomTitle,
  calendarEventId,
  isOpen,
  onClose,
  users,
  goals,
  currentUserId,
  isAdmin,
}: AudioConferenceModalProps) {
  const [token, setToken] = useState<string>("");
  const [isRoomActive, setIsRoomActive] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setToken("");
      setIsRoomActive(false);
      return;
    }

    let isMounted = true;

    // 1. Для Администратора комната активна сразу
    if (isAdmin) {
      setIsRoomActive(true);
      fetch(`/api/livekit/token?room=${encodeURIComponent(roomName)}`)
        .then((res) => res.json())
        .then((data) => {
          if (isMounted && data.token) setToken(data.token);
        })
        .catch((err) => console.error("Ошибка получения токена:", err));
      return;
    }

    // 2. Для Сотрудника: опрашиваем статус, пока комната не станет активной
    const check = async () => {
      try {
        const res = await checkMeetingRoomStatus(roomName);
        if (res.isActive && isMounted) {
          setIsRoomActive(true);
          // Получаем токен СТРОГО 1 РАЗ
          const tokenRes = await fetch(`/api/livekit/token?room=${encodeURIComponent(roomName)}`);
          const tokenData = await tokenRes.json();
          if (isMounted && tokenData.token) {
            setToken(tokenData.token);
          }
        }
      } catch (err) {
        console.error("Ошибка проверки комнаты:", err);
      }
    };

    check();
    const interval = setInterval(() => {
      // Опрашиваем только пока комната не запущена
      if (!isRoomActive) {
        check();
      }
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isOpen, roomName, isAdmin, isRoomActive]);

  const handleStartByAdmin = async () => {
    try {
      await startMeetingRoom(roomName, roomTitle);
      setIsRoomActive(true);
    } catch (err: any) {
      alert(err.message || "Ошибка запуска комнаты");
    }
  };

  if (!isOpen) return null;

  const livekitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "wss://task-manager-audio-64yjwhj8.livekit.cloud";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-slate-900 rounded-3xl w-full max-w-6xl h-[90vh] shadow-2xl border border-slate-800 overflow-hidden flex flex-col">
        {!isRoomActive && !isAdmin ? (
          <div className="h-full flex flex-col items-center justify-center text-white p-6 text-center space-y-4">
            <div className="p-4 bg-slate-800 rounded-full border border-slate-700">
              <Lock className="h-10 w-10 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{roomTitle}</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-md">
                Совещание еще не начато руководителем. Как только руководитель запустит встречу, вы автоматически подключитесь.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-400 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700">
              <Clock className="h-4 w-4 animate-spin" />
              <span>Ожидание запуска комнаты...</span>
            </div>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer mt-4"
            >
              Закрыть окно
            </button>
          </div>
        ) : !isRoomActive && isAdmin ? (
          <div className="h-full flex flex-col items-center justify-center text-white p-6 text-center space-y-4">
            <div className="p-4 bg-emerald-500/10 rounded-full border border-emerald-500/20">
              <Play className="h-10 w-10 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{roomTitle}</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-md">
                Вы являетесь организатором. Нажмите кнопку ниже, чтобы открыть вход для всех участников.
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={handleStartByAdmin}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2"
              >
                <Play className="h-4 w-4" /> Начать совещание
              </button>
            </div>
          </div>
        ) : token ? (
          <LiveKitRoom
            token={token}
            serverUrl={livekitUrl}
            connect={true}
            audio={false}
            video={false}
            className="h-full flex flex-col"
          >
            <RoomAudioRenderer />
            <RoomControlsAndDrafting
              roomName={roomName}
              roomTitle={roomTitle}
              calendarEventId={calendarEventId}
              users={users}
              goals={goals}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onLeave={onClose}
            />
          </LiveKitRoom>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-white space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-xs text-slate-400">Подключение к аудиокомнате...</p>
          </div>
        )}
      </div>
    </div>
  );
}