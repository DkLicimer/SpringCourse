import React, { useState, useRef, useEffect } from 'react';

const CABIN_POSITIONS = [
  { number: 1, x: 1330, y: 960, label: "Домик 1" },
  { number: 2, x: 1280, y: 1050, label: "Домик 2" },
  { number: 7, x: 543, y: 697, label: "Домик 7" },
  { number: 8, x: 615, y: 515, label: "Домик 8" },
  { number: 9, x: 493, y: 515, label: "Домик 9" },
  { number: 10, x: 543, y: 430, label: "Домик 10" },
  { number: 11, x: 615, y: 369, label: "Домик 11" },
  { number: 12, x: 518, y: 291, label: "Домик 12" },
  { number: 13, x: 430, y: 369, label: "Домик 13" },
  { number: 14, x: 615, y: 266, label: "Домик 14" },
  { number: 15, x: 565, y: 216, label: "Домик 15" },
  { number: 16, x: 1310, y: 830, label: "Домик 16 (VIP)" },
];

export default function InteractiveMap({ cabins = [], selectedCabin, onSelectCabin }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const getCabinStatus = (num) => {
    const c = cabins.find(item => item.number === num);
    return c ? { isAvailable: c.is_available, data: c } : { isAvailable: false, data: null };
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = () => setIsDragging(false);

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm text-gray-900 font-heading">Схема базы отдыха</h3>
          <p className="text-xs text-gray-500">Кликните на свободный зеленый домик на карте</p>
        </div>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => setScale(s => Math.min(3, s + 0.3))} 
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold"
          >
            +
          </button>
          <button 
            type="button"
            onClick={() => setScale(s => Math.max(0.8, s - 0.3))} 
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold"
          >
            -
          </button>
          <button 
            type="button"
            onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }} 
            className="px-2.5 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold"
          >
            Сброс
          </button>
        </div>
      </div>

      <div className="relative w-full aspect-[16/10] bg-[#C4D977] rounded-xl overflow-hidden border border-gray-200">
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
            transformOrigin: 'center center',
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          className="w-full h-full select-none"
        >
          <svg viewBox="0 0 1650 1200" className="w-full h-full">
            {/* Озеро и песчаный пляж */}
            <path d="M -10,-10 L 850,-10 C 720,200 450,230 280,310 C 180,350 90,480 -10,710 Z" fill="#F4DEAF" />
            <path d="M -10,-10 L 680,-10 C 580,160 350,180 200,240 C 110,280 60,390 -10,540 Z" fill="#22D3EE" />
            
            <text x="180" y="110" fill="#ffffff" fontSize="28" fontWeight="bold" opacity="0.9">
              ОЗЕРО / ПЛЯЖНАЯ ЗОНА
            </text>

            {/* Здание администрации */}
            <g transform="translate(900, 680)">
              <rect x="-60" y="-35" width="120" height="70" rx="8" fill="#FDE68A" stroke="#D97706" strokeWidth="2" />
              <polygon points="-65,-35 0,-70 65,-35" fill="#B45309" />
              <text x="0" y="8" fill="#78350F" fontSize="14" fontWeight="bold" textAnchor="middle">
                Администрация
              </text>
            </g>

            {/* Домики */}
            {CABIN_POSITIONS.map(pos => {
              const { isAvailable, data } = getCabinStatus(pos.number);
              const isSelected = selectedCabin?.number === pos.number;

              let fillColor = isAvailable ? "#10B981" : "#EF4444";
              let strokeColor = isAvailable ? "#047857" : "#991B1B";
              if (isSelected) {
                fillColor = "#3B82F6";
                strokeColor = "#1D4ED8";
              }

              return (
                <g 
                  key={pos.number} 
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className={isAvailable ? "cursor-pointer" : "cursor-not-allowed"}
                  onClick={() => isAvailable && data && onSelectCabin(data)}
                >
                  {/* Тень */}
                  <ellipse cx="0" cy="30" rx="42" ry="12" fill="rgba(0,0,0,0.15)" />

                  {/* Домик */}
                  <rect x="-35" y="-15" width="70" height="45" rx="6" fill="#FDFBF7" stroke="#8B5A2B" strokeWidth="2" />
                  <polygon points="-40,-15 0,-45 40,-15" fill={fillColor} stroke={strokeColor} strokeWidth="2" />

                  {/* Плашка с номером */}
                  <rect x="-24" y="6" width="48" height="20" rx="4" fill={fillColor} />
                  <text x="0" y="20" fill="#FFFFFF" fontSize="12" fontWeight="bold" textAnchor="middle">
                    №{pos.number}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}