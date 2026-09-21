import React from 'react';
import { Bell, Clock, Shield, LogOut } from 'lucide-react';
import logoHorizontal from '../../assets/logo_horizontal.png';
import logoCrest from '../../assets/logo_crest.png';
import { formatChitaTime } from '../../utils/dateUtils';

function Navbar({ 
  user, 
  notifications, 
  unreadNotifsCount, 
  showNotifications, 
  setShowNotifications, 
  onReadAllNotifications, 
  onReadNotification, 
  onLogout 
}) {
  return (
    <nav className="bg-zab-navy sticky top-0 z-30 px-4 md:px-6 py-3 flex items-center justify-between shadow-lg text-white">
      {/* Логотипы и время Читы */}
      <div className="flex items-center space-x-3">
        <img src={logoHorizontal} alt="ЗабГУ" className="hidden md:block h-10 w-auto object-contain" />
        <img src={logoCrest} alt="ЗабГУ" className="block md:hidden h-8 w-auto object-contain" />
        <div className="border-l border-slate-700 pl-3 hidden sm:block">
          <span className="text-xs uppercase tracking-widest text-slate-300 font-bold block">Электронная книжка куратора</span>
          <span className="text-[10px] text-zab-teal font-semibold flex items-center">
            <Clock className="h-3 w-3 mr-1" /> Чита (UTC+9): {formatChitaTime(new Date(), { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Правая часть: Уведомления, Профиль, Выход */}
      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Колокольчик уведомлений */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)} 
            className="relative p-2 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Уведомления"
          >
            <Bell className="h-5 w-5" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-500 text-white font-black text-[9px] h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-2 max-h-96 overflow-y-auto">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs uppercase">Уведомления</span>
                {unreadNotifsCount > 0 && (
                  <button 
                    onClick={onReadAllNotifications} 
                    className="text-xs text-zab-teal hover:underline font-bold cursor-pointer"
                  >
                    Прочитать все
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-100">
                {notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    onClick={() => !notif.is_read && onReadNotification(notif.id)} 
                    className={`p-3 text-xs cursor-pointer hover:bg-slate-50 transition-colors ${!notif.is_read ? 'bg-zab-teal/10 font-bold border-l-4 border-zab-teal' : ''}`}
                  >
                    <p className="text-slate-700 leading-relaxed">{notif.text}</p>
                    <span className="text-[10px] text-slate-400 mt-1 block">{formatChitaTime(notif.created_at)}</span>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="p-4 text-center text-slate-400 text-xs">Нет новых уведомлений.</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Профиль пользователя */}
        <span className="text-xs bg-zab-blue px-2.5 py-1.5 rounded-lg text-slate-200 font-semibold hidden md:flex items-center border border-slate-700">
          <Shield className="h-3.5 w-3.5 mr-1.5 text-zab-teal" />
          <span className="text-white mr-1">{user?.username}</span> 
          <span className="text-slate-400">({user?.system_role})</span>
        </span>

        {/* Кнопка выхода */}
        <button 
          onClick={onLogout} 
          className="flex items-center text-red-400 hover:text-red-300 font-bold text-xs p-1.5 cursor-pointer transition-colors"
        >
          <LogOut className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Выйти</span>
        </button>
      </div>
    </nav>
  );
}

export default Navbar;