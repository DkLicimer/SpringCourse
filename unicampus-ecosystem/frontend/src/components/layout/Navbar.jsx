import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, Calendar, TreePine, Users, Award, 
  Home, Plane, ShieldCheck, GraduationCap, LogOut, User as UserIcon
} from 'lucide-react';

// Строгая матрица сервисов для каждой роли (без ЛК, так как ЛК открывается кликом по профилю)
const ROLE_TABS = {
  STUDENT: ['calendar', 'rating', 'dormitories', 'mobility', 'learning', 'spaces', 'recreation'],
  CURATOR: ['curators', 'calendar', 'mobility', 'learning', 'spaces', 'recreation'],
  HEAD_CURATOR: ['curators', 'calendar', 'rating', 'mobility', 'learning', 'spaces', 'recreation'],
  STAFF: ['calendar', 'spaces', 'recreation', 'learning'],
  MODERATOR_SPACES: ['spaces', 'calendar', 'recreation'],
  MODERATOR_RATING: ['rating', 'calendar'],
  MODERATOR_DDM: ['ddm'],
  ADMIN: ['calendar', 'spaces', 'recreation', 'curators', 'rating', 'dormitories', 'mobility', 'learning', 'ddm'],
};

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  const allNavItems = [
    { id: 'calendar', label: 'Календарный план', icon: Calendar },
    { id: 'rating', label: 'Рейтинг ПГАС', icon: Award },
    { id: 'dormitories', label: 'Общежития', icon: Home },
    { id: 'mobility', label: 'Мобильность', icon: Plane },
    { id: 'learning', label: 'Обучение', icon: GraduationCap },
    { id: 'spaces', label: 'Аудитории', icon: Building2 },
    { id: 'recreation', label: 'База отдыха', icon: TreePine },
    { id: 'curators', label: 'Кураторы и Группы', icon: Users },
    { id: 'ddm', label: 'Контур ДДМ (152-ФЗ)', icon: ShieldCheck, isSecure: true },
  ];

  // Фильтрация доступных сервисов под роль пользователя
  const allowedTabIds = user?.role ? (ROLE_TABS[user.role] || []) : [];
  const visibleNavItems = allNavItems.filter(item => allowedTabIds.includes(item.id));

  const isProfileActive = activeTab === 'profile';

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 text-white shadow-md select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Логотип ЗабГУ (клик возвращает в ЛК) */}
        <div 
          onClick={() => setActiveTab('profile')}
          className="flex items-center space-x-3 shrink-0 cursor-pointer group"
          title="Перейти в Личный кабинет"
        >
          <div className="w-10 h-10 rounded-2xl bg-blue-600 group-hover:bg-blue-500 text-white flex items-center justify-center font-black text-lg shadow-sm transition">
            U
          </div>
          <div>
            <span className="font-extrabold text-white text-sm block leading-tight tracking-tight">
              ЗабГУ • UniCampus
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">
              Единый студенческий портал
            </span>
          </div>
        </div>

        {/* Навигационное меню сервисов (скрыт скроллбар) */}
        <nav className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-1">
          {visibleNavItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? item.isSecure
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-blue-600 text-white shadow'
                    : item.isSecure
                    ? 'text-purple-300 hover:bg-purple-950/40 hover:text-purple-200'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Блок Личного Кабинета (кликабельный профиль) и Выход */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-2xl border transition cursor-pointer text-left ${
              isProfileActive
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-xs'
                : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 text-slate-200'
            }`}
            title="Открыть Личный кабинет"
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
              isProfileActive ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
            }`}>
              <UserIcon className="w-4 h-4" />
            </div>

            <div className="hidden md:flex flex-col">
              <span className="text-xs font-bold truncate max-w-[140px] leading-tight">
                {user?.full_name ? user.full_name.split(' ')[0] + ' ' + (user.full_name.split(' ')[1] || '') : 'Профиль'}
              </span>
              <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
          </button>

          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-colors"
            title="Выйти из системы"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}