import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';

export default function InteractiveMap({ cabins = [], selectedCabin, onSelectCabin }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handlePointerUp = () => setIsDragging(false);

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-sm text-gray-900 font-heading">Интерактивная карта базы отдыха</h3>
          <p className="text-xs text-gray-500">Координаты объектов синхронизируются с сервером</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(2.5, s + 0.2))}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.7, s - 0.2))}
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
            {/* Базовый ландшафт */}
            <path d="M -10,-10 L 850,-10 C 720,200 450,230 280,310 C 180,350 90,480 -10,710 Z" fill="#F4DEAF" />
            <path d="M -10,-10 L 680,-10 C 580,160 350,180 200,240 C 110,280 60,390 -10,540 Z" fill="#22D3EE" />
            <text x="180" y="110" fill="#ffffff" fontSize="28" fontWeight="bold" opacity="0.9">
              ОЗЕРО / ПЛЯЖНАЯ ЗОНА
            </text>

            {/* Административное здание */}
            <g transform="translate(900, 680)">
              <rect x="-60" y="-35" width="120" height="70" rx="8" fill="#FDE68A" stroke="#D97706" strokeWidth="2" />
              <polygon points="-65,-35 0,-70 65,-35" fill="#B45309" />
              <text x="0" y="8" fill="#78350F" fontSize="14" fontWeight="bold" textAnchor="middle">
                Администрация
              </text>
            </g>

            {/* Динамическая отрисовка домиков с сервера */}
            {cabins.map((cabin) => {
              const isSelected = selectedCabin?.id === cabin.id;
              const isAvail = cabin.is_available;

              let fillColor = isAvail ? '#10B981' : '#EF4444';
              let strokeColor = isAvail ? '#047857' : '#991B1B';
              if (isSelected) {
                fillColor = '#3B82F6';
                strokeColor = '#1D4ED8';
              }

              return (
                <g
                  key={cabin.id}
                  transform={`translate(${cabin.map_x || 100}, ${cabin.map_y || 100})`}
                  className={isAvail ? 'cursor-pointer hover:opacity-90' : 'cursor-not-allowed opacity-75'}
                  onClick={() => isAvail && onSelectCabin(cabin)}
                >
                  <ellipse cx="0" cy="30" rx="42" ry="12" fill="rgba(0,0,0,0.15)" />
                  <rect x="-35" y="-15" width="70" height="45" rx="6" fill="#FDFBF7" stroke="#8B5A2B" strokeWidth="2" />
                  <polygon points="-40,-15 0,-45 40,-15" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                  <rect x="-24" y="6" width="48" height="20" rx="4" fill={fillColor} />
                  <text x="0" y="20" fill="#FFFFFF" fontSize="12" fontWeight="bold" textAnchor="middle">
                    №{cabin.number}
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

InteractiveMap.propTypes = {
  cabins: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      number: PropTypes.number.isRequired,
      map_x: PropTypes.number,
      map_y: PropTypes.number,
      is_available: PropTypes.bool
    })
  ).isRequired,
  selectedCabin: PropTypes.object,
  onSelectCabin: PropTypes.func.isRequired
};