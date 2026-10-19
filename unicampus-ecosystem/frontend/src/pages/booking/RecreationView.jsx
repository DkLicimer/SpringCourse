import React, { useState } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { TreePine, Map, LayoutGrid, CheckCircle2, AlertCircle, Upload, X } from 'lucide-react';

export default function RecreationView() {
  const { user } = useAuth();
  const [role, setRole] = useState(user?.role === 'STUDENT' ? 'STUDENT' : 'STAFF');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cabins, setCabins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('map');
  const [selectedCabin, setSelectedCabin] = useState(null);

  // Форма бронирования
  const [contactName, setContactName] = useState(user?.full_name || '');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [error, setError] = useState('');

  // Загрузка чека
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptSuccess, setReceiptSuccess] = useState(false);

  const handleSearch = () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    setError('');
    setSelectedCabin(null);

    api.get(`/booking/recreation/cabins/available?start_date=${startDate}&end_date=${endDate}&role=${role}`)
      .then(res => setCabins(res.data))
      .catch(err => setError(err.response?.data?.detail || 'Ошибка поиска'))
      .finally(() => setLoading(false));
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!selectedCabin) return;

    try {
      const payload = {
        cabin_id: selectedCabin.id,
        user_role: role,
        start_date: startDate,
        end_date: endDate,
        contact_name: contactName,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        guests: [{ full_name: contactName, category: 'ADULT' }]
      };
      const res = await api.post('/booking/recreation/bookings', payload);
      setBookingSuccess(res.data);
      setSelectedCabin(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось оформить бронирование');
    }
  };

  const handleUploadReceipt = async (e) => {
    e.preventDefault();
    if (!receiptFile || !bookingSuccess) return;

    setUploadingReceipt(true);
    try {
      // 1. Загружаем файл в /api/upload
      const formData = new FormData();
      formData.append('file', receiptFile);
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // 2. Прикрепляем URL чека к брони
      const receiptPayload = new FormData();
      receiptPayload.append('file_url', uploadRes.data.url);
      await api.post(`/booking/recreation/bookings/${bookingSuccess.id}/upload-receipt`, receiptPayload);

      setReceiptSuccess(true);
    } catch (err) {
      alert('Ошибка загрузки чека');
    } finally {
      setUploadingReceipt(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center">
          <TreePine className="w-6 h-6 mr-2 text-emerald-600" />
          База отдыха ЗабГУ «Арахлей»
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Посуточный заезд на загородный спортивно-оздоровительный лагерь по льготным тарифам
        </p>
      </div>

      {/* Фильтр поиска */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4 items-end text-xs">
        <div>
          <label className="block font-bold text-slate-600 mb-1">Категория тарифа</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl bg-white"
          >
            <option value="STAFF">Сотрудник / Преподаватель (дом целиком)</option>
            <option value="STUDENT">Студент (оплата койко-места)</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-600 mb-1">Дата заезда</label>
          <input
            type="date"
            required
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl"
          />
        </div>

        <div>
          <label className="block font-bold text-slate-600 mb-1">Дата выезда</label>
          <input
            type="date"
            required
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl"
          />
        </div>

        <button
          onClick={handleSearch}
          disabled={!startDate || !endDate || loading}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow cursor-pointer transition"
        >
          {loading ? 'Поиск мест...' : 'Найти свободные домики'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-600 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Экран успеха с банковскими реквизитами ЗабГУ и формой чека */}
      {bookingSuccess && (
        <div className="bg-white p-6 rounded-3xl border border-emerald-200 shadow-md space-y-4 max-w-2xl mx-auto text-xs animate-fade-in">
          <div className="text-center space-y-1">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-black text-slate-900">Бронирование оформлено!</h3>
            <p className="text-slate-500 font-mono font-bold">№ {bookingSuccess.booking_number}</p>
            <p className="text-sm font-bold text-emerald-700 pt-1">
              К оплате: {bookingSuccess.total_price} руб.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border font-mono space-y-1 text-[11px] text-slate-700">
            <p className="font-bold text-slate-900">Реквизиты для оплаты (ЗабГУ):</p>
            <p>Получатель: УФК по Забайкальскому краю (ФГБОУ ВО «ЗабГУ»)</p>
            <p>ИНН: 7534000257 | КПП: 753601001</p>
            <p>Казначейский счет: 03214643000000012009</p>
            <p className="text-emerald-700 font-bold">Назначение: Арахлей ({bookingSuccess.booking_number})</p>
          </div>

          {!receiptSuccess ? (
            <form onSubmit={handleUploadReceipt} className="space-y-3 pt-2">
              <label className="block font-bold text-slate-700">Прикрепить квитанцию / чек об оплате:</label>
              <input
                type="file"
                required
                accept="image/*,.pdf"
                onChange={e => setReceiptFile(e.target.files[0])}
                className="w-full text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-100 file:text-emerald-800"
              />
              <button
                type="submit"
                disabled={uploadingReceipt}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer transition"
              >
                {uploadingReceipt ? 'Отправка чека...' : 'Отправить чек бухгалтеру'}
              </button>
            </form>
          ) : (
            <div className="p-3 bg-blue-50 text-blue-800 rounded-xl font-bold text-center">
              ✓ Чек передан на проверку. Путевка придет на Email после верификации бухгалтерией.
            </div>
          )}
        </div>
      )}

      {/* Переключатель режимов: Карта / Карточки */}
      {cabins.length > 0 && !bookingSuccess && (
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-600">Найдено объектов: {cabins.length}</span>
          <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition ${
                viewMode === 'map' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              <Map className="w-3.5 h-3.5" /> Схема озера
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Карточки
            </button>
          </div>
        </div>
      )}

      {/* Интерактивная векторная карта SVG */}
      {cabins.length > 0 && !bookingSuccess && viewMode === 'map' && (
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="relative w-full aspect-[16/10] bg-[#C4D977] rounded-2xl overflow-hidden border">
            <svg viewBox="0 0 1650 1200" className="w-full h-full select-none">
              {/* Пляжная линия и озеро Арахлей */}
              <path d="M -10,-10 L 850,-10 C 720,200 450,230 280,310 C 180,350 90,480 -10,710 Z" fill="#F4DEAF" />
              <path d="M -10,-10 L 680,-10 C 580,160 350,180 200,240 C 110,280 60,390 -10,540 Z" fill="#22D3EE" />
              <text x="180" y="110" fill="#ffffff" fontSize="28" fontWeight="bold" opacity="0.9">
                ОЗЕРО АРАХЛЕЙ / ПЛЯЖНАЯ ЗОНА
              </text>

              {/* Здание администрации базы */}
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
                    onClick={() => isAvail && setSelectedCabin(cabin)}
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
      )}

      {/* Режим отображения карточками */}
      {cabins.length > 0 && !bookingSuccess && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cabins.map(cabin => (
            <div
              key={cabin.id}
              className={`p-6 rounded-3xl border transition flex flex-col justify-between ${
                selectedCabin?.id === cabin.id
                  ? 'border-emerald-600 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-base">Домик №{cabin.number}</h3>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    cabin.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {cabin.is_available ? 'Свободен' : 'Занят'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{cabin.description || 'Уютный летний домик'}</p>
                <p className="text-xs font-semibold text-slate-700">Вместимость: {cabin.capacity} спальных мест</p>
              </div>

              <div className="pt-4 border-t mt-4 flex justify-between items-center">
                <span className="text-sm font-black text-emerald-700">
                  {role === 'STAFF' ? `${cabin.price_staff_full_cabin} руб./сут` : `${cabin.price_student_bed} руб./сут (койка)`}
                </span>

                {cabin.is_available && (
                  <button
                    onClick={() => setSelectedCabin(cabin)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
                  >
                    Выбрать
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Форма бронирования выбранного домика */}
      {selectedCabin && !bookingSuccess && (
        <form
          onSubmit={handleCreateBooking}
          className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl max-w-lg mx-auto space-y-4 text-xs animate-fade-in"
        >
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-bold text-sm text-slate-900">
              Оформление: Домик №{selectedCabin.number} ({startDate} — {endDate})
            </h3>
            <button
              type="button"
              onClick={() => setSelectedCabin(null)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block font-bold text-slate-600 mb-1">ФИО заявителя полностью</label>
            <input
              type="text"
              required
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-600 mb-1">Телефон</label>
              <input
                type="tel"
                required
                placeholder="+7 (9XX) XXX-XX-XX"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Email</label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer transition mt-2"
          >
            Подтвердить бронь и получить реквизиты к оплате
          </button>
        </form>
      )}
    </div>
  );
}