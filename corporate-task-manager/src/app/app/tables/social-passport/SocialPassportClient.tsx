// src/app/app/tables/social-passport/SocialPassportClient.tsx
"use client";

import React, { useState, useTransition } from "react";
import { 
  createSocialPassportRow, 
  updateSocialPassportRow, 
  deleteSocialPassportRow 
} from "@/server/actions/tables";
import { 
  Plus, 
  Trash2, 
  Pencil, 
  ArrowLeft, 
  Search, 
  X, 
  User, 
  Phone, 
  PhoneCall, 
  Briefcase, 
  Cake, 
  Heart, 
  Home, 
  Baby, 
  Sparkles, 
  Trophy, 
  Gift, 
  Eye, 
  Printer, 
  Calendar,
  Building2,
  Filter
} from "lucide-react";
import Link from "next/link";

export type SocialPassportRecord = {
  id: string;
  userId?: string | null;
  fullName: string;
  department: string;
  position?: string | null;
  mobilePhone?: string | null;
  workPhone?: string | null;
  birthDate?: string | null;
  maritalStatus?: string | null;
  livingAddress?: string | null;
  hasOwnHousing?: string | null;
  childrenInfo?: string | null;
  hobbies?: string | null;
  achievements?: string | null;
  preferredGifts?: string | null;
  notes?: string | null;
};

interface SocialPassportClientProps {
  initialRows: SocialPassportRecord[];
  canWrite: boolean;
}

