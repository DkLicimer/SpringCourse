import React from 'react';

const CABIN_POSITIONS = [
  { number: 1, x: 130, y: 160, label: "Домик 1" },
  { number: 2, x: 290, y: 160, label: "Домик 2" },
  { number: 7, x: 450, y: 160, label: "Домик 7" },
  { number: 8, x: 610, y: 160, label: "Домик 8" },
  { number: 9, x: 130, y: 280, label: "Домик 9" },
  { number: 10, x: 290, y: 280, label: "Домик 10" },
  { number: 11, x: 450, y: 280, label: "Домик 11" },
  { number: 12, x: 610, y: 280, label: "Домик 12" },
  { number: 13, x: 130, y: 400, label: "Домик 13" },
  { number: 14, x: 290, y: 400, label: "Домик 14" },
  { number: 15, x: 450, y: 400, label: "Домик 15" },
];

const CABIN_EQUIPMENT = {
  1: {
    beds: "4 односпальные кровати, 1 раздвижной диван (2 места)",
    furniture: "Стенка мебельная (2 шт), кресло, трюмо, шифоньер, 2 кухонных стола, 7 стульев, шторы и гардины (по 4 комплекта)",
    linen: "4 комплекта постельного белья, 5 пикейных покрывала, 5 шерстяные покрывала",
    kitchen: "Посуда на 4 персоны, полотенца лицевые и банные (по 4 шт), умывальник, совок, ведра (2 шт), швабра, разделочная доска, нож, тазы для посуды и гигиены",
    appliances: "Электроплита (3 конфорки), газовая печь с баллоном газа, холодильник, электрический чайник"
  },
  2: {
    beds: "3 односпальные кровати",
    furniture: "Шифоньер, 2 кухонных стола, шторы (4 комплекта), гардины (2 шт)",
    linen: "3 комплекта постельного белья, 3 пикейных покрывала, 3 шерстяные покрывала",
    kitchen: "Посуда на 3 персоны, полотенца лицевые и банные (по 3 шт), умывальник, совок, ведра (2 шт), веник, швабра, разделочная доска, тазы (2 шт), ветошь",
    appliances: "Газовая плита с тумбой и баллоном газа, холодильник, электрический чайник"
  },
  7: {
    beds: "4 односпальные кровати",
    furniture: "Шифоньер (2 шт), 2 кухонных стола, 2 стула, шторы (2 комплекта), тюли (2 шт), гардины (2 шт)",
    linen: "4 комплекта постельного белья",
    kitchen: "Посуда на 4 персоны, полотенца лицевые и банные (по 4 шт), швабра, ветошь",
    appliances: "Газовая плита с тумбой, холодильник"
  },
  8: {
    beds: "4 односпальные кровати",
    furniture: "Шифоньер, 2 кухонных стола, 4 стула, шторы (3 комплекта), гардины (3 шт)",
    linen: "4 комплекта постельного белья",
    kitchen: "Посуда на 4 персоны, полотенца лицевые и банные (по 4 шт), умывальник, ведро (2 шт), швабра, ветошь",
    appliances: "Газовая плита с тумбой, холодильник, электрический чайник"
  },
  9: {
    beds: "4 односпальные кровати",
    furniture: "Шифоньер, 2 кухонных стола, 4 стула, шторы (3 комплекта), гардины (3 шт)",
    linen: "4 комплекта постельного белья",
    kitchen: "Посуда на 4 персоны, полотенца лицевые и банные (по 4 шт), швабра, ветошь",
    appliances: "Газовая плита с тумбой, холодильник"
  },
  10: {
    beds: "4 односпальные кровати",
    furniture: "Шифоньер, 2 кухонных стола, 4 стула, шторы (3 комплекта), гардины (3 шт)",
    linen: "4 комплекта постельного белья",
    kitchen: "Посуда на 4 персоны, полотенца лицевые и банные (по 4 шт), швабра, ветошь",
    appliances: "Газовая плита с тумбой, холодильник"
  },
  11: {
    beds: "4 односпальные кровати",
    furniture: "Шифоньер, 2 кухонных стола, 4 стула, шторы (3 комплекта), гардины (3 шт)",
    linen: "4 комплекта постельного белья",
    kitchen: "Посуда на 4 персоны, полотенца лицевые и банные (по 4 шт), швабра, ветошь",
    appliances: "Газовая плита с тумбой, холодильник"
  },
  12: {
    beds: "3 односпальные кровати",
    furniture: "Шифоньер, 1 кухонный стол, 6 стульев, шторы (1 комплект), тюль (1 шт), гардины (1 шт)",
    linen: "3 комплекта постельного белья",
    kitchen: "Посуда на 3 персоны, полотенца лицевые и банные (по 3 шт), швабра, ветошь",
    appliances: "Газовая плита с тумбой, холодильник"
  },
  13: {
    beds: "4 односпальные кровати",
    furniture: "Шифоньер, 2 кухонных стола, 4 стула, шторы (3 комплекта), гардины (3 шт)",
    linen: "4 комплекта постельного белья",
    kitchen: "Посуда на 4 персоны, полотенца лицевые и банные (по 4 шт), швабра, ветошь",
    appliances: "Газовая плита с тумбой, холодильник"
  },
  14: {
    beds: "2 двуспальные кровати (комфортное размещение до 4 человек)",
    furniture: "Прикроватные тумбочки (2 шт), шифоньер (2 шт), 2 кухонных стола, 4 стула, шторы (4 комплекта)",
    linen: "4 комплекта постельного белья",
    kitchen: "Посуда на 8 персон, полотенца лицевые и банные (по 4 шт), ведра (2 шт), швабра, ветошь (2 шт)",
    appliances: "Газовая плита с тумбой, 2 холодильника, 2 электрических чайника"
  },
  15: {
    beds: "2 двуспальные кровати (комфортное размещение до 4 человек)",
    furniture: "Прикроватные тумбочки (2 шт), шифоньер (2 шт), 2 кухонных стола, 4 стула, шторы (4 комплекта)",
    linen: "4 комплекта постельного белья",
    kitchen: "Посуда на 8 персон, полотенца лицевые и банные (по 4 шт), ведра (2 шт), швабра, ветошь (2 шт)",
    appliances: "Газовая плита с тумбой, 2 холодильника, 2 электрических чайника"
  }
};

