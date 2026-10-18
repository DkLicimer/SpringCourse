import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { formatRussianPhone, isPhoneValid } from '../../utils/phoneMask';
import { ArrowLeft } from 'lucide-react';

export default function SpaceApplyForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const [eventName, setEventName] = useState('');
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [soundEngineer, setSoundEngineer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!state.roomId) {
    return (
      <div className="max-w-md mx-auto my-12 text-center space-y-4">
        <p className="text-sm text-gray-500">Сначала выберите интервал времени в расписании.</p>
        <button 
          onClick={() => navigate('/spaces')} 
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-primary text-white rounded-xl text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Вернуться в каталог
        </button>
      </div>
    );
  }

  const handlePhoneChange = (e) => {
    setPhone(formatRussianPhone(e.target.value, phone));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isPhoneValid(phone)) {
      setError('Укажите полный номер телефона в формате +7 (9XX) XXX-XX-XX');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload = {
      room: state.roomId,
      event_name: eventName,
      start_time: state.startTime,
      end_time: state.endTime,
      sound_engineer_required: soundEngineer,
      applicant_full_name: fullName,
      applicant_position: position,
      applicant_email: email,
      applicant_phone: phone,
    };

    try {
      await api.post('/api/spaces/applications/', payload);
      alert('Ваша заявка успешно отправлена! Ожидайте подтверждения на Email.');
      navigate(`/spaces/${state.roomId}/schedule`);
    } catch (err) {
      setError(err.response?.data ? JSON.stringify(err.response.data) : 'Ошибка отправки заявки.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      
      {/* Кнопка НАЗАД */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-brand-primary transition cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-2xs"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад к расписанию
      </button>

      <div>
        <h1 className="text-2xl font-black font-heading text-gray-900">Заполните карточку заявки</h1>
        <p className="text-xs text-gray-500 mt-1">
          Помещение: <b className="text-gray-800">{state.roomName}</b> | Время: {new Date(state.startTime).toLocaleString('ru-RU')} — {new Date(state.endTime).toLocaleTimeString('ru-RU')}
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border-l-4 border-red-500 text-xs text-red-700 font-semibold rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Название мероприятия</label>
          <input
            type="text"
            required
            value={eventName}
            onChange={e => setEventName(e.target.value)}
            placeholder="Студенческий хакатон / Репетиция"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">ФИО заявителя полностью</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={e => setFullName(e.target.value)}
            placeholder="Иванов Иван Иванович"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Должность / Подразделение</label>
          <input
            type="text"
            required
            value={position}
            onChange={e => setPosition(e.target.value)}
            placeholder="Студент группы ИВТ-21 / Доцент кафедры"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Контактный E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ivanov@university.ru"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1 uppercase">Номер телефона</label>
            <input
              type="tel"
              required
              value={phone}
              onChange={handlePhoneChange}
              placeholder="+7 (9XX) XXX-XX-XX"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-brand-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            id="sound"
            type="checkbox"
            checked={soundEngineer}
            onChange={e => setSoundEngineer(e.target.checked)}
            className="w-4 h-4 rounded text-brand-primary focus:ring-brand-primary"
          />
          <label htmlFor="sound" className="text-xs text-gray-700 font-medium cursor-pointer">
            Требуется помощь звукорежиссёра / мультимедиа-специалиста
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-brand-primary hover:opacity-90 text-white font-bold rounded-xl text-xs transition mt-4"
        >
          {isSubmitting ? 'Отправка заявки...' : 'Отправить заявку модератору'}
        </button>
      </form>
    </div>
  );
}