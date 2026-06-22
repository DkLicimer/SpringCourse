import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

// Красивые заглушки (фолбеки) по умолчанию
const FALLBACK_IMAGES = [
  { 
    id: 'f1', 
    src: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80", 
    alt: "Уютный деревянный гостевой домик" 
  },
  { 
    id: 'f2', 
    src: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=800&q=80", 
    alt: "Живописный песчаный берег" 
  },
  { 
    id: 'f3', 
    src: "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=800&q=80", 
    alt: "Сосновый бор на территории базы отдыха" 
  },
  { 
    id: 'f4', 
    src: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80", 
    alt: "Вечерняя зона отдыха у костра" 
  }
];

export default function Home() {
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  
  // Состояния динамической галереи
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(true);

  // Запрашиваем фотографии из БД при загрузке страницы
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const data = await api.getGalleryPhotos();
        setGalleryPhotos(data);
      } catch (err) {
        console.error("Не удалось загрузить фотографии галереи:", err);
      } finally {
        setIsGalleryLoading(false);
      }
    };
    fetchGallery();
  }, []);

  // Если в БД есть загруженные фото — показываем их, иначе — берем красивые фолбеки
  const displayImages = useMemo(() => {
    if (galleryPhotos.length > 0) {
      return galleryPhotos.map(p => ({
        id: p.id,
        src: p.image, // Django возвращает полный URL (например, /media/gallery/...)
        alt: p.caption || "Фотография базы отдыха ЗабГУ"
      }));
    }
    return FALLBACK_IMAGES;
  }, [galleryPhotos]);

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-16 pb-16">
      
      {/* Главный баннер */}
      <section className="relative bg-natural-blue text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-gradient-to-r from-emerald-600 to-blue-900"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 relative z-10 flex flex-col items-center text-center">
          <span className="text-xs sm:text-sm font-bold tracking-widest uppercase bg-blue-800/60 px-3 py-1 rounded-full text-blue-200 mb-4">
            Университетская база отдыха ЗабГУ
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none mb-6">
            Отдых на озере Арахлей
          </h1>
          <p className="max-w-2xl text-base sm:text-lg text-blue-100 mb-8 leading-relaxed">
            База отдыха на озере Арахлей - ваш уголок спокойствия. Специально для студентов и сотрудников ЗабГУ с выгодными условиями бронирования.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-xs sm:max-w-none">
            <Link 
              to="/booking" 
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition text-center"
            >
              Забронировать отдых
            </Link>
            <button 
              type="button"
              onClick={() => setIsRulesOpen(true)}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl border border-white/20 transition text-center"
            >
              Узнать правила пребывания
            </button>
          </div>
        </div>
      </section>

      {/* Блок информации о размещении */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Условия размещения</h2>
          <p className="text-sm text-gray-500 mt-2">Перед оформлением заявки ознакомьтесь с тарифами и типами гостевых домов базы отдыха ЗабГУ</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-natural-blue flex items-center justify-center text-lg mb-4">🏢</div>
              <h3 className="font-bold text-gray-900 text-base mb-2">Для сотрудников</h3>
              <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
                <li>Бронирование до 2 отдельных домиков на один период.</li>
                <li>Доступны любые даты и дни недели для заезда.</li>
              </ul>
            </div>
            <span className="text-xs font-bold text-natural-blue uppercase tracking-wider mt-6 block">Тариф: 610 руб. / сутки</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-natural-blue flex items-center justify-center text-lg mb-4">🎓</div>
              <h3 className="font-bold text-gray-900 text-base mb-2">Для студентов</h3>
              <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
                <li>Бронирование койко-места.</li>
                <li>Разрешен заезд как в будние, так и в выходные дни.</li>
              </ul>
            </div>
            <span className="text-xs font-bold text-natural-blue uppercase tracking-wider mt-6 block">Тариф: 100 руб. / сутки</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-natural-blue flex items-center justify-center text-lg mb-4">👶</div>
              <h3 className="font-bold text-gray-900 text-base mb-2">Отдых с детьми</h3>
              <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
                <li>Дети сотрудников до 10 лет размещаются бесплатно.</li>
                <li>Дети до 3 лет размещаются бесплатно без предоставления отдельного места.</li>
              </ul>
            </div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider mt-6 block">Семейный формат</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-natural-blue flex items-center justify-center text-lg mb-4">📄</div>
              <h3 className="font-bold text-gray-900 text-base mb-2">Заселение и выезд</h3>
              <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
                <li>Время заселения: с 14:00 до 21:00.</li>
                <li>Освобождение домиков: до 12:00 в день выезда.</li>
              </ul>
            </div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider mt-6 block">Важно знать</span>
          </div>
        </div>
      </section>

      {/* Промо-блок */}
      <section className="bg-gray-50 border-y border-gray-200 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Проведите время на природе с комфортом</h2>
            <div className="text-sm text-gray-600 leading-relaxed space-y-4">
              <p>
                Представьте: раннее утро, туман стелется над зеркальной гладью Арахлея, солнце поднимается из-за сопок, а вы пьете горячий чай на веранде домика. Здесь нет городской суеты - только легкий плеск воды, шелест деревьев и запах костра.
              </p>
              <p>
                База обустроена деревянными домиками, в которых есть все необходимое для комфортного размещения.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-gray-800 pt-2">
              <div className="flex items-center space-x-2">
                <span className="text-emerald-500">✔</span> <span>11 благоустроенных домиков</span>
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
          <div className="w-full aspect-[4/3] bg-gradient-to-br from-emerald-100 to-blue-100 rounded-2xl border border-gray-200 flex flex-col items-center justify-center text-center p-8">
            <span className="text-5xl mb-4">🌲🏕️🌊</span>
            <span className="font-bold text-gray-800 text-sm">Университетская база отдыха ЗабГУ на озере Арахлей</span>
            <span className="text-xs text-gray-500 mt-1">Место силы и комфортного отдыха</span>
          </div>
        </div>
      </section>

      {/* Блок Динамической Галереи */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Галерея базы отдыха</h2>
          <p className="text-sm text-gray-500 mt-2">Посмотрите на живописную природу Арахлея и наши уютные гостевые дома</p>
        </div>

        {/* Адаптивная сетка фотографий */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {displayImages.map((img, idx) => (
            <div
              key={img.id}
              onClick={() => setSelectedImageIndex(idx)}
              className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer border border-gray-200 shadow-xs hover:shadow-md transition-all duration-300"
            >
              <img
                src={img.src}
                alt={img.alt}
                loading="lazy"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <span className="text-white text-xs font-bold bg-white/20 backdrop-blur-xs px-3.5 py-2 rounded-full border border-white/20">
                  🔍 Увеличить
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Лайтбокс */}
      {selectedImageIndex !== null && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in touch-none select-none"
          onClick={() => setSelectedImageIndex(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedImageIndex(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl font-bold cursor-pointer p-3 z-50 transition"
          >
            ✕
          </button>

          <button
            type="button"
            onClick={handlePrevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 text-4xl sm:text-5xl font-bold cursor-pointer p-4 z-50 transition select-none"
          >
            ‹
          </button>

          <div 
            className="max-w-4xl max-h-[80vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={displayImages[selectedImageIndex].src}
              alt={displayImages[selectedImageIndex].alt}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
            />
            <p className="text-white/80 text-sm mt-4 font-semibold text-center px-4">
              {displayImages[selectedImageIndex].alt}
            </p>
          </div>

          <button
            type="button"
            onClick={handleNextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 text-4xl sm:text-5xl font-bold cursor-pointer p-4 z-50 transition select-none"
          >
            ›
          </button>
        </div>
      )}

      {/* Модальное окно правил */}
      {isRulesOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-100 flex flex-col animate-fade-in">
            
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="font-black text-gray-900 text-lg">Правила комфортного пребывания на базе отдыха ЗабГУ</h3>
              <button type="button" onClick={() => setIsRulesOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold cursor-pointer transition">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6 text-sm text-gray-700 leading-relaxed overflow-y-auto">
              <div>
                <h4 className="font-extrabold text-gray-900 mb-2 text-natural-blue flex items-center gap-1.5">🔑 Как получить путёвку:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Заявку на сайте заполняет только действующий сотрудник или студент университета.</li>
                  <li>Не передавайте путёвку другим людям.</li>
                  <li>Распечатайте путёвку, чтобы показать её при въезде.</li>
                  <li>Если вы не сможете приехать, напишите на почту <a href="mailto:projectsddm@zabgu.ru" className="text-natural-blue font-bold hover:underline">projectsddm@zabgu.ru</a> и верните путёвку в кабинет 243 на Бабушкина 129 <b>за 3 дня до заезда</b>.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-extrabold text-gray-900 mb-2 text-natural-blue flex items-center gap-1.5">⏰ Заселение и выезд:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Заселение осуществляется с 14:00 до 21:00 в день заезда.</li>
                  <li>Освободить и сдать домик необходимо строго до <b>12:00</b> в день выезда.</li>
                  <li>На территории базы можно оставаться до конца дня. В случае, если отдыхающий остается в домике после времени выезда (после 12:00), производится автоматическая доплата за еще одни полные сутки.</li>
                  <li>При въезде на базу необходимо предоставить оригинал паспорта на каждого взрослого и свидетельства о рождении детей.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-extrabold text-gray-900 mb-2 text-natural-blue flex items-center gap-1.5">🌲 Правила поведения для комфортного отдыха:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Соблюдайте режим тишины с 23:00 до 9:00.</li>
                  <li>Пребывание на территории базы отдыха с любыми домашними животными категорически запрещено.</li>
                  <li>Курить разрешено только в специально отведённых для этого местах.</li>
                  <li>Разжигать костры разрешено исключительно в определённых мануальных зонах.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-extrabold text-red-600 mb-2 flex items-center gap-1.5">🚫 Запрещено:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Употреблять алкогольные напитки на территории базы.</li>
                  <li>Самовольно переезжать в другой дом без разрешения администрации.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-extrabold text-gray-900 mb-2 text-natural-blue flex items-center gap-1.5">🛡️ За за что вы отвечаете:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Бережно относитесь к имуществу базы отдыха.</li>
                  <li>Поддерживайте чистоту и порядок в своем номере.</li>
                  <li>Соблюдайте правила совместного пребывания и избегайте конфликтных ситуаций.</li>
                  <li>Человек, получивший путевку, несет полную персональную ответственность за приглашенных им гостей и детей.</li>
                </ul>
              </div>

              <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl font-bold text-center">
                Приятного отдыха и хорошего настроения! 🌊🌲
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button type="button" onClick={() => setIsRulesOpen(false)} className="px-6 py-2 bg-natural-blue text-white rounded-lg text-xs font-bold hover:bg-opacity-90 transition cursor-pointer">
                Понятно, закрыть
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}