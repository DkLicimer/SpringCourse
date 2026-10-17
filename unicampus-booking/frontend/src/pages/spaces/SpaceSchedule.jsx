import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

const TIME_START = 8.5; // 8:30
const TIME_END = 22.0;  // 22:00
const STEP = 0.5;       // 30 минут

export default function SpaceSchedule() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [bookings, setBookings] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]); // Array of ISO strings

  // Загрузка данных комнаты
  useEffect(() => {
    api.get(`/api/spaces/rooms/${id}/`).then(res => setRoom(res.data));
  }, [id]);

  // Загрузка расписания
  useEffect(() => {
    const startDate = formatDate(currentMonday);
    const sunday = new Date(currentMonday);
    sunday.setDate(sunday.getDate() + 6);
    const endDate = formatDate(sunday);

    api.get(`/api/spaces/rooms/${id}/schedule/?start_date=${startDate}&end_date=${endDate}`)
      .then(res => setBookings(res.data))
      .catch(err => console.error(err));
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
    return d.toISOString().split('T')[0];
  }

  const handlePrevWeek = () => {
    const prev = new Date(currentMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentMonday(prev);
    setSelectedSlots([]);
  };

  const handleNextWeek = () => {
    const next = new Date(currentMonday);
    next.setDate(next.getDate() + 7);
    setCurrentMonday(next);
    setSelectedSlots([]);
  };

  const isBooked = (dateTimeStr) => {
    const slotTime = new Date(dateTimeStr).getTime();
    return bookings.some(b => {
      const start = new Date(b.start_time).getTime();
      const end = new Date(b.end_time).getTime();
      return slotTime >= start && slotTime < end;
    });
  };

  const handleSlotClick = (dateTimeStr) => {
    if (isBooked(dateTimeStr)) return;

    if (selectedSlots.includes(dateTimeStr)) {
      setSelectedSlots(selectedSlots.filter(s => s !== dateTimeStr));
    } else {
      setSelectedSlots([...selectedSlots, dateTimeStr].sort());
    }
  };

  const handleProceedBooking = () => {
    if (selectedSlots.length === 0) return;
    const sorted = [...selectedSlots].sort();
    const startTime = sorted[0];
    const lastSlot = new Date(sorted[sorted.length - 1]);
    const endTime = new Date(lastSlot.getTime() + 30 * 60 * 1000).toISOString();

    navigate(`/spaces/${id}/apply`, {
      state: { roomId: id, roomName: room.name, startTime, endTime }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Шапка выбора */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link to="/spaces" className="text-xs text-brand-primary font-bold hover:underline">
            ← Вернуться к списку аудиторий
          </Link>
          <h1 className="text-2xl font-black font-heading text-gray-900 mt-1">
            {room ? room.name : 'Расписание аудитории'}
          </h1>
        </div>

        {/* Навигатор недель */}
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-200">
          <button onClick={handlePrevWeek} className="p-1 hover:bg-gray-100 rounded-lg text-gray-700">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold text-gray-800">
            {currentMonday.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — {' '}
            {new Date(currentMonday.getTime() + 6 * 86400000).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
          </span>
          <button onClick={handleNextWeek} className="p-1 hover:bg-gray-100 rounded-lg text-gray-700">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Легенда */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-white border border-gray-300 rounded"></span> Свободно</div>
        <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-gray-500 rounded"></span> Занято</div>
        <div className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 bg-brand-accent rounded"></span> Выбрано вами</div>
      </div>

      {/* Интерактивная 30-минутная сетка */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto p-4 shadow-xs">
        <table className="w-full min-w-[700px] border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2 border-b border-gray-100 text-left text-gray-400 font-medium">Время</th>
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((dayName, idx) => {
                const dayDate = new Date(currentMonday);
                dayDate.setDate(dayDate.getDate() + idx);
                return (
                  <th key={idx} className="p-2 border-b border-gray-100 text-center text-gray-700 font-bold">
                    {dayName}, {dayDate.getDate()}
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
                <tr key={rIdx} className="border-b border-gray-50">
                  <td className="p-1.5 text-gray-400 font-mono text-[11px] whitespace-nowrap">{timeLabel}</td>
                  {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => {
                    const slotDate = new Date(currentMonday);
                    slotDate.setDate(slotDate.getDate() + dayIdx);
                    slotDate.setHours(h, m, 0, 0);
                    const dtStr = slotDate.toISOString();

                    const booked = isBooked(dtStr);
                    const selected = selectedSlots.includes(dtStr);

                    return (
                      <td key={dayIdx} className="p-1 text-center">
                        <button
                          type="button"
                          disabled={booked}
                          onClick={() => handleSlotClick(dtStr)}
                          className={`w-full h-7 rounded-md transition text-[10px] font-semibold ${
                            booked
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : selected
                              ? 'bg-brand-accent text-white shadow-xs'
                              : 'bg-emerald-50/50 hover:bg-emerald-100 text-emerald-800'
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

      {/* Кнопка подтверждения */}
      {selectedSlots.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 bg-white p-4 rounded-2xl shadow-xl border border-gray-200 flex items-center gap-4 animate-fade-in">
          <div>
            <span className="text-xs text-gray-500 block">Выбрано слотов: {selectedSlots.length} ({(selectedSlots.length * 30) / 60} ч.)</span>
            <span className="text-xs font-bold text-gray-900 block">Нажмите для оформления заявки</span>
          </div>
          <button
            onClick={handleProceedBooking}
            className="px-6 py-2.5 bg-brand-accent hover:opacity-90 text-white font-bold rounded-xl text-xs transition"
          >
            Перейти к оформлению →
          </button>
        </div>
      )}

    </div>
  );
}