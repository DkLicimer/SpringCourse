import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Building2, Calendar, TreePine, Users, Award, 
  Home, Plane, ShieldCheck, GraduationCap, LogOut, Clock
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
  const { user, logout } = useAuth();

  const isCuratorOrAdmin = user && ['ADMIN', 'CURATOR', 'HEAD_CURATOR'].includes(user.role);
  const isDDMOfficer = user && (user.is_ddm_officer || user.role === 'OFFICER_DDM');

  const navItems = [
    { id: 'calendar', label: 'Календарный план', icon: Calendar },
    { id: 'spaces', label: 'Аудитории', icon: Building2 },
    { id: 'recreation', label: 'База отдыха', icon: TreePine },
    ...(isCuratorOrAdmin ? [{ id: 'curators', label: 'Кураторы и Группы', icon: Users }] : []),
    { id: 'rating', label: 'Рейтинг ПГАС', icon: Award },
    { id: 'dormitories', label: 'Общежития', icon: Home },
    { id: 'mobility', label: 'Мобильность', icon: Plane },
    { id: 'learning', label: 'Обучение', icon: GraduationCap },
    ...(isDDMOfficer ? [{ id: 'ddm', label: 'Контур ДДМ (152-ФЗ)', icon: ShieldCheck, isSecure: true }] : []),
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Логотип */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
            U
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-white text-sm block leading-tight">
              ЗабГУ • UniCampus
            </span>
            <span className="text-[10px] text-blue-400 block font-semibold flex items-center">
              <Clock className="w-3 h-3 mr-1" /> Чита (UTC+9)
            </span>
          </div>
        </div>

        {/* Навигационное меню */}
        <nav className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-1">
          {navItems.map((item) => {
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

        {/* Пользователь и Выход */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-bold text-white truncate max-w-[150px]">
              {user?.full_name}
            </span>
            <span className="text-[10px] text-blue-400 font-semibold uppercase">
              {user?.role}
            </span>
          </div>

          <button
            onClick={logout}
            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-950/30 rounded-xl cursor-pointer transition-colors"
            title="Выйти из системы"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

      </div>
    </header>
  );
}