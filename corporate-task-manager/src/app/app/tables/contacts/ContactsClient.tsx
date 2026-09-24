// src/app/app/tables/contacts/ContactsClient.tsx
"use client";

import React, { useState, useTransition } from "react";
import { createContact, deleteContact } from "@/server/actions/tables";
import { Search, UserPlus, Trash2, ArrowLeft, Phone, Mail, MapPin, X } from "lucide-react";
import Link from "next/link";

type Contact = {
  id: string;
  fullName: string;
  department: string;
  position: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

interface ContactsClientProps {
  initialContacts: Contact[];
  isAdmin: boolean;
}

export function ContactsClient({ initialContacts, isAdmin }: ContactsClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filteredContacts = initialContacts.filter(
    (c) =>
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm)) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await createContact(formData);
        setIsOpen(false);
      } catch (err: any) {
        setError(err.message || "Ошибка добавления контакта");
      }
    });
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Вы уверены, что хотите удалить контакт "${name}" из телефонной книги?`)) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteContact(id);
      } catch (err: any) {
        alert(err.message || "Ошибка при удалении контакта");
      }
    });
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
          <h2 className="text-2xl font-bold text-slate-800">Справочник контактов</h2>
          <p className="text-slate-500 text-sm">Общая телефонная книга и структура подразделений компании</p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm w-full sm:w-auto cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            Добавить контакт
          </button>
        )}
      </div>

      {/* Поиск */}
      <div className="relative max-w-md bg-white rounded-lg shadow-sm">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Поиск по ФИО, должности, телефону..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800 placeholder-slate-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ========================================================================= */}
      {/* 💻 ДЕСКТОПНАЯ ВЕРСИЯ ТАБЛИЦЫ С ПРОКРУТКОЙ */}
      {/* ========================================================================= */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ФИО</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Подразделение</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Должность</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Контакты</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Примечание</th>
              {isAdmin && <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Действия</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredContacts.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-6 py-8 text-center text-slate-400 text-sm">
                  Контакты не найдены
                </td>
              </tr>
            ) : (
              filteredContacts.map((contact) => (
                <tr key={contact.id} className="hover:bg-slate-50/50 transition-colors text-sm">
                  <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">{contact.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-700">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" /> {contact.department}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{contact.position}</td>
                  <td className="px-6 py-4 whitespace-nowrap space-y-1">
                    {contact.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Phone className="h-3.5 w-3.5 text-slate-400" /> {contact.phone}
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Mail className="h-3.5 w-3.5 text-slate-400" /> {contact.email}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={contact.notes || ""}>
                    {contact.notes || "—"}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDelete(contact.id, contact.fullName)}
                        disabled={isPending}
                        className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center cursor-pointer"
                        title="Удалить контакт"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* 📱 МОБИЛЬНАЯ ВЕРСИЯ КАРТОЧЕК */}
      {/* ========================================================================= */}
      <div className="block md:hidden space-y-4">
        {filteredContacts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm bg-white rounded-xl border">
            Контакты не найдены
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <div key={contact.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                <div>
                  <div className="font-bold text-slate-900 text-base leading-snug">{contact.fullName}</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-medium">{contact.position}</div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(contact.id, contact.fullName)}
                    disabled={isPending}
                    className="text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{contact.department}</span>
                </div>
                {contact.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <a href={`tel:${contact.phone}`} className="hover:underline">{contact.phone}</a>
                  </div>
                )}
                {contact.email && (
                  <div className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <a href={`mailto:${contact.email}`} className="hover:underline">{contact.email}</a>
                  </div>
                )}
              </div>

              {contact.notes && (
                <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic leading-relaxed">
                  {contact.notes}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* МОДАЛЬНОЕ ОКНО */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl border border-slate-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-800">Добавить контакт в книгу</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 p-4 text-xs text-red-600 border border-red-100">
                  {error}
                </div>
              )}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ФИО сотрудника</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="Например, Иванов Иван"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Подразделение</label>
                    <input
                      type="text"
                      name="department"
                      required
                      placeholder="Отдел маркетинга"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Должность</label>
                    <input
                      type="text"
                      name="position"
                      required
                      placeholder="Специалист"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Телефон</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="+7 (999) 123-45-67"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Почта (Email)</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="email@company.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Примечание</label>
                  <textarea
                    name="notes"
                    rows={2}
                    placeholder="Внутренний номер, кабинет и т.д."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 text-slate-800"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:bg-blue-400 cursor-pointer"
                >
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}