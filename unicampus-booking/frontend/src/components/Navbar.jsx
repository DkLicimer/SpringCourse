import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useBrand } from '../context/BrandContext';
import { Building2, TreePine, Phone } from 'lucide-react';

export default function Navbar() {
  const { brand } = useBrand();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Логотип и наименование */}
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition">
          {brand.logo ? (
            <img src={brand.logo} alt={brand.university_short_name} className="h-10 object-contain" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-brand-primary text-white flex items-center justify-center font-bold text-lg shadow-sm">
              {brand.university_short_name ? brand.university_short_name[0] : 'U'}
            </div>
          )}
          <div>
            <span className="font-heading font-bold text-gray-900 text-sm sm:text-base block leading-tight">
              {brand.university_short_name} Пространства
            </span>
            <span className="text-[10px] sm:text-xs text-gray-500 block leading-none">
              Единый сервис бронирования
            </span>
          </div>
        </Link>

        {/* Навигационные ссылки */}
        <nav className="flex items-center gap-2">
          <Link
            to="/spaces"
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              isActive('/spaces')
                ? 'bg-blue-50 text-brand-primary font-bold'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Аудитории и пространства</span>
            <span className="sm:hidden">Аудитории</span>
          </Link>
          <Link
            to="/recreation"
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              isActive('/recreation')
                ? 'bg-emerald-50 text-brand-accent font-bold'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <TreePine className="w-4 h-4" />
            <span className="hidden sm:inline">Базы отдыха и кампус</span>
            <span className="sm:hidden">Базы отдыха</span>
          </Link>
        </nav>

        {/* Контакты вуза (кнопка модератора полностью убрана) */}
        <div className="flex items-center gap-3">
          {brand.contact_phone && (
            <a href={`tel:${brand.contact_phone}`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-brand-primary font-semibold">
              <Phone className="w-3.5 h-3.5 text-brand-primary" />
              <span className="hidden lg:inline">{brand.contact_phone}</span>
            </a>
          )}
        </div>

      </div>
    </header>
  );
}