export default function InteractiveMap({ cabinsData, selectedCabins = [], onCabinSelect, isLoading, role }) {
  
  const getCabinStatus = (cabinNumber) => {
    if (isLoading || !cabinsData) return { isAvailable: false, data: null };
    const cabin = cabinsData.find(c => c.number === cabinNumber);
    return {
      // Если домика нет в ответе API или он заблокирован (is_available = False), закрываем выбор
      isAvailable: cabin ? cabin.is_available : false,
      data: cabin
    };
  };

  const handleCabinClick = (cabinNumber, isAvailable) => {
    if (!isAvailable) return;
    
    const maxCabins = role === 'STAFF' ? 2 : 1;
    let updated = [...selectedCabins];

    if (updated.includes(cabinNumber)) {
      updated = updated.filter(num => num !== cabinNumber);
    } else {
      if (updated.length >= maxCabins) {
        updated.shift();
      }
      updated.push(cabinNumber);
    }
    onCabinSelect(updated);
  };

  return (
    <div className="w-full bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Интерактивная карта базы отдыха ЗабГУ</h3>
          <p className="text-xs text-gray-500">
            {role === 'STAFF' 
              ? "Выберите до 2 свободных домиков на схеме" 
              : "Выберите свободный гостевой дом на схеме"}
          </p>
        </div>
        
        {/* Легенда */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 bg-emerald-500 border border-emerald-600 rounded"></span>
            <span className="text-gray-600 font-medium">Свободен</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 bg-rose-500 border border-rose-600 rounded"></span>
            <span className="text-gray-600 font-medium">Занят / Заблокирован</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-3.5 bg-blue-500 border border-blue-600 rounded"></span>
            <span className="text-gray-600 font-bold">Выбран</span>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-[8/5.5] bg-emerald-50 rounded-lg overflow-hidden border border-gray-100">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="flex items-center space-x-2 text-natural-blue">
              <span className="animate-spin text-lg">⏳</span>
              <span className="font-medium text-sm">Проверка доступности мест...</span>
            </div>
          </div>
        )}

        <svg viewBox="0 0 800 550" className="w-full h-full select-none">
          <path d="M 0 0 L 800 0 L 800 70 Q 400 110 0 70 Z" fill="#BFDBFE" />
          <text x="400" y="45" fill="#1E40AF" fontSize="14" fontWeight="bold" textAnchor="middle" opacity="0.7" fontFamily="sans-serif">
            ОЗЕРО АРАХЛЕЙ
          </text>

          <path d="M 0 70 Q 400 110 800 70 L 800 100 Q 400 140 0 100 Z" fill="#FEF3C7" />

          <path d="M 385 100 L 415 100 L 415 550 L 385 550 Z" fill="#E5E7EB" />
          <path d="M 0 210 L 800 210 L 800 225 L 0 225 Z" fill="#E5E7EB" opacity="0.8" />
          <path d="M 0 345 L 800 345 L 800 360 L 0 360 Z" fill="#E5E7EB" opacity="0.8" />

          {CABIN_POSITIONS.map((pos) => {
            const { isAvailable } = getCabinStatus(pos.number);
            const isSelected = selectedCabins.includes(pos.number);

            let rectFill = "#10B981";
            let rectStroke = "#047857";
            let cursorStyle = "cursor-pointer";

            if (!isAvailable) {
              rectFill = "#EF4444"; // Заблокирован
              rectStroke = "#B91C1C";
              cursorStyle = "cursor-not-allowed";
            }
            if (isSelected) {
              rectFill = "#3B82F6";
              rectStroke = "#1D4ED8";
            }

            return (
              <g 
                key={pos.number} 
                className={`transition-all duration-200 ${cursorStyle}`} 
                onClick={() => handleCabinClick(pos.number, isAvailable)}
              >
                <polygon points={`${pos.x - 45},${pos.y - 15} ${pos.x},${pos.y - 45} ${pos.x + 45},${pos.y - 15}`} fill={isSelected ? "#1D4ED8" : "#8B5A2B"} />
                <rect x={pos.x - 40} y={pos.y - 15} width="80" height="60" rx="6" fill={rectFill} stroke={rectStroke} strokeWidth={isSelected ? "3" : "1.5"} className="transition-all duration-200" />
                <rect x={pos.x - 10} y={pos.y + 15} width="20" height="30" fill="#F3F4F6" stroke="#D1D5DB" />
                <rect x={pos.x - 30} y={pos.y} width="16" height="16" rx="2" fill="#FFEFD5" stroke="#D1D5DB" />
                <rect x={pos.x + 14} y={pos.y} width="16" height="16" rx="2" fill="#FFEFD5" stroke="#D1D5DB" />
                <rect x={pos.x - 30} y={pos.y - 30} width="60" height="16" rx="3" fill="#FFF" stroke="#4B5563" strokeWidth="1" />
                <text x={pos.x} y={pos.y - 18} fill="#1F2937" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">ДОМ {pos.number}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {selectedCabins.length > 0 && (
        <div className="mt-6 space-y-4 animate-fade-in">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                Выбран(ы) Гостевой дом(а) № {selectedCabins.join(', ')}
              </h4>
              <p className="text-xs text-gray-600 mt-1"> 
                Общее количество домиков: {selectedCabins.length}. Дети до 10 лет размещаются бесплатно.
              </p>
            </div>
            <div className="text-right w-full sm:w-auto">
              <span className="text-xs text-gray-500 block font-semibold">Базовые тарифы ЗабГУ:</span>
              <span className="text-sm font-bold text-natural-blue block">Сотрудник: 610 руб. / сутки</span>
              <span className="text-sm font-bold text-natural-blue block">Студент: 100 руб. / сутки за койку</span>
            </div>
          </div>

          {selectedCabins.map(cabinNum => (
            <div key={cabinNum} className="p-5 bg-amber-50/50 rounded-xl border border-amber-200/60 shadow-xs">
              <h5 className="font-extrabold text-gray-900 text-sm mb-3 flex items-center gap-1.5 uppercase tracking-wider text-amber-900">
                🏡 Комплектация и инвентарь дома №{cabinNum}:
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-700">
                <div className="space-y-2">
                  <p><b>🛏️ Спальные места:</b> {CABIN_EQUIPMENT[cabinNum]?.beds}</p>
                  <p><b>🛋️ Мебель и интерьер:</b> {CABIN_EQUIPMENT[cabinNum]?.furniture}</p>
                  <p><b>🛏️ Постельное белье:</b> {CABIN_EQUIPMENT[cabinNum]?.linen}</p>
                </div>
                <div className="space-y-2">
                  <p><b>🔌 Бытовая техника:</b> {CABIN_EQUIPMENT[cabinNum]?.appliances}</p>
                  <p><b>🍳 Посуда и бытовая утварь:</b> {CABIN_EQUIPMENT[cabinNum]?.kitchen}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}