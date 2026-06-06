import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import InteractiveMap from '../components/InteractiveMap';

export default function BookingPage() {
  const navigate = useNavigate();

  // 1. Состояние формы бронирования
  const [role, setRole] = useState('STAFF'); // 'STAFF' или 'STUDENT'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCabin, setSelectedCabin] = useState(null);
  const [numBeds, setNumBeds] = useState(1); // Только для студентов
  
  // Динамический список отдыхающих
  const [guests, setGuests] = useState([{ full_name: '', category: 'ADULT' }]);

  // Контактные данные
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  
  // Дополнительные данные в зависимости от роли
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');
  const [faculty, setFaculty] = useState('');
  const [academicGroup, setAcademicGroup] = useState('');

  // 2. Системные состояния
  const [cabins, setCabins] = useState([]);
  const [isLoadingCabins, setIsLoadingCabins] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Сброс выбора домика при смене роли или дат
  useEffect(() => {
    setSelectedCabin(null);
  }, [role, startDate, endDate]);

  // Проверка ограничений и загрузка свободных домиков при изменении дат
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Проверка на корректность периода
      if (start >= end) {
        setErrorMessage("Дата выезда должна быть позже даты заезда.");
        setCabins([]);
        return;
      }

      // Валидация будних дней для студентов по ТЗ (Страница 7)
      if (role === 'STUDENT') {
        const startDay = start.getDay(); // 0-Вс, 6-Сб
        const endDay = end.getDay();
        
        // Студент может отдыхать только в интервале Пн-Пт. 
        // Если заезд в Сб/Вс или выезд в Сб/Вс — блокируем.
        if (startDay === 0 || startDay === 6 || endDay === 0 || endDay === 6) {
          setErrorMessage("Студенты могут бронировать заезд только с понедельника по пятницу.");
          setCabins([]);
          return;
        }
      }

      setErrorMessage(null);
      loadCabinsAvailability();
    }
  }, [startDate, endDate, role, numBeds]);

  // Запрос доступных домиков к API
  const loadCabinsAvailability = async () => {
    setIsLoadingCabins(true);
    try {
      const data = await api.getCabins(startDate, endDate, role, numBeds);
      setCabins(data);
    } catch (err) {
      setErrorMessage("Не удалось загрузить данные о свободных местах. Пожалуйста, попробуйте позже.");
    } finally {
      setIsLoadingCabins(false);
    }
  };

  // Мгновенный автоматический расчет цены без перезагрузки (ТЗ Страница 9)
  const totalPrice = useMemo(() => {
    if (!startDate || !endDate || !selectedCabin || cabins.length === 0) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 0;

    const cabinObj = cabins.find(c => c.number === selectedCabin);
    if (!cabinObj) return 0;

    if (role === 'STAFF') {
      return Number(cabinObj.price_staff_full_cabin) * days;
    } else {
      return Number(cabinObj.price_student_bed) * numBeds * days;
    }
  }, [startDate, endDate, selectedCabin, cabins, role, numBeds]);

  // Функции управления списком гостей
  const addGuest = () => {
    setGuests([...guests, { full_name: '', category: 'ADULT' }]);
  };

  const removeGuest = (index) => {
    setGuests(guests.filter((_, i) => i !== index));
  };

  const handleGuestChange = (index, field, value) => {
    const updated = [...guests];
    updated[index][field] = value;
    setGuests(updated);
  };

  // Обработка отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCabin) {
      setErrorMessage("Пожалуйста, выберите домик на интерактивной карте.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const bookingPayload = {
      cabin: cabins.find(c => c.number === selectedCabin)?.id,
      user_role: role,
      num_beds_booked: role === 'STAFF' ? 4 : numBeds,
      start_date: startDate,
      end_date: endDate,
      contact_name: contactName,
      contact_phone: contactPhone,
      contact_email: contactEmail,
      department: role === 'STAFF' ? department : undefined,
      position: role === 'STAFF' ? position : undefined,
      faculty: role === 'STUDENT' ? faculty : undefined,
      academic_group: role === 'STUDENT' ? academicGroup : undefined,
      guests: guests.filter(g => g.full_name.trim() !== '') // Убираем пустые строки гостевого списка
    };

    try {
      const response = await api.createBooking(bookingPayload);
      // При успешном создании перенаправляем на страницу подтверждения и оплаты
      navigate(`/booking-success/${response.id}`);
    } catch (err) {
      const serverErrors = err.response?.data;
      if (serverErrors && typeof serverErrors === 'object') {
        const firstErrorKey = Object.keys(serverErrors)[0];
        setErrorMessage(`${firstErrorKey}: ${serverErrors[firstErrorKey]}`);
      } else {
        setErrorMessage("Произошла ошибка при оформлении бронирования. Проверьте правильность заполнения полей.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Онлайн-бронирование</h1>
        <p className="text-sm text-gray-500 mt-2">Заполните форму и выберите подходящий вариант проживания на Арахлее.</p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
          <p className="text-sm font-semibold text-red-800">{errorMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ЛЕВАЯ КОЛОНКА: Конфигурация параметров бронирования */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Шаг 1: Выбор категории пользователя */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-natural-blue text-white flex items-center justify-center text-xs">1</span>
              Выберите категорию
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => { setRole('STAFF'); setNumBeds(1); }}
                className={`py-3 px-4 border rounded-xl font-semibold text-sm transition-all duration-150 flex flex-col items-center justify-center gap-1 ${
                  role === 'STAFF' 
                    ? 'border-natural-blue bg-blue-50/50 text-natural-blue' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span>🏢 Сотрудник</span>
                <span className="text-xxs font-normal text-gray-500">Бронь домика целиком</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('STUDENT')}
                className={`py-3 px-4 border rounded-xl font-semibold text-sm transition-all duration-150 flex flex-col items-center justify-center gap-1 ${
                  role === 'STUDENT' 
                    ? 'border-natural-blue bg-blue-50/50 text-natural-blue' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span>🎓 Студент</span>
                <span className="text-xxs font-normal text-gray-500">Бронь койко-места (Пн-Пт)</span>
              </button>
            </div>
          </div>

          {/* Шаг 2: Даты и кол-во мест */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-natural-blue text-white flex items-center justify-center text-xs">2</span>
              Даты отдыха {role === 'STUDENT' && ' и места'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Дата заезда</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-natural-blue"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Дата выезда</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-natural-blue"
                />
              </div>
            </div>

            {role === 'STUDENT' && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase">Количество бронируемых койко-мест</label>
                <select
                  value={numBeds}
                  onChange={(e) => setNumBeds(Number(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-natural-blue bg-white"
                >
                  <option value={1}>1 койко-место</option>
                  <option value={2}>2 койко-места</option>
                  <option value={3}>3 койко-места</option>
                  <option value={4}>4 койко-места (весь домик)</option>
                </select>
              </div>
            )}
          </div>

          {/* Шаг 3: Интерактивная карта */}
          {startDate && endDate && !errorMessage && (
            <InteractiveMap
              cabinsData={cabins}
              selectedCabin={selectedCabin}
              onCabinSelect={setSelectedCabin}
              isLoading={isLoadingCabins}
            />
          )}

          {/* Шаг 4: Список отдыхающих по ТЗ (Страница 6) */}
          {selectedCabin && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-md font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-natural-blue text-white flex items-center justify-center text-xs">3</span>
                  Список отдыхающих
                </h2>
                <button
                  type="button"
                  onClick={addGuest}
                  className="text-xs font-bold text-natural-blue hover:underline"
                >
                  + Добавить человека
                </button>
              </div>

              <div className="space-y-3">
                {guests.map((guest, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="ФИО гостя"
                      required
                      value={guest.full_name}
                      onChange={(e) => handleGuestChange(idx, 'full_name', e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-natural-blue"
                    />
                    <select
                      value={guest.category}
                      onChange={(e) => handleGuestChange(idx, 'category', e.target.value)}
                      className="px-2 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-natural-blue"
                    >
                      <option value="ADULT">Взрослый</option>
                      <option value="CHILD_15">Ребенок до 15 лет (Бесплатно)</option>
                      <option value="CHILD_3">Ребенок до 3 лет (Без места)</option>
                    </select>
                    {guests.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeGuest(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                      >
                        ❌
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-500 mt-3 italic">
                * Дети до 15 лет размещаются бесплатно. Дети до 3 лет проживают без предоставления отдельной койки.
              </p>
            </div>
          )}

        </div>

        {/* ПРАВАЯ КОЛОНКА: Контактные данные и Итоговый расчет стоимости */}
        <div className="lg:col-span-5 space-y-6">
          
          {selectedCabin && (
            <>
              {/* Контактные данные */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-natural-blue text-white flex items-center justify-center text-xs">4</span>
                  Контактные данные
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Ваше ФИО</label>
                    <input
                      type="text"
                      required
                      placeholder="Иванов Иван Иванович"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-natural-blue"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Телефон</label>
                      <input
                        type="tel"
                        required
                        placeholder="+7 (999) 000-00-00"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-natural-blue"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">E-mail</label>
                      <input
                        type="email"
                        required
                        placeholder="ivanov@mail.ru"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-natural-blue"
                      />
                    </div>
                  </div>

                  {/* Специфичные поля для Сотрудника */}
                  {role === 'STAFF' && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Подразделение</label>
                        <input
                          type="text"
                          required
                          placeholder="Кафедра ИТ"
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-natural-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Должность</label>
                        <input
                          type="text"
                          required
                          placeholder="Доцент"
                          value={position}
                          onChange={(e) => setPosition(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-natural-blue"
                        />
                      </div>
                    </div>
                  )}

                  {/* Специфичные поля для Студента */}
                  {role === 'STUDENT' && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Факультет</label>
                        <input
                          type="text"
                          required
                          placeholder="ФИТИС"
                          value={faculty}
                          onChange={(e) => setFaculty(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-natural-blue"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Академ. группа</label>
                        <input
                          type="text"
                          required
                          placeholder="ИПB-22"
                          value={academicGroup}
                          onChange={(e) => setAcademicGroup(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-natural-blue"
                        />
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Финальный чекбокс и калькулятор стоимости */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Итоговая стоимость</h3>
                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-3xl font-black text-natural-blue">{totalPrice} руб.</span>
                  <span className="text-xs text-gray-500">
                    за {(new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)} сут.
                  </span>
                </div>

                <div className="text-xs text-gray-500 mb-6 space-y-1">
                  <div className="flex justify-between">
                    <span>Тип тарифа:</span>
                    <span className="font-semibold text-gray-700">{role === 'STAFF' ? 'Сотрудник (целый домик)' : 'Студент (койка)'}</span>
                  </div>
                  {role === 'STUDENT' && (
                    <div className="flex justify-between">
                      <span>Количество коек:</span>
                      <span className="font-semibold text-gray-700">{numBeds} шт.</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3.5 bg-emerald-500 text-white rounded-xl font-bold text-center hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/10 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 flex items-center justify-center gap-2 ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin">🔄</span>
                      Оформление...
                    </>
                  ) : (
                    "🚀 Отправить заявку"
                  )}
                </button>
              </div>
            </>
          )}

        </div>

      </form>
    </div>
  );
}