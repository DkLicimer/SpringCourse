import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  User, Award, Home, Plane, GraduationCap, 
  QrCode, Star, Building2, CheckCircle2, Copy, Check
} from 'lucide-react';

export default function ProfileView({ setActiveTab }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.get('/auth/profile-summary')
      .then(res => setSummary(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const st = summary?.student_profile;

  const handleCopyQrToken = () => {
    if (st?.qr_token) {
      navigator.clipboard.writeText(st.qr_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-slate-400 font-mono">
        Загрузка личного кабинета ЗабГУ...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      {/* Главная карточка студента / сотрудника */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-600/30 border-2 border-blue-400/40 rounded-3xl flex items-center justify-center font-black text-2xl text-white shadow-inner">
              {user?.full_name ? user.full_name[0] : 'U'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600/40 border border-blue-400/50 text-blue-200 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                  {user?.role}
                </span>
                {st?.is_starosta && (
                  <span className="bg-amber-500/30 border border-amber-400/50 text-amber-200 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> Староста группы
                  </span>
                )}
                {st?.is_union_member && (
                  <span className="bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    Профком ✓
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">{user?.full_name}</h1>
              <p className="text-xs text-slate-300">
                {st ? `${st.faculty} • Группа ${st.group_name} (${st.course} курс)` : user?.email}
              </p>
            </div>
          </div>

          {/* Цифровой студенческий QR-пропуск для отметки на занятиях */}
          {st && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center space-x-4 self-stretch md:self-auto">
              <div className="w-14 h-14 bg-white p-1 rounded-xl shadow shrink-0 flex items-center justify-center">
                <QrCode className="w-12 h-12 text-slate-900" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-300 block">QR-пропуск на занятия:</span>
                <span className="font-mono text-xs font-black block text-blue-200">
                  {st.qr_token.substring(0, 14)}...
                </span>
                <button
                  onClick={handleCopyQrToken}
                  className="text-[10px] text-blue-300 hover:text-white flex items-center gap-1 cursor-pointer font-bold"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Скопировано!' : 'Скопировать токен'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Сетка модулей студента */}
      {st ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Рейтинг ПГАС */}
          <div 
            onClick={() => setActiveTab('rating')}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1">
              <div className="flex justify-between items-center text-slate-400 font-bold">
                <span>Рейтинг ПГАС</span>
                <Award className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-600">{st.pgas_points} баллов</div>
              <p className="text-[11px] text-slate-500">Портфолио достижений на стипендию</p>
            </div>
            <span className="text-[11px] font-bold text-blue-600 hover:underline">
              Открыть портфолио →
            </span>
          </div>

          {/* 2. Общежитие */}
          <div 
            onClick={() => setActiveTab('dormitories')}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1">
              <div className="flex justify-between items-center text-slate-400 font-bold">
                <span>Общежитие</span>
                <Home className="w-4 h-4 text-blue-600" />
              </div>
              {st.dormitory ? (
                <>
                  <div className="text-sm font-extrabold text-slate-900">
                    Комн. {st.dormitory.room_number}, койка #{st.dormitory.bed_number}
                  </div>
                  <p className="text-[11px] text-emerald-600 font-bold">
                    Ордер: {st.dormitory.order_number}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-sm font-bold text-slate-400">Не заселен</div>
                  <p className="text-[11px] text-slate-500">Подайте заявление на место</p>
                </>
              )}
            </div>
            <span className="text-[11px] font-bold text-blue-600 hover:underline">
              {st.dormitory ? 'Карточка комнаты →' : 'Подать заявку →'}
            </span>
          </div>

          {/* 3. Мобильность */}
          <div 
            onClick={() => setActiveTab('mobility')}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1">
              <div className="flex justify-between items-center text-slate-400 font-bold">
                <span>Командировки</span>
                <Plane className="w-4 h-4 text-blue-600" />
              </div>
              {st.mobility_trip ? (
                <>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {st.mobility_trip.title}
                  </div>
                  <p className="text-[11px] text-blue-600 font-bold">
                    {st.mobility_trip.status}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-sm font-bold text-slate-400">Нет поездок</div>
                  <p className="text-[11px] text-slate-500">Конференции и хакатоны</p>
                </>
              )}
            </div>
            <span className="text-[11px] font-bold text-blue-600 hover:underline">
              Оформить поездку →
            </span>
          </div>

          {/* 4. Обучение и сертификаты */}
          <div 
            onClick={() => setActiveTab('learning')}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1">
              <div className="flex justify-between items-center text-slate-400 font-bold">
                <span>Обучение LMS</span>
                <GraduationCap className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-600">{st.certificates_count}</div>
              <p className="text-[11px] text-slate-500">Пройдено обязательных курсов</p>
            </div>
            <span className="text-[11px] font-bold text-blue-600 hover:underline">
              Каталог курсов →
            </span>
          </div>
        </div>
      ) : (
        /* Для сотрудников и кураторов */
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs space-y-2">
          <h3 className="font-bold text-sm text-slate-900">Служебный профиль сотрудника</h3>
          <p className="text-slate-500">
            Вам доступны модули платформы согласно назначенным ролям в системе.
            {summary?.curator_profile?.assigned_groups?.length > 0 && (
              <span className="block mt-1 text-blue-600 font-bold">
                Закрепленные группы: {summary.curator_profile.assigned_groups.join(', ')}
              </span>
            )}
          </p>
        </div>
      )}

      {/* Быстрые действия */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-slate-900">Сервисы кампуса</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveTab('calendar')}
            className="p-3 bg-slate-50 hover:bg-blue-50 border rounded-2xl text-left transition cursor-pointer"
          >
            <span className="font-bold text-slate-900 block">Календарный план</span>
            <span className="text-[11px] text-slate-400">События и расписание</span>
          </button>

          <button
            onClick={() => setActiveTab('spaces')}
            className="p-3 bg-slate-50 hover:bg-blue-50 border rounded-2xl text-left transition cursor-pointer"
          >
            <span className="font-bold text-slate-900 block">Аудитории</span>
            <span className="text-[11px] text-slate-400">Бронирование залов</span>
          </button>

          <button
            onClick={() => setActiveTab('recreation')}
            className="p-3 bg-slate-50 hover:bg-blue-50 border rounded-2xl text-left transition cursor-pointer"
          >
            <span className="font-bold text-slate-900 block">База отдыха</span>
            <span className="text-[11px] text-slate-400">Озеро Арахлей</span>
          </button>

          <button
            onClick={() => setActiveTab('rating')}
            className="p-3 bg-slate-50 hover:bg-blue-50 border rounded-2xl text-left transition cursor-pointer"
          >
            <span className="font-bold text-slate-900 block">Рейтинг ПГАС</span>
            <span className="text-[11px] text-slate-400">Подать грамоту</span>
          </button>
        </div>
      </div>
    </div>
  );
}