import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useBrand } from '../../context/BrandContext';
import { ChevronLeft, ChevronRight, Clock, ArrowRight, RotateCcw } from 'lucide-react';

const TIME_START = 8.5; // 08:30
const TIME_END = 22.0;  // 22:00
const STEP = 0.5;       // 30 минут

export default function SpaceSchedule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { brand } = useBrand();

  const [room, setRoom] = useState(null);
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [bookings, setBookings] = useState([]);
  
  // Храним временные метки (timestamp в мс)
  const [startTs, setStartTs] = useState(null);
  const [endTs, setEndTs] = useState(null);

  useEffect(() => {
    api.get(`/api/spaces/rooms/${id}/`).then(res => setRoom(res.data));
  }, [id]);

  useEffect(() => {
    const startDate = formatDate(currentMonday);
    const sunday = new Date(currentMonday);
    sunday.setDate(sunday.getDate() + 6);
    const endDate = formatDate(sunday);

    api.get(`/api/spaces/rooms/${id}/schedule/?start_date=${startDate}&end_date=${endDate}`)
      .then(res => setBookings(res.data))
      .catch(err => console.error('Ошибка расписания:', err));
  }, [id, currentMonday]);

  function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(date.setDate(diff));
    mon.setHours(0, 0, 0, 0);
    return mon;
  }

  function formatDate(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const handlePrevWeek = () => {
    const prev = new Date(currentMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentMonday(prev);
    resetSelection();
  };

  const handleNextWeek = () => {
    const next = new Date(currentMonday);
    next.setDate(next.getDate() + 7);
    setCurrentMonday(next);
    resetSelection();
  };

  const resetSelection = () => {
    setStartTs(null);
    setEndTs(null);
  };

  const isBooked = (timestamp) => {
    return bookings.some(b => {
      const bStart = new Date(b.start_time).getTime();
      const bEnd = new Date(b.end_time).getTime();
      return timestamp >= bStart && timestamp < bEnd;
    });
  };

  const isSelected = (timestamp) => {
    if (!startTs) return false;
    if (!endTs) return timestamp === startTs;
    const min = Math.min(startTs, endTs);
    const max = Math.max(startTs, endTs);
    return timestamp >= min && timestamp <= max;
  };

  // Клик по слоту: выбор первого слота или диапазона
  const handleSlotClick = (timestamp) => {
    if (isBooked(timestamp)) return;

    if (!startTs || (startTs && endTs)) {
      setStartTs(timestamp);
      setEndTs(null);
    } else {
      const dateA = new Date(startTs).toDateString();
      const dateB = new Date(timestamp).toDateString();

      // Нельзя выбрать интервал через разные дни
      if (dateA !== dateB) {
        setStartTs(timestamp);
        setEndTs(null);
        return;
      }

      // Проверяем, нет ли занятых слотов внутри выбранного интервала
      const min = Math.min(startTs, timestamp);
      const max = Math.max(startTs, timestamp);

      let conflict = false;
      let curr = min;
      while (curr <= max) {
        if (isBooked(curr)) {
          conflict = true;
          break;
        }
        curr += STEP * 60 * 60 * 1000;
      }

      if (conflict) {
        alert('Внутри выбранного диапазона есть уже забронированное время!');
        return;
      }

      setEndTs(timestamp);
    }
  };

  // Расчет итогового интервала для передачи в форму
  const getSelectedRange = () => {
    if (!startTs) return null;
    const min = Math.min(startTs, endTs || startTs);
    const max = Math.max(startTs, endTs || startTs);
    const startDate = new Date(min);
    // Окончание = последний слот + 30 минут
    const endDate = new Date(max + STEP * 60 * 60 * 1000);
    return { startDate, endDate };
  };

  const range = getSelectedRange();

  const handleProceedBooking = () => {
    if (!range) return;
    navigate(`/spaces/${id}/apply`, {
      state: {
        roomId: id,
        roomName: room?.name,
        startTime: range.startDate.toISOString(),
        endTime: range.endDate.toISOString(),
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Шапка расписания */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link to="/spaces" className="text-xs text-brand-primary font-bold hover:underline">
            ← Вернуться к списку аудиторий
          </Link>
          <h1 className="text-2xl font-black font-heading text-gray-900 mt-1">
            {room ? room.name : 'Расписание аудитории'}
          </h1>
          <p className="text-xs text-gray-500">
            Часовой пояс кампуса: <span className="font-semibold text-gray-700">{brand.timezone || 'Asia/Chita'}</span>
          </p>
        </div>

        {/* Навигатор по неделям */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-2xs">
          <button 
            type="button"
            onClick={handlePrevWeek} 
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-700 transition cursor-pointer"
            title="Предыдущая неделя"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-gray-800">
            {currentMonday.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — {' '}
            {new Date(currentMonday.getTime() + 6 * 86400000).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
          </span>
          <button 
            type="button"
            onClick={handleNextWeek} 
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-700 transition cursor-pointer"
            title="Следующая неделя"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Подсказка и легенда */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3.5 rounded-xl border border-gray-200 text-xs shadow-2xs">
        <div className="text-gray-600 font-medium">
          💡 Кликните на время начала, затем на время окончания мероприятия
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-emerald-50 border border-emerald-200 rounded"></span> Свободно</div>
          <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-gray-400 rounded"></span> Занято</div>
          <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-emerald-600 rounded"></span> Выбрано</div>
          {startTs && (
            <button 
              type="button"
              onClick={resetSelection} 
              className="text-red-600 hover:text-red-700 font-bold flex items-center gap-1 ml-2 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Сбросить выбор
            </button>
          )}
        </div>
      </div>

      {/* Интерактивная сетка */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto p-4 shadow-xs">
        <table className="w-full min-w-[720px] border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2 border-b border-gray-100 text-left text-gray-400 font-medium w-16">Время</th>
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((dayName, idx) => {
                const dayDate = new Date(currentMonday);
                dayDate.setDate(dayDate.getDate() + idx);
                const isToday = dayDate.toDateString() === new Date().toDateString();

                return (
                  <th key={idx} className={`p-2 border-b border-gray-100 text-center font-bold ${isToday ? 'text-brand-primary bg-blue-50/50 rounded-t-lg' : 'text-gray-700'}`}>
                    <div>{dayName}</div>
                    <div className="text-[11px] font-normal text-gray-400">{dayDate.getDate()} {dayDate.toLocaleDateString('ru-RU', { month: 'short' })}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: (TIME_END - TIME_START) / STEP }).map((_, rIdx) => {
              const hourDecimal = TIME_START + rIdx * STEP;
              const h = Math.floor(hourDecimal);
              const m = (hourDecimal % 1) * 60;
              const timeLabel = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

              return (
                <tr key={rIdx} className="border-b border-gray-50 hover:bg-gray-50/40">
                  <td className="p-1.5 text-gray-400 font-mono text-[11px] whitespace-nowrap">{timeLabel}</td>
                  {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => {
                    const slotDate = new Date(currentMonday);
                    slotDate.setDate(slotDate.getDate() + dayIdx);
                    slotDate.setHours(h, m, 0, 0);

                    const ts = slotDate.getTime();
                    const booked = isBooked(ts);
                    const selected = isSelected(ts);

                    return (
                      <td key={dayIdx} className="p-1 text-center">
                        <button
                          type="button"
                          disabled={booked}
                          onClick={() => handleSlotClick(ts)}
                          className={`w-full h-7 rounded-md transition text-[10px] font-bold cursor-pointer ${
                            booked
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-75'
                              : selected
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {booked ? 'Занято' : selected ? '✓' : ''}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Плавающая плашка с подтверждением выбранного интервала */}
      {range && (
        <div className="fixed bottom-6 right-6 z-40 bg-white p-4 rounded-2xl shadow-xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-in">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>
                {range.startDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })},{' '}
                {range.startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} —{' '}
                {range.endDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <span className="text-[11px] text-gray-500 block">
              Длительность: {((range.endDate.getTime() - range.startDate.getTime()) / (1000 * 60 * 60)).toFixed(1)} ч.
            </span>
          </div>
          <button
            type="button"
            onClick={handleProceedBooking}
            className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Перейти к оформлению</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}