export function SocialPassportClient({ initialRows, canWrite }: SocialPassportClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  // Модальные окна
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingRow, setEditingRow] = useState<SocialPassportRecord | null>(null);
  const [viewingRow, setViewingRow] = useState<SocialPassportRecord | null>(null);
  const [activeTab, setActiveTab] = useState<"main" | "contacts" | "family" | "extra">("main");

  // Уникальные подразделения для фильтра
  const departments = Array.from(new Set(initialRows.map((r) => r.department).filter(Boolean)));

  // Фильтрация
  const filteredRows = initialRows.filter((r) => {
    const matchesSearch =
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.position && r.position.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.mobilePhone && r.mobilePhone.includes(searchTerm)) ||
      (r.hobbies && r.hobbies.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDept = departmentFilter === "all" || r.department === departmentFilter;

    return matchesSearch && matchesDept;
  });

  // Расчет ближайших дней рождения (в текущем месяце / ближайшие 30 дней)
  const now = new Date();
  const currentMonth = now.getMonth();

  const upcomingBirthdays = initialRows.filter((r) => {
    if (!r.birthDate) return false;
    const bDate = new Date(r.birthDate);
    return bDate.getMonth() === currentMonth;
  });

  const handleOpenCreate = () => {
    setEditingRow(null);
    setActiveTab("main");
    setIsOpenForm(true);
  };

  const handleOpenEdit = (row: SocialPassportRecord) => {
    setEditingRow(row);
    setActiveTab("main");
    setIsOpenForm(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        if (editingRow) {
          await updateSocialPassportRow(editingRow.id, formData);
        } else {
          await createSocialPassportRow(formData);
        }
        setIsOpenForm(false);
      } catch (err: any) {
        alert(err.message || "Ошибка при сохранении данных");
      }
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить сотрудника "${name}" из состава коллектива?`)) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteSocialPassportRow(id);
        if (viewingRow?.id === id) setViewingRow(null);
      } catch (err: any) {
        alert(err.message || "Ошибка при удалении");
      }
    });
  };

  const calculateAge = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const birth = new Date(dateStr);
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? age : null;
  };

  return (
    <div className="space-y-6">
      {/* Шапка */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <Link
            href="/app/tables"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors mb-1"
          >
            <ArrowLeft className="h-3 w-3" /> Назад к таблицам
          </Link>
          <h2 className="text-2xl font-bold text-slate-800">Состав коллектива</h2>
          <p className="text-slate-500 text-sm">Кадровый состав, анкетные данные, семья и контакты сотрудников</p>
        </div>

        {canWrite && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm w-full sm:w-auto cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Добавить сотрудника в состав
          </button>
        )}
      </div>

      {/* 🎂 ВИДЖЕТ «БЛИЖАЙШИЕ ДНИ РОЖДЕНИЯ В ЭТОМ МЕСЯЦЕ» */}
      {upcomingBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-pink-50 via-rose-50 to-amber-50 border border-pink-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2 text-rose-800 font-extrabold text-xs uppercase tracking-wider">
            <Cake className="h-4 w-4 text-pink-600 animate-bounce" />
            <span>Дни рождения в этом месяце ({upcomingBirthdays.length})</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {upcomingBirthdays.map((b) => (
              <div
                key={b.id}
                onClick={() => setViewingRow(b)}
                className="flex items-center gap-2 bg-white/90 hover:bg-white px-3 py-1.5 rounded-xl border border-pink-100 shadow-sm cursor-pointer transition-all hover:scale-[1.02]"
              >
                <span className="h-2 w-2 rounded-full bg-pink-500" />
                <span className="font-bold text-slate-800 text-xs">{b.fullName}</span>
                <span className="text-[11px] font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md">
                  {b.birthDate ? new Date(b.birthDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long" }) : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Панель поиска и фильтрации */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2 bg-white rounded-xl shadow-sm">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по ФИО, должности, телефону, хобби..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-slate-800 placeholder-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative bg-white rounded-xl shadow-sm">
          <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-blue-500 text-slate-800 cursor-pointer"
          >
            <option value="all">Все подразделения</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 💻 ДЕСКТОПНАЯ ТАБЛИЦА */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-sm">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-3.5 text-left font-semibold text-slate-500 uppercase tracking-wider">ФИО сотрудника</th>
              <th className="px-4 py-3.5 text-left font-semibold text-slate-500 uppercase tracking-wider">Подразделение</th>
              <th className="px-4 py-3.5 text-left font-semibold text-slate-500 uppercase tracking-wider">Должность</th>
              <th className="px-4 py-3.5 text-left font-semibold text-slate-500 uppercase tracking-wider">Телефоны</th>
              <th className="px-4 py-3.5 text-left font-semibold text-slate-500 uppercase tracking-wider">Дата рождения</th>
              <th className="px-4 py-3.5 text-left font-semibold text-slate-500 uppercase tracking-wider">Семья / Дети</th>
              <th className="px-5 py-3.5 text-right font-semibold text-slate-500 uppercase tracking-wider">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                  Сотрудники не найдены
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const age = calculateAge(row.birthDate);
                return (
                  <tr
                    key={row.id}
                    onClick={() => setViewingRow(row)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs shrink-0">
                          {row.fullName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm leading-snug">{row.fullName}</div>
                          {row.livingAddress && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{row.livingAddress}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-700 font-semibold">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px]">
                        {row.department}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-medium">
                      {row.position || "—"}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap space-y-0.5 text-slate-600">
                      {row.mobilePhone ? (
                        <div className="flex items-center gap-1 text-[11px] font-medium">
                          <Phone className="h-3 w-3 text-slate-400" /> {row.mobilePhone}
                        </div>
                      ) : null}
                      {row.workPhone ? (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <PhoneCall className="h-3 w-3" /> вн. {row.workPhone}
                        </div>
                      ) : null}
                      {!row.mobilePhone && !row.workPhone && <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-600 font-medium">
                      {row.birthDate ? (
                        <div className="flex items-center gap-1.5">
                          <Cake className="h-3.5 w-3.5 text-pink-500 shrink-0" />
                          <span>{new Date(row.birthDate).toLocaleDateString("ru-RU")}</span>
                          {age && <span className="text-[10px] text-slate-400">({age} лет)</span>}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {row.maritalStatus && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-full font-bold">
                            {row.maritalStatus}
                          </span>
                        )}
                        {row.childrenInfo && (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5" title={row.childrenInfo}>
                            <Baby className="h-3 w-3" /> Дети
                          </span>
                        )}
                        {!row.maritalStatus && !row.childrenInfo && <span className="text-slate-400">—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setViewingRow(row); }}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                          title="Личное дело (Все 12 полей)"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canWrite && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}
                              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Редактировать анкету"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(row.id, row.fullName); }}
                              disabled={isPending}
                              className="p-1.5 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-lg transition-colors cursor-pointer"
                              title="Удалить"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 📱 МОБИЛЬНАЯ ВЕРСИЯ КАРТОЧЕК */}
      <div className="block lg:hidden space-y-3">
        {filteredRows.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs bg-white rounded-2xl border">
            Сотрудники не найдены
          </div>
        ) : (
          filteredRows.map((row) => (
            <div
              key={row.id}
              onClick={() => setViewingRow(row)}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 cursor-pointer"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                    {row.fullName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm leading-snug">{row.fullName}</h4>
                    <div className="text-[11px] text-slate-500">{row.position || "Должность не указана"}</div>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                  {row.department}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {row.mobilePhone && (
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400">Сот. телефон</span>
                    <span className="font-bold text-slate-800">{row.mobilePhone}</span>
                  </div>
                )}
                {row.birthDate && (
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col gap-0.5">
                    <span className="text-[9px] uppercase font-bold text-slate-400">День рождения</span>
                    <span className="font-bold text-pink-700 flex items-center gap-1">
                      <Cake className="h-3 w-3 text-pink-500" />
                      {new Date(row.birthDate).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-1 pt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setViewingRow(row); }}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-lg flex items-center gap-1"
                >
                  <Eye className="h-3.5 w-3.5" /> Личное дело
                </button>
                {canWrite && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}
                    className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ========================================================================= */}
      {/* 📋 МОДАЛЬНОЕ ОКНО «ЛИЧНОЕ ДЕЛО СОТРУДНИКА» (ВСЕ 12 ПОЛЕЙ) */}
      {/* ========================================================================= */}
      {viewingRow && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Шапка модалки */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md">
                  {viewingRow.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 leading-tight">{viewingRow.fullName}</h3>
                  <p className="text-xs text-slate-500">{viewingRow.position || "Сотрудник"} • {viewingRow.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  title="Распечатать анкету"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewingRow(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Тело карточки со всеми 12 полями */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs sm:text-sm">
              {/* Секция 1: Контакты и место жительства */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-blue-500" /> Контактная информация и адрес
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Телефон сот.</span>
                    <span className="font-bold text-slate-800 text-sm">{viewingRow.mobilePhone || "—"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Телефон раб.</span>
                    <span className="font-bold text-slate-800 text-sm">{viewingRow.workPhone || "—"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Дата рождения</span>
                    <span className="font-bold text-slate-800 text-sm flex items-center gap-1">
                      {viewingRow.birthDate ? (
                        <>
                          <Cake className="h-3.5 w-3.5 text-pink-500" />
                          {new Date(viewingRow.birthDate).toLocaleDateString("ru-RU")}
                          {calculateAge(viewingRow.birthDate) && ` (${calculateAge(viewingRow.birthDate)} лет)`}
                        </>
                      ) : "—"}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Место жительства (Адрес)</span>
                  <span className="font-semibold text-slate-800">{viewingRow.livingAddress || "—"}</span>
                </div>
              </div>

              {/* Секция 2: Семья, жилье и дети */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-rose-500" /> Семейное положение и имущество
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Социальное положение</span>
                    <span className="font-bold text-slate-800">{viewingRow.maritalStatus || "—"}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Жилье в собственности</span>
                    <span className="font-bold text-slate-800">{viewingRow.hasOwnHousing || "—"}</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block flex items-center gap-1">
                    <Baby className="h-3.5 w-3.5 text-emerald-600" /> Дети (ФИО, дата рождения, № свидетельства)
                  </span>
                  <p className="font-medium text-slate-800 whitespace-pre-line mt-1">
                    {viewingRow.childrenInfo || "Данные не указаны"}
                  </p>
                </div>
              </div>

              {/* Секция 3: Хобби, награды и подарки */}
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Личные интересы и предпочтения
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                    <span className="text-[10px] text-amber-800 font-bold uppercase block">Увлечения / Хобби</span>
                    <p className="font-medium text-slate-800 mt-1 whitespace-pre-line">{viewingRow.hobbies || "—"}</p>
                  </div>
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase block flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-emerald-600" /> Достижения и награды
                    </span>
                    <p className="font-medium text-slate-800 mt-1 whitespace-pre-line">{viewingRow.achievements || "—"}</p>
                  </div>
                </div>
                <div className="p-3 bg-pink-50/50 rounded-xl border border-pink-100">
                  <span className="text-[10px] text-pink-800 font-bold uppercase block flex items-center gap-1">
                    <Gift className="h-3.5 w-3.5 text-pink-600" /> Какие подарки нравится получать на праздник
                  </span>
                  <p className="font-semibold text-slate-800 mt-1 whitespace-pre-line">
                    {viewingRow.preferredGifts || "—"}
                  </p>
                </div>
              </div>

              {viewingRow.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 italic">
                  <strong>Примечания:</strong> {viewingRow.notes}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
              {canWrite && (
                <button
                  onClick={() => {
                    const row = viewingRow;
                    setViewingRow(null);
                    handleOpenEdit(row);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Редактировать анкету
                </button>
              )}
              <button
                onClick={() => setViewingRow(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer ml-auto"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ✍️ МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ / РЕДАКТИРОВАНИЯ СОТРУДНИКА (12 ПОЛЕЙ) */}
      {/* ========================================================================= */}
      {isOpenForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">
                {editingRow ? `Редактировать анкету: ${editingRow.fullName}` : "Добавить сотрудника в состав коллектива"}
              </h3>
              <button onClick={() => setIsOpenForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Вкладки формы */}
            <div className="flex bg-slate-100 p-1 border-b border-slate-200 text-xs font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveTab("main")}
                className={`flex-1 py-2 px-3 rounded-lg transition-all ${activeTab === "main" ? "bg-white text-blue-600 shadow-sm" : "hover:text-slate-900"}`}
              >
                1. Основное
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("contacts")}
                className={`flex-1 py-2 px-3 rounded-lg transition-all ${activeTab === "contacts" ? "bg-white text-blue-600 shadow-sm" : "hover:text-slate-900"}`}
              >
                2. Контакты и адрес
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("family")}
                className={`flex-1 py-2 px-3 rounded-lg transition-all ${activeTab === "family" ? "bg-white text-blue-600 shadow-sm" : "hover:text-slate-900"}`}
              >
                3. Семья и дети
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("extra")}
                className={`flex-1 py-2 px-3 rounded-lg transition-all ${activeTab === "extra" ? "bg-white text-blue-600 shadow-sm" : "hover:text-slate-900"}`}
              >
                4. Интересы и подарки
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4" autoComplete="off">
              {/* Вкладка 1: Основное */}
              {activeTab === "main" && (
                <div className="space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ФИО сотрудника *</label>
                    <input
                      type="text"
                      name="fullName"
                      required
                      defaultValue={editingRow?.fullName || ""}
                      placeholder="Например, Сидоренко Наталья Владимировна"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Подразделение (Отдел) *</label>
                    <input
                      type="text"
                      name="department"
                      required
                      defaultValue={editingRow?.department || ""}
                      placeholder="Например, Администрация, Художественный отдел..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Должность</label>
                    <input
                      type="text"
                      name="position"
                      defaultValue={editingRow?.position || ""}
                      placeholder="Например, Руководитель студии, Паспортист..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* Вкладка 2: Контакты и адрес */}
              {activeTab === "contacts" && (
                <div className="space-y-3 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Номер телефона сот. (Мобильный)</label>
                      <input
                        type="text"
                        name="mobilePhone"
                        defaultValue={editingRow?.mobilePhone || ""}
                        placeholder="+7 (999) 000-00-00"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Номер телефона рабочий / Внутренний</label>
                      <input
                        type="text"
                        name="workPhone"
                        defaultValue={editingRow?.workPhone || ""}
                        placeholder="Каб. 204, внутр. 104"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Дата рождения</label>
                    <input
                      type="date"
                      name="birthDate"
                      defaultValue={editingRow?.birthDate ? editingRow.birthDate.split("T")[0] : ""}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Место жительства (Фактический адрес)</label>
                    <input
                      type="text"
                      name="livingAddress"
                      defaultValue={editingRow?.livingAddress || ""}
                      placeholder="г. Санкт-Петербург, ул. Ленина, д. 10, кв. 5"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                </div>
              )}

              {/* Вкладка 3: Семья, жилье и дети */}
              {activeTab === "family" && (
                <div className="space-y-3 animate-fade-in">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Социальное положение</label>
                      <select
                        name="maritalStatus"
                        defaultValue={editingRow?.maritalStatus || "Не указано"}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-800 cursor-pointer"
                      >
                        <option value="Не указано">Не указано</option>
                        <option value="Холост / Не замужем">Холост / Не замужем</option>
                        <option value="Женат / Замужем">Женат / Замужем</option>
                        <option value="В разводе">В разводе</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Есть ли жилье в собственности?</label>
                      <select
                        name="hasOwnHousing"
                        defaultValue={editingRow?.hasOwnHousing || "Да"}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:border-blue-500 text-slate-800 cursor-pointer"
                      >
                        <option value="Да">Да (в собственности)</option>
                        <option value="Ипотека">Ипотека</option>
                        <option value="Съемное жилье">Съемное жилье</option>
                        <option value="Нет">Нет</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Дети (ФИО, дата рождения, номер свидетельства о рождении)
                    </label>
                    <textarea
                      name="childrenInfo"
                      rows={3}
                      defaultValue={editingRow?.childrenInfo || ""}
                      placeholder="1. Иванов Михаил Петрович, 12.05.2018, № 123456&#10;2. Иванова София Петровна, 04.09.2021"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800 leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Вкладка 4: Личные интересы и подарки */}
              {activeTab === "extra" && (
                <div className="space-y-3 animate-fade-in">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Увлечения, от которых получаете удовольствие (Хобби)</label>
                    <textarea
                      name="hobbies"
                      rows={2}
                      defaultValue={editingRow?.hobbies || ""}
                      placeholder="Театр, путешествия, выпечка, спорт, книги..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Достижения (награды, победы, грамоты и др.)</label>
                    <textarea
                      name="achievements"
                      rows={2}
                      defaultValue={editingRow?.achievements || ""}
                      placeholder="Лауреат городского конкурса 2025, грамота комитета..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Какие подарки вам нравится получать на праздник?</label>
                    <textarea
                      name="preferredGifts"
                      rows={2}
                      defaultValue={editingRow?.preferredGifts || ""}
                      placeholder="Книги, сертификаты в книжный/косметику, сладости, чай..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Дополнительные служебные примечания</label>
                    <input
                      type="text"
                      name="notes"
                      defaultValue={editingRow?.notes || ""}
                      placeholder="Внутренние заметки руководителя..."
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpenForm(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-sm disabled:bg-blue-400 cursor-pointer"
                >
                  {isPending ? "Сохранение..." : editingRow ? "Сохранить изменения" : "Добавить в состав"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}