import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useBrand } from '../../context/BrandContext';
import { TreePine, Calendar, Users } from 'lucide-react';

export default function RecreationCatalog() {
  const { brand } = useBrand();
  const navigate = useNavigate();

  const [role, setRole] = useState('STAFF');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cabins, setCabins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCabin, setSelectedCabin] = useState(null);

  // Поля формы бронирования
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const handleSearch = () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    api.get(`/api/recreation/cabins/available/?start_date=${startDate}&end_date=${endDate}&role=${role}`)
      .then(res => setCabins(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!selectedCabin) return;

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
      alert('Ошибка при создании бронирования: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
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
          className="w-full py-2.5 bg-brand-accent hover:opacity-90 text-white font-bold rounded-lg text-xs transition"
        >
          {loading ? 'Поиск...' : 'Найти свободные места'}
        </button>
      </div>

      {/* Список свободных домиков */}
      {cabins.length > 0 && (
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
      )}

      {/* Форма подтверждения */}
      {selectedCabin && (
        <form onSubmit={handleCreateBooking} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm max-w-xl mx-auto space-y-4 animate-fade-in">
          <h3 className="font-bold text-base text-gray-900 pb-2 border-b border-gray-100">
            Оформление брони: Домик №{selectedCabin.number}
          </h3>
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
                onChange={e => setContactPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
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
            className="w-full py-3 bg-brand-accent hover:opacity-90 text-white font-bold rounded-xl text-xs transition"
          >
            Подтвердить бронь и перейти к оплате
          </button>
        </form>
      )}
    </div>
  );
}