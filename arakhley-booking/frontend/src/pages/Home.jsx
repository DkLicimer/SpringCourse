import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="space-y-16 pb-16">
      
      {/* 1. Главный баннер по ТЗ (Страница 4, Блок 3) */}
      <section className="relative bg-natural-blue text-white overflow-hidden">
        {/* Фоновый декоративный элемент (имитация озера/природы) */}
        <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-emerald-600 to-blue-900"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative z-10 flex flex-col items-center text-center">
          <span className="text-xs sm:text-sm font-bold tracking-widest uppercase bg-blue-800/60 px-3 py-1 rounded-full text-blue-200 mb-4">
            Университетская база отдыха
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-6">
            Отдых на озере Арахлей
          </h1>
          <p className="max-w-2xl text-base sm:text-lg text-blue-100 mb-8 leading-relaxed">
            Уютные деревянные домики в живописном сосновом бору на берегу одного из красивейших озёр Забайкалья. Специальные условия бронирования для сотрудников и студентов.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-xs sm:max-w-none">
            <Link 
              to="/booking" 
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition text-center"
            >
              Забронировать отдых
            </Link>
            <a 
              href="#info" 
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition text-center"
            >
              Узнать правила
            </a>
          </div>
        </div>
      </section>

      {/* 2. Блок информации о размещении по ТЗ (Страница 4, Блок 5) */}
      <section id="info" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Условия размещения и правила</h2>
          <p className="text-sm text-gray-500 mt-2">Перед оформлением заявки ознакомьтесь с правилами пребывания на территории базы отдыха.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Условия для сотрудников */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-natural-blue flex items-center justify-center text-lg mb-4">🏢</div>
              <h3 className="font-bold text-gray-900 text-base mb-2">Для сотрудников</h3>
              <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
                <li>Бронирование отдельного домика целиком.</li>
                <li>Доступны любые даты и дни недели для заезда.</li>
                <li>Возможность указать неограниченное число гостей.</li>
              </ul>
            </div>
            <span className="text-xxs font-bold text-natural-blue uppercase tracking-wider mt-6 block">Тариф: за домик</span>
          </div>

          {/* Условия для студентов */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-natural-blue flex items-center justify-center text-lg mb-4">🎓</div>
              <h3 className="font-bold text-gray-900 text-base mb-2">Для студентов</h3>
              <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
                <li>Покомнатное бронирование (койко-место).</li>
                <li>Период проживания: строго с понедельника по пятницу (будни).</li>
                <li>Льготный студенческий тариф.</li>
              </ul>
            </div>
            <span className="text-xxs font-bold text-natural-blue uppercase tracking-wider mt-6 block">Тариф: за койку</span>
          </div>

          {/* Размещение детей */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-natural-blue flex items-center justify-center text-lg mb-4">👶</div>
              <h3 className="font-bold text-gray-900 text-base mb-2">Отдых с детьми</h3>
              <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
                <li>Дети до 15 лет размещаются бесплатно и не учитываются при расчете стоимости.</li>
                <li>Дети до 3 лет размещаются бесплатно и не занимают отдельного койко-места.</li>
              </ul>
            </div>
            <span className="text-xxs font-bold text-emerald-600 uppercase tracking-wider mt-6 block">Семейный отдых</span>
          </div>

          {/* Правила заселения */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-natural-blue flex items-center justify-center text-lg mb-4">📄</div>
              <h3 className="font-bold text-gray-900 text-base mb-2">Правила заселения</h3>
              <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
                <li>При себе необходимо иметь паспорт/студенческий билет.</li>
                <li>Распечатанная или электронная версия путевки.</li>
                <li>Заселение осуществляется с 14:00, выезд — до 12:00.</li>
              </ul>
            </div>
            <span className="text-xxs font-bold text-amber-600 uppercase tracking-wider mt-6 block">Важно знать</span>
          </div>

        </div>
      </section>

      {/* 3. Промо-блок о базе отдыха */}
      <section className="bg-gray-50 border-y border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Проведите время на природе с комфортом</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Озеро Арахлей славится чистой водой и песчаными пляжами. Наша база предлагает комфортные деревянные дома, оборудованные всем необходимым для полноценного загородного отдыха. На территории оборудованы зоны для барбекю, детские площадки и спортивные зоны.
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-gray-800">
              <div className="flex items-center space-x-2">
                <span className="text-emerald-500">✔</span> <span>9 благоустроенных домиков</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-emerald-500">✔</span> <span>Зоны для отдыха и барбекю</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-emerald-500">✔</span> <span>Песчаный пляж в 100 метрах</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-emerald-500">✔</span> <span>Льготы для студентов</span>
              </div>
            </div>
          </div>
          {/* Декоративный графический блок (имитирующий фото базы отдыха для MVP) */}
          <div className="w-full aspect-[4/3] bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl border border-gray-200 flex flex-col items-center justify-center text-center p-8">
            <span className="text-5xl mb-4">🌲🏕️🌊</span>
            <span className="font-bold text-gray-800 text-sm">Университетская база отдыха на озере Арахлей</span>
            <span className="text-xs text-gray-500 mt-1">Место силы и комфортного отдыха</span>
          </div>
        </div>
      </section>

    </div>
  );
}