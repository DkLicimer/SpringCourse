import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Building2, Users, Clock, ArrowRight, RotateCcw, CheckCircle2, AlertCircle } from 'lucide-react';

const TIME_START = 8.5; // 08:30
const TIME_END = 21.0;  // 21:00
const STEP = 0.5;       // 30 минут

export default function SpacesView() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Выбранная аудитория для открытия сетки
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentMonday, setCurrentMonday] = useState(getMonday(new Date()));
  const [scheduleBookings, setScheduleBookings] = useState([]);
  
  // Выбор интервала бронирования (timestamp)
  const [startTs, setStartTs] = useState(null);
  const [endTs, setEndTs] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  
  // Форма заявки
  const [form, setForm] = useState({
    eventName: '',
    fullName: user?.full_name || '',
    position: user?.role === 'STUDENT' ? 'Студент' : 'Преподаватель/Сотрудник',
    email: user?.email || '',
    phone: '',
    soundEngineer: false
  });
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [submitError, setSubmitError] = useState('');

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

  useEffect(() => {
    api.get('/booking/spaces/rooms')
      .then(res => setRooms(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedRoom) return;

    const startDate = formatDate(currentMonday);
    const sunday = new Date(currentMonday);
    sunday.setDate(sunday.getDate() + 6);
    const endDate = formatDate(sunday);

    api.get(`/booking/spaces/rooms/${selectedRoom.id}/schedule?start_date=${startDate}&end_date=${endDate}`)
      .then(res => setScheduleBookings(res.data))
      .catch(err => console.error(err));
  }, [selectedRoom, currentMonday]);

  const isBooked = (timestamp) => {
    return scheduleBookings.some(b => {
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

  const handleSlotClick = (timestamp) => {
    if (isBooked(timestamp)) return;

    if (!startTs || (startTs && endTs)) {
      setStartTs(timestamp);
      setEndTs(null);
    } else {
      const dateA = new Date(startTs).toDateString();
      const dateB = new Date(timestamp).toDateString();

      if (dateA !== dateB) {
        setStartTs(timestamp);
        setEndTs(null);
        return;
      }

      setEndTs(timestamp);
    }
  };

  const getSelectedRange = () => {
    if (!startTs) return null;
    const min = Math.min(startTs, endTs || startTs);
    const max = Math.max(startTs, endTs || startTs);
    const startDate = new Date(min);
    const endDate = new Date(max + STEP * 60 * 60 * 1000);
    return { startDate, endDate };
  };

  const range = getSelectedRange();

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!range) return;

    setSubmitError('');
    setSubmitSuccess('');

    const payload = {
      room_id: selectedRoom.id,
      event_name: form.eventName,
      start_time: range.startDate.toISOString(),
      end_time: range.endDate.toISOString(),
      sound_engineer_required: form.soundEngineer,
      applicant_full_name: form.fullName,
      applicant_position: form.position,
      applicant_email: form.email,
      applicant_phone: form.phone
    };

    try {
      await api.post('/booking/spaces/applications', payload);
      setSubmitSuccess('Заявка успешно зарегистрирована и направлена диспетчеру!');
      setIsApplying(false);
      setStartTs(null);
      setEndTs(null);
    } catch (err) {
      setSubmitError(err.response?.data?.detail || 'Не удалось отправить заявку');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center">
          <Building2 className="w-6 h-6 mr-2 text-blue-600" />
          Аудитории, коворкинги и актовые залы
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Онлайн-бронирование инфраструктуры кампуса для студенческих инициатив и мероприятий
        </p>
      </div>

      {submitSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" /> {submitSuccess}
        </div>
      )}

      {/* Каталог аудиторий */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map(room => (
          <div
            key={room.id}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="p-6 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-base text-slate-900">{room.name}</h3>
                <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {room.capacity_seats} мест
                </span>
              </div>

              <p className="text-xs text-slate-500">{room.address}</p>

              <div className="flex flex-wrap gap-1.5 pt-2">
                {room.amenities.map((item, idx) => (
                  <span key={idx} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={() => { setSelectedRoom(room); setStartTs(null); setEndTs(null); }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
              >
                Расписание и бронь →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Модальная 30-минутная сетка расписания */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">{selectedRoom.name}</h3>
                <p className="text-xs text-slate-400">Кликните на начало и окончание желаемого интервала времени</p>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xl"
              >
                ×
              </button>
            </div>

            {submitError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">
                {submitError}
              </div>
            )}

            {/* Таблица сетки слотов */}
            <div className="overflow-x-auto max-h-96 border rounded-2xl">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b">
                    <th className="p-2 text-slate-400 font-bold">Время</th>
                    {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, idx) => (
                      <th key={idx} className="p-2 font-bold text-slate-700">{day}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: (TIME_END - TIME_START) / STEP }).map((_, rIdx) => {
                    const hour = TIME_START + rIdx * STEP;
                    const h = Math.floor(hour);
                    const m = (hour % 1) * 60;
                    const timeLabel = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

                    return (
                      <tr key={rIdx} className="border-b border-slate-50">
                        <td className="p-1 font-mono text-[11px] text-slate-400">{timeLabel}</td>
                        {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => {
                          const slotDate = new Date(currentMonday);
                          slotDate.setDate(slotDate.getDate() + dayIdx);
                          slotDate.setHours(h, m, 0, 0);

                          const ts = slotDate.getTime();
                          const booked = isBooked(ts);
                          const active = isSelected(ts);

                          return (
                            <td key={dayIdx} className="p-1">
                              <button
                                type="button"
                                disabled={booked}
                                onClick={() => handleSlotClick(ts)}
                                className={`w-full h-6 rounded text-[10px] font-bold cursor-pointer transition ${
                                  booked
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    : active
                                    ? 'bg-emerald-600 text-white shadow'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {booked ? '—' : active ? '✓' : ''}
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

            {/* Панель выбранного интервала и кнопка перехода к оформлению */}
            {range && !isApplying && (
              <div className="bg-slate-50 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="text-xs text-slate-700 font-semibold">
                  Выбрано: <b>{range.startDate.toLocaleDateString('ru-RU')}</b> c{' '}
                  <b>{range.startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</b> до{' '}
                  <b>{range.endDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</b>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => { setStartTs(null); setEndTs(null); }}
                    className="p-2 text-slate-400 hover:text-slate-600"
                    title="Сбросить выбор"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsApplying(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition flex items-center justify-center gap-1.5"
                  >
                    Заполнить заявку <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Форма заявки */}
            {isApplying && (
              <form onSubmit={handleApplySubmit} className="bg-slate-50 p-5 rounded-2xl space-y-3 text-xs border">
                <h4 className="font-bold text-slate-900 border-b pb-2">Карточка заявки на аудиторию</h4>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Название мероприятия</label>
                  <input
                    type="text"
                    required
                    value={form.eventName}
                    onChange={e => setForm({ ...form, eventName: e.target.value })}
                    placeholder="напр. Репетиция команды КВН / Научный семинар"
                    className="w-full px-3 py-2 border rounded-xl bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">ФИО заявителя</label>
                    <input
                      type="text"
                      required
                      value={form.fullName}
                      onChange={e => setForm({ ...form, fullName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Телефон</label>
                    <input
                      type="tel"
                      required
                      placeholder="+7 (9XX) XXX-XX-XX"
                      value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="sound_check"
                    checked={form.soundEngineer}
                    onChange={e => setForm({ ...form, soundEngineer: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600"
                  />
                  <label htmlFor="sound_check" className="font-semibold text-slate-700 cursor-pointer">
                    Требуется помощь звукорежиссёра и мультимедиа-специалиста
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    type="button"
                    onClick={() => setIsApplying(false)}
                    className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Назад к слотам
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow"
                  >
                    Отправить модератору
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}