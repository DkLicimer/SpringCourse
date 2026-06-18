import React, { useState, useEffect, useRef } from 'react';

// ========================================== // НАСТРОЙКА ПУТЕЙ
const CABIN_SVG_PATH = "/cabin.svg"; 
const ADMIN_SVG_PATH = "/admin.svg";

// Базовые размеры для ПК
const DESKTOP_CABIN_WIDTH = 70;
const DESKTOP_CABIN_HEIGHT = 60;
const DESKTOP_ADMIN_WIDTH = 150;
const DESKTOP_ADMIN_HEIGHT = 130;

// Увеличенные размеры для мобильных экранов
const MOBILE_CABIN_WIDTH = 110;
const MOBILE_CABIN_HEIGHT = 95;
const MOBILE_ADMIN_WIDTH = 190;
const MOBILE_ADMIN_HEIGHT = 165;

// Координаты домиков
const CABIN_POSITIONS = [ 
  { number: 1, x: 1330, y: 960, label: "Домик 1" }, 
  { number: 2, x: 1280, y: 1050, label: "Домик 2" }, 
  { number: 7, x: 543, y: 697, label: "Домик 7" }, 
  { number: 14, x: 615, y: 266, label: "Домик 14" }, 
  { number: 15, x: 565, y: 216, label: "Домик 15" }, 
  { number: 13, x: 430, y: 369, label: "Домик 13" }, 
  { number: 12, x: 518, y: 291, label: "Домик 12" }, 
  { number: 10, x: 543, y: 430, label: "Домик 10" }, 
  { number: 11, x: 615, y: 369, label: "Домик 11" }, 
  { number: 9, x: 493, y: 515, label: "Домик 9" }, 
  { number: 8, x: 615, y: 515, label: "Домик 8" }, 
];

const CABIN_EQUIPMENT = { 
  1: { beds: "4 односпальные кровати, 1 раздвижной диван (2 места)", furniture: "Стенка мебельная (2 шт), кресло, трюмо, шифоньер, 2 кухонных стола, 7 стульев", linen: "4 комплекта белья, покрывала", kitchen: "Посуда на 4 персоны, умывальник, хоз. инвентарь", appliances: "Электроплита, холодильник, чайник" }, 
  2: { beds: "3 односпальные кровати", furniture: "Шифоньер, 2 кухонных стола, шторы", linen: "3 комплекта постельного белья", kitchen: "Посуда на 3 персоны, умывальник, ветошь, тазы", appliances: "Газовая плита, холодильник, чайник" }, 
  7: { beds: "4 односпальные кровати", furniture: "Шифоньер (2 шт), 2 кухонных стола, 2 стула, шторы (2 комплекта), тюли (2 шт), гардины (2 шт)", linen: "4 комплекта постельного белья", kitchen: "Посуда на 4 персоны, полотенца лицевые и банные (по 4 шт), швабра, ветошь", appliances: "Газовая плита с тумбой, холодильник" }, 
  8: { beds: "4 односпальные кровати", furniture: "Шифоньер, 2 стола, 4 стула, шторы", linen: "4 комплекта постельного белья", kitchen: "Посуда на 4 персоны, умывальник, ведра", appliances: "Газовая плита, холодильник, чайник" }, 
  9: { beds: "4 односпальные кровати", furniture: "Шифоньер, 2 стола, 4 стула, шторы", linen: "4 комплекта постельного белья", kitchen: "Посуда на 4 персоны, ветошь, швабра", appliances: "Газовая плита, холодильник" }, 
  10: { beds: "4 односпальные кровати", furniture: "Шифоньер, 2 стола, 4 стула, шторы", linen: "4 комплекта постельного белья", kitchen: "Посуда на 4 персоны, швабра", appliances: "Газовая плита, холодильник" }, 
  11: { beds: "4 односпальные кровати", furniture: "Шифоньер, 2 стола, 4 стула", linen: "4 комплекта постельного белья", kitchen: "Посуда на 4 персоны", appliances: "Газовая плита, холодильник" }, 
  12: { beds: "3 односпальные кровати", furniture: "Шифоньер, кухонный стол, 6 стульев", linen: "3 комплекта белья", kitchen: "Посуда на 3 персоны, швабра", appliances: "Газовая плита, холодильник" }, 
  13: { beds: "4 односпальные кровати", furniture: "Шифоньер, 2 стола, 4 стула", linen: "4 комплекта белья", kitchen: "Посуда на 4 персоны", appliances: "Газовая плита, холодильник" }, 
  14: { beds: "2 двуспальные кровати (комфортное размещение до 4 человек)", furniture: "Прикроватные тумбочки (2 шт), шифоньер (2 шт), 2 кухонных стола, 4 стула, шторы (4 комплекта)", linen: "4 комплекта постельного белья", kitchen: "Посуда на 8 персон, полотенца лицевые и банные (по 4 шт), ведра (2 шт), швабра, ветошь (2 шт)", appliances: "Газовая плита с тумбой, 2 холодильника, 2 электрических чайника" }, 
  15: { beds: "2 двуспальные кровати", furniture: "Прикроватные тумбочки, шифоньер, 2 стола, 4 стула", linen: "4 комплекта белья", kitchen: "Посуда на 8 персон, полотенца", appliances: "Газовая плита, 2 холодильника, 2 чайника" } 
};

