import React from 'react';
import { BookOpen, Users, QrCode, CheckSquare, Award } from 'lucide-react';

function MobileBottomNav({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'overview', label: 'Дашборд', icon: BookOpen },
    { id: 'students', label: 'Паспорт', icon: Users },
    { id: 'attendance', label: 'Явка', icon: QrCode },
    { id: 'tasks', label: 'Задачи', icon: CheckSquare },
    { id: 'rating', label: 'Рейтинг', icon: Award },
  ];

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-zab-navy border-t border-slate-700 px-2 py-1.5 flex justify-around items-center text-white text-[10px]">
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)} 
            className={`flex flex-col items-center p-1 transition-colors cursor-pointer ${
              isActive ? 'text-zab-teal font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <IconComponent className="h-4 w-4 mb-0.5" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default MobileBottomNav;