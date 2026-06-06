import React from 'react';

// Координаты размещения 9 домиков на нашей SVG-сцене (сетка 3х3 для простоты)
const CABIN_POSITIONS = [
  { number: 1, x: 150, y: 160, label: "Домик 1" },
  { number: 2, x: 370, y: 160, label: "Домик 2" },
  { number: 3, x: 590, y: 160, label: "Домик 3" },
  { number: 4, x: 150, y: 270, label: "Домик 4" },
  { number: 5, x: 370, y: 270, label: "Домик 5" },
  { number: 6, x: 590, y: 270, label: "Домик 6" },
  { number: 7, x: 150, y: 380, label: "Домик 7" },
  { number: 8, x: 370, y: 380, label: "Домик 8" },
  { number: 9, x: 590, y: 380, label: "Домик 9" },
];

export default function InteractiveMap({ cabinsData, selectedCabin, onCabinSelect, isLoading }) {
  
  // Метод для получения статуса конкретного домика из данных API
  const getCabinStatus = (cabinNumber) => {
    if (isLoading || !cabinsData) return { isAvailable: true, data: null };
    
    const cabin = cabinsData.find(c => c.number === cabinNumber);
    return {
      isAvailable: cabin ? cabin.is_available : true,
      data: cabin
    };
  };

  return (
    <div className="w-full bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Интерактивная карта базы отдыха</h3>
          <p className="text-xs text-gray-500">Выберите свободный домик на схеме</p>
        </div>
        
        {/* Легенда карты по ТЗ */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 bg-emerald-500 border border-emerald-600 rounded"></span>
            <span className="text-gray-600 font-medium">Свободен</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 bg-rose-500 border border-rose-600 rounded"></span>
            <span className="text-gray-600 font-medium">Занят</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 bg-blue-500 border border-blue-600 rounded"></span>
            <span className="text-gray-600 font-medium font-bold">Выбран вами</span>
          </div>
        </div>
      </div>

      {/* Контейнер адаптивной SVG-карты */}
      <div className="relative w-full aspect-[8/5] bg-emerald-50 rounded-lg overflow-hidden border border-gray-100">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="flex items-center space-x-2 text-natural-blue">
              <span className="animate-spin text-lg">⏳</span>
              <span className="font-medium text-sm">Проверка доступности мест...</span>
            </div>
          </div>
        )}

        <svg 
          viewBox="0 0 800 500" 
          className="w-full h-full select-none"
        >
          {/* 1. Озеро Арахлей в верхней части карты */}
          <path 
            d="M 0 0 L 800 0 L 800 70 Q 400 110 0 70 Z" 
            fill="#BFDBFE" 
          />
          <text x="400" y="45" fill="#1E40AF" fontSize="14" fontWeight="bold" textAnchor="middle" opacity="0.7 font-family-sans">
            ОЗЕРО АРАХЛЕЙ
          </text>

          {/* 2. Песчаный пляж */}
          <path 
            d="M 0 70 Q 400 110 800 70 L 800 100 Q 400 140 0 100 Z" 
            fill="#FEF3C7" 
          />

          {/* 3. Лесные дорожки */}
          {/* Центральная аллея */}
          <path d="M 385 100 L 415 100 L 415 500 L 385 500 Z" fill="#E5E7EB" />
          {/* Горизонтальные тропинки */}
          <path d="M 0 210 L 800 210 L 800 225 L 0 225 Z" fill="#E5E7EB" opacity="0.8" />
          <path d="M 0 325 L 800 325 L 800 340 L 0 340 Z" fill="#E5E7EB" opacity="0.8" />

          {/* 4. Отрисовка 9 Домиков */}
          {CABIN_POSITIONS.map((pos) => {
            const { isAvailable, data } = getCabinStatus(pos.number);
            const isSelected = selectedCabin === pos.number;

            // Стилизация цвета в зависимости от состояния домика
            let rectFill = "#10B981"; // Свободен (emerald-500)
            let rectStroke = "#047857";
            let cursorStyle = "cursor-pointer";

            if (!isAvailable) {
              rectFill = "#EF4444"; // Занят (rose-500)
              rectStroke = "#B91C1C";
              cursorStyle = "cursor-not-allowed";
            }
            if (isSelected) {
              rectFill = "#3B82F6"; // Выбран (blue-500)
              rectStroke = "#1D4ED8";
            }

            return (
              <g 
                key={pos.number}
                className={`transition-all duration-200 ${cursorStyle}`}
                onClick={() => isAvailable && onCabinSelect(pos.number)}
              >
                {/* Крыша домика (треугольник) */}
                <polygon 
                  points={`${pos.x - 45},${pos.y - 15} ${pos.x},${pos.y - 45} ${pos.x + 45},${pos.y - 15}`} 
                  fill={isSelected ? "#1D4ED8" : "#8B5A2B"} 
                />
                
                {/* Тело домика (прямоугольник) */}
                <rect 
                  x={pos.x - 40} 
                  y={pos.y - 15} 
                  width="80" 
                  height="60" 
                  rx="6" 
                  fill={rectFill} 
                  stroke={rectStroke}
                  strokeWidth={isSelected ? "3" : "1.5"}
                  className="transition-all duration-200"
                />

                {/* Дверь */}
                <rect x={pos.x - 10} y={pos.y + 15} width="20" height="30" fill="#F3F4F6" stroke="#D1D5DB" />
                {/* Окошко */}
                <rect x={pos.x - 30} y={pos.y} width="16" height="16" rx="2" fill="#FFEFD5" stroke="#D1D5DB" />
                <rect x={pos.x + 14} y={pos.y} width="16" height="16" rx="2" fill="#FFEFD5" stroke="#D1D5DB" />

                {/* Табличка с номером */}
                <rect x={pos.x - 30} y={pos.y - 30} width="60" height="16" rx="3" fill="#FFF" stroke="#4B5563" strokeWidth="1" />
                <text 
                  x={pos.x} 
                  y={pos.y - 18} 
                  fill="#1F2937" 
                  fontSize="10" 
                  fontWeight="bold" 
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  ДОМИК {pos.number}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Краткое описание выбранного домика под картой по ТЗ (Страница 6) */}
      {selectedCabin && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
          <div>
            <h4 className="font-bold text-gray-900 text-sm sm:text-base">Выбран Домик №{selectedCabin}</h4>
            <p className="text-xs text-gray-600 mt-1"> Вместимость: 4 взрослых места. Дети до 15 лет размещаются бесплатно.</p>
          </div>
          <div className="text-right w-full sm:w-auto">
            <span className="text-xs text-gray-500 block">Стоимость:</span>
            <span className="text-base sm:text-lg font-extrabold text-natural-blue">
              {cabinsData?.find(c => c.number === selectedCabin)?.price_staff_full_cabin} руб. / сутки
            </span>
          </div>
        </div>
      )}
    </div>
  );
}