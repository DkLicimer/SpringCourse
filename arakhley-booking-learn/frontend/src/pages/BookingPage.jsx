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
  
  // Массив выбранных домиков (поддержка одновременного выбора до 2 штук)
  const [selectedCabins, setSelectedCabins] = useState([]);
  const [numBeds, setNumBeds] = useState(1); // Для студентов всегда 1
  
  // Согласие на обработку персональных данных
  const [consent, setConsent] = useState(false);

  // Динамический список отдыхающих с новыми полями
  const [guests, setGuests] = useState([
    { full_name: '', category: 'ADULT', document_info: '', birth_date: '' }
  ]);

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

  const todayDateStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Ограничение бронирования концом августа текущего года
  const maxDateStr = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return `${currentYear}-08-31`;
  }, []);

  // Сброс выбора домиков и чекбокса при смене роли или дат
  useEffect(() => {
    setSelectedCabins([]);
    setConsent(false);
  }, [role, startDate, endDate]);

  // Фильтр ввода ФИО (разрешаем ТОЛЬКО кириллицу, пробелы и дефисы)
  const filterCyrillic = (value) => {
    return value.replace(/[^а-яА-ЯёЁ\s-]/g, "");
  };

  const handleContactNameChange = (e) => {
    setContactName(filterCyrillic(e.target.value));
  };

  const handleGuestNameChange = (idx, value) => {
    handleGuestChange(idx, 'full_name', filterCyrillic(value));
  };

  // Автоформатирование паспорта взрослых и детей 14-17 лет (XXXX XXXXXX - только цифры)
  const formatPassport = (value) => {
    const digits = value.replace(/\D/g, "").substring(0, 10);
    if (digits.length > 4) {
      return `${digits.substring(0, 4)} ${digits.substring(4)}`;
    }
    return digits;
  };

  // Форматирование детских документов (разрешаем латиницу для римских цифр, кириллицу для серии, цифры, дефисы и пробелы)
  const formatChildDoc = (value) => {
    return value.toUpperCase().replace(/[^А-ЯЁA-Z0-9\s-]/g, "");
  };

  const handleGuestDocChange = (idx, category, value) => {
    let formatted = value;
    if (category === 'ADULT' || category === 'TEEN_17') {
      formatted = formatPassport(value);
    } else {
      formatted = formatChildDoc(value);
    }
    handleGuestChange(idx, 'document_info', formatted);
  };

  // Интеллектуальная маска ввода телефона РФ
  const handlePhoneChange = (e) => {
    const input = e.target.value;

    if (input.length < contactPhone.length) {
      setContactPhone(input);
      return;
    }

    let digits = input.replace(/\D/g, "");
    
    if (digits.length === 0) {
      setContactPhone("");
      return;
    }
    
    if (digits.startsWith("8")) {
      digits = "7" + digits.slice(1);
    } else if (!digits.startsWith("7")) {
      digits = "7" + digits;
    }
    
    digits = digits.substring(0, 11);
    
    let formatted = "+7";
    if (digits.length > 1) {
      formatted += " (" + digits.substring(1, 4);
    }
    if (digits.length > 4) {
      formatted += ") " + digits.substring(4, 7);
    } else if (digits.length === 4) {
      formatted += ")";
    }
    
    if (digits.length > 7) {
      formatted += "-" + digits.substring(7, 9);
    }
    if (digits.length > 9) {
      formatted += "-" + digits.substring(9, 11);
    }
    
    setContactPhone(formatted);
  };

  // Проверка ограничений дат бронирования
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        setErrorMessage("Дата выезда должна быть позже даты заезда.");
        setCabins([]);
        return;
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

  // МГНОВЕННАЯ ПЕРЕСКАБИЛЯЦИЯ СТОИМОСТИ НА ФРОНТЕНДЕ НА ОСНОВЕ ПЛАТНЫХ КАТЕГОРИЙ ГОСТЕЙ И СПЕЦИФИКИ ДОМА №16
  const totalPrice = useMemo(() => {
    if (!startDate || !endDate || selectedCabins.length === 0 || cabins.length === 0) return 0;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    if (days <= 0) return 0;

    let totalSum = 0;
    
    if (role === 'STAFF') {
      // Считаем количество только платных отдыхающих
      const payingGuestsCount = guests.filter(g => 
        g.full_name.trim() !== '' && 
        (g.category === 'ADULT' || g.category === 'TEEN_17' || g.category === 'CHILD_13')
      ).length;

      const hasVip = selectedCabins.includes(16);
      const hasStandard = selectedCabins.some(num => num !== 16);

      // Начисляем фиксированные 2500 руб. за VIP домик №16, а стандартные домики рассчитываем поклиентно (по 610 руб. с человека)
      if (hasVip) {
        totalSum += 2500 * days;
      }
      if (hasStandard) {
        // Ищем первый выбранный стандартный домик для получения цены (обычно 610)
        const standardCabinNum = selectedCabins.find(num => num !== 16);
        const standardCabin = cabins.find(c => c.number === standardCabinNum);
        const pricePerPerson = standardCabin ? Number(standardCabin.price_staff_full_cabin) : 610;
        
        totalSum += payingGuestsCount * pricePerPerson * days;
      }
    } else {
      // Для студентов: расчет по койко-местам (всегда 1 место)
      selectedCabins.forEach(cabinNum => {
        const cabinObj = cabins.find(c => c.number === cabinNum);
        if (cabinObj) {
          totalSum += Number(cabinObj.price_student_bed) * 1 * days;
        }
      });
    }

    return totalSum;
  }, [startDate, endDate, selectedCabins, cabins, role, numBeds, guests]);

  // Функции управления списком гостей
  const addGuest = () => {
    setGuests([...guests, { full_name: '', category: 'ADULT', document_info: '', birth_date: '' }]);
  };

  const removeGuest = (index) => {
    setGuests(guests.filter((_, i) => i !== index));
  };

  const handleGuestChange = (index, field, value) => {
    const updated = [...guests];
    updated[index][field] = value;
    setGuests(updated);
  };

  const validateFIO = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    const parts = trimmed.split(/\s+/);
    return parts.length >= 2;
  };

  // Обработка отправки формы
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (selectedCabins.length === 0) {
      setErrorMessage("Пожалуйста, выберите хотя бы один гостевой дом на интерактивной схеме.");
      window.scrollTo({ top: 400, behavior: 'smooth' });
      return;
    }

    let maxBedsTotal = 0;
    if (role === 'STAFF') {
      selectedCabins.forEach(cabinNum => {
        const cabinObj = cabins.find(c => c.number === cabinNum);
        if (cabinObj) {
          maxBedsTotal += cabinObj.capacity;
        } else {
          maxBedsTotal += 4;
        }
      });
    } else {
      maxBedsTotal = 1; // Для студентов всегда максимум 1
    }

    const guestsRequiringBed = guests.filter(g => g.full_name.trim() !== "" && g.category !== 'CHILD_3').length;

    if (guestsRequiringBed > maxBedsTotal) {
      setErrorMessage(
        `Превышена вместимость спальных мест. Вы забронировали места на ${maxBedsTotal} чел., но указали ${guestsRequiringBed} гостей, требующих спальное место.`
      );
      return;
    }

    if (!validateFIO(contactName)) {
      setErrorMessage("Укажите ваше ФИО полностью (Фамилия и Имя).");
      return;
    }

    if (contactPhone.length < 18) {
      setErrorMessage("Укажите корректный номер мобильного телефона в формате +7 (9XX) XXX-XX-XX.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactEmail)) {
      setErrorMessage("Укажите корректный адрес электронной почты.");
      return;
    }

    // СТРОГАЯ ВАЛИДАЦИЯ ПЕРЕД ОТПРАВКОЙ НА БЭКЕНД
    for (let i = 0; i < guests.length; i++) {
      const g = guests[i];
      const name = g.full_name.trim();
      const doc = g.document_info.trim();
      const isChild = g.category !== 'ADULT';
      const isPassport = g.category === 'ADULT' || g.category === 'TEEN_17';

      if (!name) {
        setErrorMessage(`Укажите ФИО для отдыхающего №${i + 1}.`);
        return;
      }
      if (!validateFIO(name)) {
        setErrorMessage(`Укажите ФИО полностью (Фамилия и Имя) для отдыхающего №${i + 1}.`);
        return;
      }
      if (!doc) {
        const docName = isPassport ? "паспорта" : "свидетельства о рождении";
        setErrorMessage(`Укажите серию и номер ${docName} для отдыхающего №${i + 1}.`);
        return;
      }
      if (isPassport && doc.replace(/\s/g, "").length < 10) {
        setErrorMessage(`Серия и номер паспорта отдыхающего №${i + 1} должны содержать 10 цифр.`);
        return;
      }
      if (isChild && !g.birth_date) {
        setErrorMessage(`Укажите дату рождения для отдыхающего №${i + 1} (ребенок).`);
        return;
      }
    }

    if (!consent) {
      setErrorMessage("Необходимо подтвердить согласие на обработку персональных данных.");
      return;
    }

    setIsSubmitting(true);

    const mainCabinObj = cabins.find(c => c.number === selectedCabins[0]);
    const bookingPayload = {
      cabin: mainCabinObj?.id,
      second_cabin: selectedCabins.length > 1 ? cabins.find(c => c.number === selectedCabins[1])?.id : undefined,
      user_role: role,
      num_beds_booked: role === 'STAFF' ? (mainCabinObj?.capacity || 4) : 1, // Для студентов всегда 1
      start_date: startDate,
      end_date: endDate,
      contact_name: contactName.trim(),
      contact_phone: contactPhone,
      contact_email: contactEmail.trim(),
      department: role === 'STAFF' ? department.trim() : undefined,
      position: role === 'STAFF' ? position.trim() : undefined,
      faculty: role === 'STUDENT' ? faculty.trim() : undefined,
      academic_group: role === 'STUDENT' ? academicGroup.trim() : undefined,
      guests: guests.map(g => ({
        full_name: g.full_name.trim(),
        category: g.category,
        document_info: g.document_info.trim(),
        birth_date: g.category !== 'ADULT' ? g.birth_date : null
      }))
    };

    try {
      const response = await api.createBooking(bookingPayload);
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
        
        {/* ЛЕВАЯ КОЛОНКА */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Шаг 1 */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-natural-blue text-white flex items-center justify-center text-xs">1</span>
              Выберите категорию
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => { setRole('STAFF'); setNumBeds(1); }}
                className={`py-3 px-4 border rounded-xl font-semibold text-sm transition-all duration-150 flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  role === 'STAFF' 
                    ? 'border-natural-blue bg-blue-50/50 text-natural-blue' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span>🏢 Сотрудник</span>
                <span className="text-[10px] font-normal text-gray-500">Бронь до 2-х домиков</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRole('STUDENT'); 
                  setNumBeds(1);
                  // Принудительно сбрасываем список гостей до 1 карточки при переходе на роль студента
                  setGuests([{ full_name: '', category: 'ADULT', document_info: '', birth_date: '' }]);
                }}
                className={`py-3 px-4 border rounded-xl font-semibold text-sm transition-all duration-150 flex flex-col items-center justify-center gap-1 cursor-pointer ${
                  role === 'STUDENT' 
                    ? 'border-natural-blue bg-blue-50/50 text-natural-blue' 
                    : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span>🎓 Студент</span>
                <span className="text-[10px] font-normal text-gray-500">Бронь койко-места (макс. 1)</span>
              </button>
            </div>
          </div>

          {/* Шаг 2 */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-natural-blue text-white flex items-center justify-center text-xs">2</span>
              Даты отдыха
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Дата заезда</label>
                <input
                  type="date"
                  required
                  min={todayDateStr}
                  max={maxDateStr}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate && e.target.value >= endDate) {
                      setEndDate('');
                    }
                  }}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-natural-blue bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Дата выезда</label>
                <input
                  type="date"
                  required
                  disabled={!startDate}
                  min={startDate ? new Date(new Date(startDate).getTime() + 86400000).toISOString().split('T')[0] : todayDateStr}
                  max={maxDateStr}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:border-natural-blue bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Шаг 3 */}
          {startDate && endDate && !errorMessage && (
            <InteractiveMap
              cabinsData={cabins}
              selectedCabins={selectedCabins}
              onCabinSelect={setSelectedCabins}
              isLoading={isLoadingCabins}
              role={role}
            />
          )}

          {/* Шаг 4: Список отдыхающих */}
          {selectedCabins.length > 0 && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-md font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-natural-blue text-white flex items-center justify-center text-xs">3</span>
                  Список отдыхающих
                </h2>
                {/* Кнопка добавления доступна только для сотрудников */}
                {role === 'STAFF' && (
                  <button
                    type="button"
                    onClick={addGuest}
                    className="text-xs font-bold text-natural-blue hover:underline cursor-pointer"
                  >
                    + Добавить человека
                  </button>
                )}
              </div>

              {/* ДИНАМИЧЕСКИЙ СПИСОК КАРТОЧЕК ГОСТЕЙ С ДОКУМЕНТАМИ */}
              <div className="space-y-4">
                {guests.map((guest, idx) => (
                  <div key={idx} className="p-4 bg-gray-50/50 rounded-xl border border-gray-150/70 space-y-3 relative">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-150/70">
                      <span className="text-xs font-bold text-natural-blue uppercase tracking-wider">Отдыхающий №{idx + 1}</span>
                      {guests.length > 1 && role === 'STAFF' && (
                        <button
                          type="button"
                          onClick={() => removeGuest(idx)}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 cursor-pointer"
                        >
                          ❌ Удалить
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">ФИО полностью</label>
                        <input
                          type="text"
                          placeholder="Иванов Иван Иванович"
                          required
                          value={guest.full_name}
                          onChange={(e) => handleGuestNameChange(idx, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-natural-blue bg-white"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Категория</label>
                        <select
                          value={guest.category}
                          onChange={(e) => {
                            handleGuestChange(idx, 'category', e.target.value);
                            handleGuestChange(idx, 'document_info', ''); // сбрасываем документ при изменении
                            if (e.target.value === 'ADULT') {
                              handleGuestChange(idx, 'birth_date', '');
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-natural-blue"
                        >
                          <option value="ADULT">Взрослый</option>
                          <option value="CHILD_10">Ребенок до 10 лет (Бесплатно)</option>
                          <option value="CHILD_3">Ребенок до 3 лет (Без места)</option>
                          <option value="CHILD_13">Ребенок 10-13 лет</option>
                          <option value="TEEN_17">Ребенок 14-17 лет</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">
                          {(guest.category === 'ADULT' || guest.category === 'TEEN_17') ? 'Серия и номер паспорта' : 'Серия и номер свидетельства о рождении'}
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={(guest.category === 'ADULT' || guest.category === 'TEEN_17') ? 'Серия и номер (только цифры)' : 'Пример: I-АГ 123456'}
                          value={guest.document_info}
                          onChange={(e) => handleGuestDocChange(idx, guest.category, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-natural-blue bg-white"
                        />
                      </div>

                      {guest.category !== 'ADULT' && (
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase">Дата рождения</label>
                          <input
                            type="date"
                            required
                            max={todayDateStr}
                            value={guest.birth_date}
                            onChange={(e) => handleGuestChange(idx, 'birth_date', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-natural-blue bg-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-500 mt-3 italic">
                * Дети до 10 лет размещаются бесплатно. Дети до 3 лет проживают без предоставления отдельной койки.
              </p>
            </div>
          )}

        </div>

        {/* ПРАВАЯ КОЛОНКА */}
        <div className="lg:col-span-5 space-y-6">
          
          {selectedCabins.length > 0 && (
            <>
              {/* Контактные данные */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h2 className="text-md font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-natural-blue text-white flex items-center justify-center text-xs">4</span>
                  Контактные данные
                </h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Ваше ФИО полностью</label>
                    <input
                      type="text"
                      required
                      placeholder="Иванов Иван Иванович"
                      value={contactName}
                      onChange={handleContactNameChange}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-natural-blue"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Телефон</label>
                      <input
                        type="tel"
                        required
                        placeholder="+7 (999) 000-00-00"
                        value={contactPhone}
                        onChange={handlePhoneChange}
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

                  {role === 'STAFF' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
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

                  {role === 'STUDENT' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
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

              {/* Расчет стоимости */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Итоговая стоимость</h3>
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-black text-natural-blue">{totalPrice} руб.</span>
                    <span className="text-xs text-gray-500">
                      за {(new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)} сут.
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 space-y-1 pt-2 border-t border-gray-100">
                  <div className="flex justify-between">
                    <span>Забронировано домиков:</span>
                    <span className="font-semibold text-gray-700">{selectedCabins.length} шт.</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Тип тарифа:</span>
                    <span className="font-semibold text-gray-700">{role === 'STAFF' ? 'Сотрудник (целый домик)' : 'Студент (койка)'}</span>
                  </div>
                  {role === 'STUDENT' && (
                    <div className="flex justify-between">
                      <span>Количество коек:</span>
                      <span className="font-semibold text-gray-700">1 шт.</span>
                    </div>
                  )}
                </div>

                {/* Согласие на ОПД */}
                <div className="flex items-start gap-2.5 pt-2 border-t border-gray-100">
                  <input
                    id="consent"
                    type="checkbox"
                    required
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-natural-blue border-gray-300 rounded focus:ring-natural-blue cursor-pointer"
                  />
                  <label htmlFor="consent" className="text-[11px] text-gray-600 leading-tight">
                    Я даю согласие на обработку персональных данных в соответствии с{' '}
                    <a 
                      href="/personal_data_regulation.pdf" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-natural-blue font-bold hover:underline"
                    >
                      {role === 'STUDENT' ? 'Положением ППОС ЗабГУ' : 'Положением об обработке ПДн ЗабГУ'}
                    </a>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !consent}
                  className={`w-full py-3.5 text-white rounded-xl font-bold text-center transition duration-150 shadow-lg focus:outline-none focus:ring-4 flex items-center justify-center gap-2 ${
                    isSubmitting || !consent
                      ? 'bg-gray-300 cursor-not-allowed opacity-60 shadow-none'
                      : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/10 focus:ring-emerald-500/20 cursor-pointer'
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