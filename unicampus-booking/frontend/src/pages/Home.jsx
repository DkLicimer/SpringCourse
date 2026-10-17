import React from 'react';
import { Link } from 'react-router-dom';
import { useBrand } from '../context/BrandContext';
import { Building2, TreePine, CalendarCheck, ShieldCheck } from 'lucide-react';

export default function Home() {
  const { brand } = useBrand();

  return (
    <div className="space-y-16 pb-16">
      
      {/* Главный баннер */}
      <section className="relative bg-gradient-to-br from-brand-primary to-blue-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <span className="inline-block bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold text-blue-200">
            Официальный портал {brand.university_short_name}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black font-heading tracking-tight leading-tight">
            Бронируйте пространства и базы отдыха онлайн
          </h1>
          <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Удобный инструмент для студентов и преподавателей: от репетиций в актовых залах и коворкингах до поездок выходного дня на университетские базы отдыха.
          </p>
        </div>
      </section>

      {/* Выбор направления */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Карточка 1: Пространства и аудитории */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold font-heading text-gray-900">Аудитории и пространства</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Актовые залы, коворкинги, танцевальные студии и аудитории для студенческих инициатив, лекций и мероприятий.
              </p>
              <ul className="text-xs text-gray-500 space-y-2 pt-2">
                <li className="flex items-center gap-2">✔ Интерактивный почасовой календарь (слоты 30 мин)</li>
                <li className="flex items-center gap-2">✔ Запрос звукорежиссера и оборудования</li>
                <li className="flex items-center gap-2">✔ Бесплатно для студентов и сотрудников</li>
              </ul>
            </div>
            <Link
              to="/spaces"
              className="mt-8 block w-full py-3 bg-brand-primary hover:opacity-90 text-white font-bold rounded-xl text-center text-sm transition"
            >
              Выбрать помещение →
            </Link>
          </div>

          {/* Карточка 2: Базы отдыха */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm hover:shadow-md transition flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-brand-accent flex items-center justify-center">
                <TreePine className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold font-heading text-gray-900">Базы отдыха и кампус</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Посуточный заезд на загородные базы отдыха и студенческие лагеря университета для отдыха на природе.
              </p>
              <ul className="text-xs text-gray-500 space-y-2 pt-2">
                <li className="flex items-center gap-2">✔ Льготные тарифы для студентов и преподавателей</li>
                <li className="flex items-center gap-2">✔ Выбор домиков и отдельных койко-мест</li>
                <li className="flex items-center gap-2">✔ Оплата по реквизитам и получение официальной путёвки</li>
              </ul>
            </div>
            <Link
              to="/recreation"
              className="mt-8 block w-full py-3 bg-brand-accent hover:opacity-90 text-white font-bold rounded-xl text-center text-sm transition"
            >
              Забронировать отдых →
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}