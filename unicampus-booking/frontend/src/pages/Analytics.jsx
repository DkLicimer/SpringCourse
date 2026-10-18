import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Building2, TreePine, DollarSign, Clock } from 'lucide-react';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/api/core/analytics/')
      .then(res => setData(res.data))
      .catch(err => {
        console.error('Ошибка загрузки аналитики:', err);
        setError('Не удалось загрузить данные аналитики с сервера.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center text-sm text-gray-500">
          <span className="animate-spin text-2xl block mb-2">⏳</span>
          Загрузка аналитики кампуса...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto my-16 text-center p-6 bg-white border border-gray-200 rounded-2xl shadow-xs">
        <p className="text-sm font-semibold text-red-600 mb-2">{error || 'Нет данных'}</p>
        <p className="text-xs text-gray-400">Убедитесь, что бэкенд перезапущен и эндпоинт активен.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-gray-900">Аналитический дашборд</h1>
        <p className="text-sm text-gray-500 mt-1">Ключевые показатели загрузки инфраструктуры университета</p>
      </div>

      {/* KPI карточки */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-gray-500 text-xs font-semibold">
            <span>ЗАЯВОК НА АУДИТОРИИ</span>
            <Building2 className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="text-3xl font-black text-gray-900">{data.spaces?.total || 0}</div>
          <div className="text-xs text-emerald-600 font-medium">Одобрено: {data.spaces?.approved || 0}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-gray-500 text-xs font-semibold">
            <span>ОЖИДАЮТ ОДОБРЕНИЯ</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600">{data.spaces?.pending || 0}</div>
          <div className="text-xs text-gray-400 font-medium">Требуют модерации</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-gray-500 text-xs font-semibold">
            <span>ПУТЁВОК БАЗЫ ОТДЫХА</span>
            <TreePine className="w-4 h-4 text-brand-accent" />
          </div>
          <div className="text-3xl font-black text-gray-900">{data.recreation?.confirmed || 0}</div>
          <div className="text-xs text-gray-500 font-medium">Всего броней: {data.recreation?.total || 0}</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-gray-500 text-xs font-semibold">
            <span>ОБЩАЯ ВЫРУЧКА БАЗЫ</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-brand-primary">
            {(data.recreation?.revenue_rub || 0).toLocaleString('ru-RU')} ₽
          </div>
          <div className="text-xs text-emerald-600 font-medium">Подтверждено бухгалтерией</div>
        </div>
      </div>

      {/* Популярные пространства */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-gray-900 uppercase">Топ востребованных аудиторий</h3>
        {!data.spaces?.popular_rooms || data.spaces.popular_rooms.length === 0 ? (
          <p className="text-xs text-gray-400">Пока нет подтвержденных мероприятий.</p>
        ) : (
          <div className="space-y-3">
            {data.spaces.popular_rooms.map((r, i) => (
              <div key={i} className="flex justify-between items-center text-xs pb-2 border-b border-gray-50">
                <span className="font-medium text-gray-800">{r.name}</span>
                <span className="font-bold bg-blue-50 text-brand-primary px-2.5 py-1 rounded-md">
                  {r.approved_count} меропр.
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}