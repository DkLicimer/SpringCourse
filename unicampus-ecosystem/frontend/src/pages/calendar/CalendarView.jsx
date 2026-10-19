import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar as CalendarIcon, Clock, MapPin, Filter, Plus, 
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Tag
} from 'lucide-react';

export default function CalendarView() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Фильтры
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState('');
  
  // Модальное окно создания мероприятия (для администраторов)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    category: 'Воспитательное',
    is_mandatory: false,
    target_type: 'all',
    target_course: 1
  });

  const canCreateEvent = user && ['ADMIN', 'HEAD_CURATOR'].includes(user.role);

  // Вычисление интервала отображения (текущий месяц)
  const getMonthRange = (d) => {
    const year = d.getFullYear();
    const month = d.getMonth();
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  };

  const loadGrid = () => {
    setLoading(true);
    setError('');
    const { startDate, endDate } = getMonthRange(currentDate);

    let url = `/calendar/grid?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
    if (selectedCourse) url += `&course=${selectedCourse}`;
    if (selectedFaculty) url += `&faculty=${encodeURIComponent(selectedFaculty)}`;

    api.get(url)
      .then(res => setItems(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Не удалось загрузить календарный план'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadGrid();
  }, [currentDate, selectedCourse, selectedFaculty]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newEvent,
        start_time: new Date(newEvent.start_time).toISOString(),
        end_time: newEvent.end_time ? new Date(newEvent.end_time).toISOString() : null,
        target_course: newEvent.target_type === 'course' ? parseInt(newEvent.target_course) : null
      };
      await api.post('/calendar/events', payload);
      setIsModalOpen(false);
      setNewEvent({
        title: '', description: '', start_time: '', end_time: '',
        location: '', category: 'Воспитательное', is_mandatory: false,
        target_type: 'all', target_course: 1
      });
      loadGrid();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка создания мероприятия');
    }
  };

  // Группировка событий по датам (YYYY-MM-DD)
  const groupedByDay = items.reduce((acc, item) => {
    const dayKey = item.start_time.substring(0, 10);
    if (!acc[dayKey]) acc[dayKey] = [];
    acc[dayKey].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Шапка и управляющие кнопки */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <CalendarIcon className="w-6 h-6 mr-2 text-blue-600" />
            Единый календарный план ЗабГУ
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Сводное расписание мероприятий, занятости аудиторий и дедлайнов отчетов кураторов
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {canCreateEvent && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex-1 md:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Добавить мероприятие
            </button>
          )}

          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition cursor-pointer"
              title="Предыдущий месяц"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold px-3 text-slate-800 capitalize">
              {currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white rounded-lg text-slate-700 transition cursor-pointer"
              title="Следующий месяц"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Панель фильтров и легенда */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-700">Фильтры:</span>
          </div>

          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none"
          >
            <option value="">Все курсы</option>
            {[1, 2, 3, 4, 5, 6].map(c => (
              <option key={c} value={c}>{c} курс</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Факультет / Институт..."
            value={selectedFaculty}
            onChange={(e) => setSelectedFaculty(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold focus:outline-none w-48"
          />
        </div>

        {/* Легенда маркеров */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-600">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Обязательное</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span> По выбору</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Бронь зала</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Дедлайн отчета</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Список событий по дням месяца */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400 font-medium">
          Загрузка расписания кампуса...
        </div>
      ) : Object.keys(groupedByDay).length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
          На выбранный месяц мероприятий не запланировано.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByDay).sort().map(([dateStr, dayItems]) => {
            const dateObj = new Date(dateStr);
            const isToday = new Date().toDateString() === dateObj.toDateString();

            return (
              <div key={dateStr} className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${
                    isToday ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {dateObj.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', weekday: 'short' })}
                  </span>
                  <div className="flex-grow h-px bg-slate-200" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dayItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded-md text-white shrink-0"
                            style={{ backgroundColor: item.badge_color }}
                          >
                            {item.category}
                          </span>

                          {item.is_mandatory && (
                            <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                              Обязательно
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm leading-snug">
                          {item.title}
                        </h3>

                        {item.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>
                            {new Date(item.start_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            {item.end_time && ` — ${new Date(item.end_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`}
                          </span>
                        </div>

                        {item.location && (
                          <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно добавления мероприятия */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <form
            onSubmit={handleCreateEvent}
            className="bg-white p-6 rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">Новое университетское мероприятие</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Название мероприятия</label>
              <input
                type="text"
                required
                value={newEvent.title}
                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="напр. Отборочный тур «Студенческая весна»"
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Начало</label>
                <input
                  type="datetime-local"
                  required
                  value={newEvent.start_time}
                  onChange={e => setNewEvent({ ...newEvent, start_time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Окончание (опц.)</label>
                <input
                  type="datetime-local"
                  value={newEvent.end_time}
                  onChange={e => setNewEvent({ ...newEvent, end_time: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Место проведения</label>
                <input
                  type="text"
                  required
                  value={newEvent.location}
                  onChange={e => setNewEvent({ ...newEvent, location: e.target.value })}
                  placeholder="Актовый зал «Кулагин»"
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Категория</label>
                <select
                  value={newEvent.category}
                  onChange={e => setNewEvent({ ...newEvent, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                >
                  <option value="Воспитательное">Воспитательное</option>
                  <option value="Творческое">Творческое</option>
                  <option value="Патриотическое">Патриотическое</option>
                  <option value="Профилактическое">Профилактическое</option>
                  <option value="Торжественное">Торжественное</option>
                  <option value="Спортивное">Спортивное</option>
                  <option value="Научно-образовательное">Научно-образовательное</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="mand_box"
                checked={newEvent.is_mandatory}
                onChange={e => setNewEvent({ ...newEvent, is_mandatory: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600"
              />
              <label htmlFor="mand_box" className="font-semibold text-slate-700 cursor-pointer">
                🔴 Обязательное участие для академических групп
              </label>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Краткое описание / регламент</label>
              <textarea
                rows="2"
                value={newEvent.description}
                onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow"
              >
                Опубликовать в план
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}