export default function InteractiveMap({ cabinsData, selectedCabins = [], onCabinSelect, isLoading, role }) {
  const [scale, setScale] = useState(1); 
  const [position, setPosition] = useState({ x: 0, y: 0 }); 
  const [isDragging, setIsDragging] = useState(false); 
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 }); 
  const [hasMoved, setHasMoved] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const containerRef = useRef(null);

  // Определение мобильного экрана и установка начального масштаба
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    handleResize(); // Проверка при монтировании
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Устанавливаем приближение по умолчанию для мобильных устройств при инициализации
  useEffect(() => {
    if (isMobile) {
      setScale(1.8); // Автоматически приближаем карту на смартфонах
    } else {
      setScale(1);
    }
    setPosition({ x: 0, y: 0 });
  }, [isMobile]);

  useEffect(() => { 
    const container = containerRef.current; 
    if (!container) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const zoomFactor = 0.15;
      setScale((prevScale) => {
        let newScale = prevScale + (e.deltaY < 0 ? zoomFactor : -zoomFactor);
        newScale = Math.max(1, Math.min(4, newScale));

        if (newScale === 1) {
          setPosition({ x: 0, y: 0 });
        } else {
          setPosition((prevPos) => {
            const rect = container.getBoundingClientRect();
            const maxX = (rect.width * newScale - rect.width) / 2;
            const maxY = (rect.height * newScale - rect.height) / 2;
            return {
              x: Math.max(-maxX, Math.min(maxX, prevPos.x)),
              y: Math.max(-maxY, Math.min(maxY, prevPos.y))
            };
          });
        }
        return newScale;
      });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [scale]);

  const zoomIn = () => { setScale((prev) => Math.min(4, prev + 0.3)); };

  const zoomOut = () => { 
    setScale((prev) => { 
      const next = Math.max(1, prev - 0.3); 
      if (next === 1) setPosition({ x: 0, y: 0 }); 
      return next; 
    }); 
  };

  const resetZoom = () => { 
    setScale(isMobile ? 1.8 : 1); 
    setPosition({ x: 0, y: 0 }); 
  };

  const handlePointerDown = (e) => { 
    if (scale === 1 && !isMobile) return; 
    setIsDragging(true); 
    setHasMoved(false); 
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y }); 
  };

  const handlePointerMove = (e) => { 
    if (!isDragging || (scale === 1 && !isMobile)) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;

    const deltaX = Math.abs(newX - position.x);
    const deltaY = Math.abs(newY - position.y);
    if (deltaX > 5 || deltaY > 5) {
      setHasMoved(true);
    }

    const maxX = (rect.width * scale - rect.width) / 2;
    const maxY = (rect.height * scale - rect.height) / 2;

    newX = Math.max(-maxX, Math.min(maxX, newX));
    newY = Math.max(-maxY, Math.min(maxY, newY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = () => { setIsDragging(false); };

  const getCabinStatus = (cabinNumber) => { 
    if (isLoading || !cabinsData) return { isAvailable: false, data: null }; 
    const cabin = cabinsData.find(c => c.number === cabinNumber); 
    return { isAvailable: cabin ? cabin.is_available : false, data: cabin }; 
  };

  const handleCabinClick = (cabinNumber, isAvailable) => { 
    if (hasMoved) {
      setHasMoved(false);
      return;
    } 
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

  // Вычисляем динамические размеры на основе текущего типа устройства
  const cabinWidth = isMobile ? MOBILE_CABIN_WIDTH : DESKTOP_CABIN_WIDTH;
  const cabinHeight = isMobile ? MOBILE_CABIN_HEIGHT : DESKTOP_CABIN_HEIGHT;
  const adminWidth = isMobile ? MOBILE_ADMIN_WIDTH : DESKTOP_ADMIN_WIDTH;
  const adminHeight = isMobile ? MOBILE_ADMIN_HEIGHT : DESKTOP_ADMIN_HEIGHT;

  // Параметры плашки с номером домика
  const badgeW = isMobile ? 70 : 48;
  const badgeH = isMobile ? 32 : 22;
  const badgeX = -badgeW / 2;
  const badgeY = -badgeH / 2;
  const badgeFontSize = isMobile ? 26 : 20;

  return (    
    <div className="w-full max-w-7xl mx-auto p-3 sm:p-6 bg-white rounded-2xl shadow-md border border-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight font-sans">
            Интерактивная карта базы отдыха ЗабГУ
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1 font-sans">
            {role === 'STAFF' ? "Выберите до 2 свободных домиков на схеме" : "Выберите свободный гостевой дом на схеме"}
          </p>
        </div>

        {/* Легенда */}
        <div className="flex flex-wrap gap-3 text-xs font-sans">
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
            <span className="text-gray-600 font-bold">Выбран</span>
          </div>
        </div>
      </div>

      <div className="relative w-full aspect-[165/123.5] bg-[#BACD53] rounded-lg overflow-hidden border border-gray-200">
        {(scale > 1 || isMobile) && (
          <div className="absolute top-4 left-4 right-16 z-20 sm:right-auto bg-black/60 backdrop-blur-xs text-white text-[10px] sm:text-xs px-3 py-1.5 rounded-full pointer-events-none select-none">
            🖐️ Перетаскивайте карту зажатием
          </div>
        )}

        <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-1.5">
          <button 
            type="button" 
            onClick={zoomIn} 
            className="w-9 h-9 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center font-bold text-lg text-gray-700 hover:bg-gray-50 cursor-pointer active:scale-95 transition"
            title="Приблизить"
          >
            ＋
          </button>
          <button 
            type="button" 
            onClick={zoomOut} 
            className="w-9 h-9 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center font-bold text-lg text-gray-700 hover:bg-gray-50 cursor-pointer active:scale-95 transition"
            title="Отдалить"
          >
            －
          </button>
          <button 
            type="button" 
            onClick={resetZoom} 
            className="w-9 h-9 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-sm text-gray-700 hover:bg-gray-50 cursor-pointer active:scale-95 transition"
            title="Сбросить масштаб"
          >
            🔄
          </button>
        </div>

        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center',
            transition: isDragging ? 'none' : 'transform 0.12s ease-out',
            cursor: scale > 1 || isMobile ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
          className="w-full h-full select-none touch-none"
        >
          {isLoading && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10 pointer-events-none">
              <div className="flex items-center space-x-2 text-blue-600">
                <span className="animate-spin text-lg">⏳</span>
                <span className="font-medium text-sm">Проверка доступности мест...</span>
              </div>
            </div>
          )}

          <svg viewBox="0 0 1650 1235" className="w-full h-full select-none">
            
            {/* 1. ПЕСЧАНЫЙ ПЛЯЖ И ВОДА */}
            <path 
              d="M -10,-10 L 850,-10 C 720,200 450,230 280,310 C 180,350 90,480 -10,710 Z" 
              fill="#F5E0B3" 
            />
            <path 
              d="M -10,-10 L 680,-10 C 580,160 350,180 200,240 C 110,280 60,390 -10,540 Z" 
              fill="#00D0E6" 
            />
            
            <text 
              x="180" 
              y="110" 
              fill="#ffffff" 
              fontSize="24" 
              fontWeight="900" 
              fontFamily="sans-serif" 
              opacity="0.95"
              filter="drop-shadow(1px 2px 3px rgba(0,0,0,0.3))"
            >
              озеро Арахлей
            </text>

            {/* 2. БЕЛАЯ ГРАНИЦА УЧАСТКА (ЗАБОР) */}
            <path 
              d="M929.202 550.878C861.868 498.045 676.202 314.378 472.202 2.37793L1.70166 479.878L50.2017 633.878L601.202 899.878L867.202 975.878L1326.2 1232.88L1647.7 883.878L1234.7 479.878L1087.7 385.878L929.202 550.878Z" 
              fill="none" 
              stroke="#FFFFFF" 
              strokeWidth="5" 
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.15))"
            />

            {/* Декоративные деревья */}
            <g opacity="0.15" fill="#2E7D32">
              <text x="820" y="320" fontSize="35">🌲</text>
              <text x="1100" y="220" fontSize="35">🌲</text>
              <text x="1450" y="380" fontSize="40">🌲</text>
              <text x="1520" y="440" fontSize="30">🌲</text>
              <text x="1020" y="780" fontSize="35">🌲</text>
              <text x="350" y="940" fontSize="38">🌲</text>
            </g>

            {/* 3. ЗДАНИЕ АДМИНИСТРАЦИИ */}
            <g>
              <ellipse cx="910" cy="695" rx={adminWidth * 0.36} ry="14" fill="rgba(0,0,0,0.18)" />
              <image 
                href={ADMIN_SVG_PATH} 
                x={910 - adminWidth / 2} 
                y={670 - adminHeight / 2} 
                width={adminWidth} 
                height={adminHeight} 
              />
              <g transform="translate(910, 760)">
                <rect 
                  x="-75" 
                  y="-13" 
                  width="170" 
                  height="26" 
                  rx="5" 
                  fill="#FEF3C7" 
                  stroke="#D97706" 
                  strokeWidth="1.5" 
                  filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.1))"
                />
                <text 
                  x="10" 
                  y="5" 
                  fill="#78350F" 
                  fontSize="20" 
                  fontWeight="bold" 
                  textAnchor="middle" 
                  fontFamily="sans-serif"
                >
                  администрация
                </text>
              </g>
            </g>

            {/* 4. ИНТЕРАКТИВНЫЕ ГОСТЕВЫЕ ДОМИКИ */}
            {CABIN_POSITIONS.map((pos) => {
              const { isAvailable } = getCabinStatus(pos.number);
              const isSelected = selectedCabins.includes(pos.number);

              let badgeBg = "#10B981";  
              let badgeBorder = "#047857";
              let badgeText = "#FFFFFF";
              let cursorStyle = "cursor-pointer";

              if (!isAvailable) {
                badgeBg = "#EF4444";    
                badgeBorder = "#991B1B";
                cursorStyle = "cursor-not-allowed";
              }
              
              if (isSelected) {
                badgeBg = "#3B82F6";    
                badgeBorder = "#1E40AF";
              }

              return (
                <g 
                  key={pos.number} 
                  className={cursorStyle} 
                  onClick={() => handleCabinClick(pos.number, isAvailable)}
                >
                  {/* Тень под домиком */}
                  <ellipse cx={pos.x} cy={pos.y + cabinHeight / 2 - 8} rx="20" ry="5" fill="rgba(0,0,0,0.15)" />

                  {/* Эффект выделения выбранного домика */}
                  {isSelected && (
                    <ellipse 
                      cx={pos.x} 
                      cy={pos.y} 
                      rx={cabinWidth / 2 + 6} 
                      ry={cabinHeight / 2 + 3} 
                      fill="none" 
                      stroke="#3B82F6" 
                      strokeWidth="3" 
                      strokeDasharray="5 3"
                    />
                  )}

                  {/* Изображение домика */}
                  <image 
                    href={CABIN_SVG_PATH} 
                    x={pos.x - cabinWidth / 2} 
                    y={pos.y - cabinHeight / 2} 
                    width={cabinWidth} 
                    height={cabinHeight} 
                  />

                  {/* Плашка с номером под домиком */}
                  <g transform={`translate(${pos.x}, ${pos.y + cabinHeight / 2 + (isMobile ? 12 : 6)})`}>
                    <rect 
                      x={badgeX} 
                      y={badgeY} 
                      width={badgeW} 
                      height={badgeH} 
                      rx="5" 
                      fill={badgeBg} 
                      stroke={badgeBorder} 
                      strokeWidth="1.5" 
                      filter="drop-shadow(0px 1.5px 3px rgba(0,0,0,0.15))"
                    />
                    <text 
                      x="0" 
                      y={isMobile ? 7 : 5} 
                      fill={badgeText} 
                      fontSize={badgeFontSize} 
                      fontWeight="bold" 
                      textAnchor="middle" 
                      fontFamily="sans-serif"
                    >
                      №{pos.number}
                    </text>
                  </g>

                  {/* НЕВИДИМАЯ ОБЛАСТЬ КЛИКА (увеличивает сенсорное пятно для пальца) */}
                  <circle 
                    cx={pos.x} 
                    cy={pos.y} 
                    r={cabinWidth * 0.75} 
                    fill="transparent" 
                    pointerEvents="all"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Описание комплектации выбранного объекта */}
      {selectedCabins.length > 0 && (
        <div className="mt-6 space-y-4 animate-fade-in">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h4 className="font-bold text-gray-900 text-sm sm:text-base font-sans">
                Выбран(ы) Гостевой дом(а) № {selectedCabins.join(', ')}
              </h4>
              <p className="text-xs text-gray-600 mt-1 font-sans"> 
                Общее количество домиков: {selectedCabins.length}. Дети до 10 лет размещаются бесплатно.
              </p>
            </div>
            <div className="text-right w-full sm:w-auto font-sans">
              <span className="text-xs text-gray-500 block font-semibold">Базовые тарифы ЗабГУ:</span>
              <span className="text-sm font-bold text-blue-700 block">Сотрудник: 610 руб. / сутки</span>
              <span className="text-sm font-bold text-blue-700 block">Студент: 100 руб. / сутки за койку</span>
            </div>
          </div>

          {selectedCabins.map(cabinNum => (
            <div key={cabinNum} className="p-5 bg-amber-50/50 rounded-xl border border-amber-200/60 shadow-xs font-sans">
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