import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function SuccessPage() {
  const { id } = useParams(); // Получаем UUID брони из URL
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Состояние формы загрузки чека
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [file, setFile] = useState(null);
  const [comment, setComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Таймер обратного отсчета в секундах
  const [timeLeft, setTimeLeft] = useState(0);

  // Загрузка данных о бронировании при монтировании
  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    setIsLoading(true);
    try {
      // Делаем запрос к эндпоинту получения деталей бронирования
      // Примечание: предполагается, что бэкенд отдает бронь по GET /api/bookings/<id>/
      const response = await fetch(`/api/bookings/${id}/`);
      if (!response.ok) throw new Error("Бронирование не найдено.");
      const data = await response.json();
      setBooking(data);

      // Инициализируем таймер
      calculateTimeLeft(data.expires_at);
    } catch (err) {
      setError(err.message || "Ошибка загрузки деталей бронирования.");
    } finally {
      setIsLoading(false);
    }
  };

  // Расчет оставшегося времени на оплату
  const calculateTimeLeft = (expiresAtString) => {
    const difference = +new Date(expiresAtString) - +new Date();
    if (difference > 0) {
      setTimeLeft(Math.floor(difference / 1000));
    } else {
      setTimeLeft(0);
    }
  };

  // Секундомер обратного отсчета по ТЗ (Страница 11)
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // По истечении времени перезагружаем статус брони, чтобы зафиксировать отмену
          fetchBookingDetails();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Форматирование секунд в формат ЧЧ:ММ:СС
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // Обработка загрузки файла
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Отправка чека на бэкенд
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Пожалуйста, прикрепите файл чека.");
      return;
    }

    setIsUploading(true);
    try {
      await api.uploadReceipt(id, file, comment);
      setUploadSuccess(true);
      setShowUploadForm(false);
      // Обновляем информацию, чтобы получить новый статус "Чек загружен"
      fetchBookingDetails();
    } catch (err) {
      alert(err.response?.data?.error || "Произошла ошибка при загрузке чека. Пожалуйста, попробуйте снова.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <span className="animate-spin text-3xl block mb-2">🔄</span>
          <span className="text-sm text-gray-500">Загрузка информации...</span>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto my-12 text-center p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
        <span className="text-4xl">⚠️</span>
        <h2 className="text-lg font-bold text-gray-900 mt-4">Упс, что-то пошло не так</h2>
        <p className="text-sm text-gray-500 mt-2">{error || "Бронирование не найдено."}</p>
        <Link to="/booking" className="mt-6 inline-block bg-natural-blue text-white px-4 py-2 rounded-lg text-sm font-semibold">
          На главную бронирования
        </Link>
      </div>
    );
  }

  // Определяем статус брони
  const isCancelled = booking.status === 'CANCELLED';
  const isPending = booking.status === 'PENDING';
  const isReceiptUploaded = booking.status === 'RECEIPT_UPLOADED';
  const isConfirmed = booking.status === 'CONFIRMED' || booking.status === 'PAYMENT_CONFIRMED';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* 1. Блок Главного статуса по ТЗ (Страница 11) */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm text-center">
        {isPending && timeLeft > 0 && (
          <>
            <span className="text-4xl">🎉</span>
            <h1 className="text-2xl font-extrabold text-gray-900 mt-3">Бронирование успешно создано!</h1>
            <p className="text-sm text-gray-500 mt-2">
              Номер вашей брони: <span className="font-mono font-bold text-gray-950 bg-gray-100 px-2 py-0.5 rounded">{booking.booking_number}</span>
            </p>
            
            {/* 2. Таймер обратного отсчета по ТЗ */}
            <div className="mt-6 max-w-sm mx-auto bg-amber-50 border border-amber-200 p-4 rounded-xl">
              <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">Осталось времени на оплату</span>
              <span className="text-3xl font-black text-amber-600 font-mono tracking-widest block mt-1">
                {formatTime(timeLeft)}
              </span>
              <p className="text-xxs text-amber-700 mt-2">
                Для подтверждения бронирования необходимо совершить платеж и прикрепить чек в течение 1 часа.
              </p>
            </div>
          </>
        )}

        {isReceiptUploaded && (
          <div className="py-4">
            <span className="text-4xl">📨</span>
            <h1 className="text-2xl font-extrabold text-emerald-600 mt-3">Чек отправлен на проверку</h1>
            <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
              Мы получили ваш документ. Администратор проверит транзакцию в ближайшее время. После подтверждения путевка будет выслана на ваш email: <span className="font-bold text-gray-900">{booking.contact_email}</span>.
            </p>
          </div>
        )}

        {isConfirmed && (
          <div className="py-4">
            <span className="text-4xl">✅</span>
            <h1 className="text-2xl font-extrabold text-emerald-600 mt-3">Бронирование подтверждено!</h1>
            <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
              Оплата успешно подтверждена администрацией. Путевка и правила заселения отправлены на вашу почту. Желаем отличного отдыха на озере Арахлей!
            </p>
          </div>
        )}

        {isCancelled && (
          <div className="py-4">
            <span className="text-4xl">⏰</span>
            <h1 className="text-2xl font-extrabold text-red-600 mt-3">Бронирование отменено</h1>
            <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
              Время, отведенное на оплату (1 час), истекло. Выбранные даты и домик №{booking.cabin_number || booking.cabin} снова свободны для общего бронирования.
            </p>
            <Link to="/booking" className="mt-4 inline-block text-xs font-bold text-natural-blue hover:underline">
              Попробовать забронировать заново →
            </Link>
          </div>
        )}
      </div>

      {/* 3. Детали заезда */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Детализация заезда</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <span className="text-gray-400 block text-xs uppercase font-semibold">Объект размещения</span>
            <span className="font-bold text-gray-900">Домик №{booking.cabin_number || booking.cabin}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs uppercase font-semibold">Сумма к оплате</span>
            <span className="font-extrabold text-natural-blue text-lg">{booking.total_price} руб.</span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs uppercase font-semibold">Даты заезда и выезда</span>
            <span className="font-semibold">{booking.start_date} — {booking.end_date}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs uppercase font-semibold">Получатель путевки</span>
            <span className="font-semibold">{booking.contact_name}</span>
          </div>
        </div>
      </div>

      {/* 4. Банковские реквизиты по ТЗ (Страница 11) */}
      {isPending && timeLeft > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900 pb-2 border-b border-gray-100">Реквизиты для оплаты</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Пожалуйста, переведите точную сумму <span className="font-bold text-gray-900">{booking.total_price} руб.</span> по указанным ниже реквизитам университета. В назначении платежа обязательно укажите слово <b>«Арахлей»</b>.
          </p>

          <div className="bg-gray-50 p-4 rounded-xl font-mono text-xs sm:text-sm text-gray-800 space-y-2.5">
            <div><span className="text-gray-400 select-none">Получатель:</span> ФГБОУ ВО "Университет"</div>
            <div><span className="text-gray-400 select-none">ИНН/КПП:</span> 7536000000 / 753601001</div>
            <div><span className="text-gray-400 select-none">Расчетный счет:</span> 03214643000000019100</div>
            <div><span className="text-gray-400 select-none">Банк получателя:</span> ОТДЕЛЕНИЕ ЧИТА БАНКА РОССИИ // УФК по Забайкальскому краю</div>
            <div><span className="text-gray-400 select-none">БИК:</span> 017601329</div>
            <div className="pt-2 border-t border-gray-200 font-sans">
              <span className="text-gray-400 select-none block text-xs uppercase font-semibold mb-0.5">Назначение платежа</span>
              <span className="font-bold text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded">Арахлей, бронь №{booking.booking_number}</span>
            </div>
          </div>

          {/* Кнопка активации формы "Я оплатил" по ТЗ (Страница 12) */}
          {!showUploadForm && (
            <button
              onClick={() => setShowUploadForm(true)}
              className="w-full py-3 bg-natural-blue text-white rounded-xl font-bold hover:bg-opacity-90 transition shadow-md"
            >
              🙋‍♂️ Я оплатил, прикрепить чек
            </button>
          )}

          {/* 5. Форма подтверждения оплаты (ТЗ Страница 12) */}
          {showUploadForm && (
            <form onSubmit={handleUploadSubmit} className="border-t border-gray-100 pt-6 space-y-4 animate-slide-down">
              <h4 className="font-bold text-gray-900 text-sm">Подтверждение факта оплаты</h4>
              
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Загрузить чек (PDF, PNG, JPG)</label>
                <input
                  type="file"
                  required
                  accept=".pdf, .png, .jpg, .jpeg"
                  onChange={handleFileChange}
                  className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-natural-blue hover:file:bg-blue-100 file:cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase">Комментарий к платежу (необязательно)</label>
                <textarea
                  rows="2"
                  placeholder="Например: Оплачено с карты Сбербанка на имя Иванова И.И."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-natural-blue"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-grow py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs transition flex items-center justify-center gap-1"
                >
                  {isUploading ? "Загрузка..." : "📤 Отправить подтверждение оплаты"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs transition"
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      )}

    </div>
  );
}