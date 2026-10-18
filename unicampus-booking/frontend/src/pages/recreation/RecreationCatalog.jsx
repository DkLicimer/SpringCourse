import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import InteractiveMap from '../../components/InteractiveMap';
import { formatRussianPhone, isPhoneValid } from '../../utils/phoneMask';
import { Map, LayoutGrid, X } from 'lucide-react';

export default function RecreationCatalog() {
  const navigate = useNavigate();

  const [role, setRole] = useState('STAFF');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cabins, setCabins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCabin, setSelectedCabin] = useState(null);
  const [viewMode, setViewMode] = useState('map');

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [error, setError] = useState(null);

  const handleSearch = () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setSelectedCabin(null);
    setError(null);
    api.get(`/api/recreation/cabins/available/?start_date=${startDate}&end_date=${endDate}&role=${role}`)
      .then(res => setCabins(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handlePhoneChange = (e) => {
    setContactPhone(formatRussianPhone(e.target.value, contactPhone));
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!selectedCabin) return;

    if (!isPhoneValid(contactPhone)) {
      setError('Укажите полный номер телефона в формате +7 (9XX) XXX-XX-XX');
      return;
    }

    const payload = {
      cabin: selectedCabin.id,
      user_role: role,
      start_date: startDate,
      end_date: endDate,
      contact_name: contactName,
      contact_phone: contactPhone,
      contact_email: contactEmail,
      guests: [{ full_name: contactName, category: 'ADULT' }]
    };

    try {
      const res = await api.post('/api/recreation/bookings/', payload);
      navigate(`/recreation/success/${res.data.id}`);
    } catch (err) {
      setError('Ошибка при создании бронирования: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-gray-900">Базы отдыха и кампус</h1>
        <p className="text-sm text-gray-500 mt-1">Выберите даты отдыха и категорию для расчета тарифа</p>
      </div>

      {/* Фильтр поиска */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Категория</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
          >
            <option value="STAFF">Сотрудник / Преподаватель</option>
            <option value="STUDENT">Студент</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Дата заезда</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Дата выезда</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={!startDate || !endDate || loading}
          className="w-full py-2.5 bg-brand-accent hover:opacity-90 text-white font-bold rounded-lg text-xs transition cursor-pointer"
        >
          {loading ? 'Поиск...' : 'Найти свободные места'}
        </button>
      </div>

      {/* Переключатель режима */}
      {cabins.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-xs font-bold text-gray-700">
            Найдено объектов: {cabins.length}
          </div>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'map' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Map className="w-4 h-4" />
              Интерактивная карта
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Списком карточек
            </button>
          </div>
        </div>
      )}

      {/* Отрисовка карты или карточек */}
      {cabins.length > 0 && (
        viewMode === 'map' ? (
          <InteractiveMap 
            cabins={cabins} 
            selectedCabin={selectedCabin} 
            onSelectCabin={setSelectedCabin} 
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cabins.map(cabin => (
              <div
                key={cabin.id}
                className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between ${
                  selectedCabin?.id === cabin.id
                    ? 'border-brand-accent bg-emerald-50/30 shadow-md ring-2 ring-brand-accent'
                    : cabin.is_available
                    ? 'bg-white border-gray-200 hover:border-gray-300'
                    : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                }`}
                onClick={() => cabin.is_available && setSelectedCabin(cabin)}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-base text-gray-900">Домик №{cabin.number}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      cabin.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {cabin.is_available ? 'Свободен' : 'Занят'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{cabin.description || 'Уютный гостевой дом'}</p>
                  <div className="text-xs text-gray-600 font-medium">
                    Вместимость: {cabin.capacity} спальных мест
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 mt-4 flex justify-between items-baseline">
                  <span className="text-xs text-gray-400">Стоимость:</span>
                  <span className="text-base font-black text-brand-primary">
                    {role === 'STAFF' ? `${cabin.price_staff_full_cabin} руб./сут` : `${cabin.price_student_bed} руб./сут`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Окно оформления выбранного домика с кнопкой Отмены/Сброса */}
      {selectedCabin && (
        <form onSubmit={handleCreateBooking} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md max-w-xl mx-auto space-y-4 animate-fade-in relative">
          
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="font-bold text-base text-gray-900">
              Оформление брони: Домик №{selectedCabin.number}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedCabin(null)}
              className="text-gray-400 hover:text-gray-700 p-1 rounded-lg text-xs font-semibold flex items-center gap-1"
              title="Отменить выбор"
            >
              <X className="w-4 h-4" /> Отмена
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-xs text-red-700 font-semibold rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">ФИО заявителя полностью</label>
            <input
              type="text"
              required
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              placeholder="Иванов Иван Иванович"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Телефон</label>
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={handlePhoneChange}
                placeholder="+7 (9XX) XXX-XX-XX"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Email</label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                placeholder="ivanov@mail.ru"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-brand-accent hover:opacity-90 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            Подтвердить бронь и перейти к оплате
          </button>
        </form>
      )}
    </div>
  );
}