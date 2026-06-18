import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';

export default function SuccessPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [rulesAgreed, setRulesAgreed] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [file, setFile] = useState(null);
  const [comment, setComment] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    fetchBookingDetails();
  }, [id]);

  const fetchBookingDetails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings/${id}/`);
      if (!response.ok) throw new Error("Бронирование не найдено.");
      const data = await response.json();
      setBooking(data);
      calculateTimeLeft(data.expires_at);
    } catch (err) {
      setError(err.message || "Ошибка загрузки деталей бронирования.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTimeLeft = (expiresAtString) => {
    const difference = +new Date(expiresAtString) - +new Date();
    if (difference > 0) {
      setTimeLeft(Math.floor(difference / 1000));
    } else {
      setTimeLeft(0);
    }
  };

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          fetchBookingDetails();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Пожалуйста, прикрепите файл чека.");
      return;
    }
    if (!rulesAgreed) {
      alert("Необходимо подтвердить ознакомление с правилами выезда.");
      return;
    }
    setIsUploading(true);
    try {
      await api.uploadReceipt(id, file, comment);
      setUploadSuccess(true);
      setShowUploadForm(false);
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

  const isCancelled = booking.status === 'CANCELLED';
  const isPending = booking.status === 'PENDING';
  const isReceiptUploaded = booking.status === 'RECEIPT_UPLOADED';
  const isConfirmed = booking.status === 'CONFIRMED' || booking.status === 'PAYMENT_CONFIRMED';
  const isRejected = booking.status === 'REJECTED';

  const cabinNumbers = `№${booking.cabin_number}` + (booking.second_cabin_number ? ` и №${booking.second_cabin_number}` : '');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Блок главного статуса */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm text-center">
        {isPending && (
          <>
            <span className="text-4xl">🎉</span>
            <h1 className="text-2xl font-extrabold text-gray-900 mt-3">Бронирование успешно создано!</h1>
            <p className="text-sm text-gray-500 mt-2">
              Номер брони: <span className="font-mono font-bold text-gray-950 bg-gray-100 px-2 py-0.5 rounded">{booking.booking_number}</span>
            </p>

            {/* УВЕДОМЛЕНИЕ О СПАМЕ */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 max-w-lg mx-auto">
              <b>📧 Письмо отправлено:</b> Инструкция с реквизитами уже на вашей почте <b>{booking.contact_email}</b>. 
              Если письма нет во «Входящих» — обязательно проверьте папку <b>«СПАМ»</b>.
            </div>
            
            {timeLeft > 0 ? (
              <div className="mt-6 max-w-sm mx-auto bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">Осталось времени на оплату</span>
                <span className="text-3xl font-black text-amber-600 font-mono tracking-widest block mt-1">
                  {formatTime(timeLeft)}
                </span>
                <p className="text-[11px] text-amber-700 mt-2 leading-relaxed">
                  Для сохранения вашего бронирования оплатите его и прикрепите снимок или PDF чека в течение 1 часа.
                </p>
              </div>
            ) : (
              <div className="mt-6 max-w-sm mx-auto bg-amber-50 border border-amber-200 p-4 rounded-xl">
                <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider block">Оплата бронирования</span>
                <p className="text-xs text-amber-700 mt-2">
                  Пожалуйста, оплатите бронь и загрузите чек как можно быстрее, чтобы избежать автоматического аннулирования.
                </p>
              </div>
            )}
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
              Оплата успешно подтверждена администрацией ЗабГУ. Путевка и правила заселения отправлены на вашу почту. Желаем отличного отдыха на озере Арахлей!
            </p>
          </div>
        )}

        {(isCancelled || isRejected) && (
          <div className="py-4">
            <span className="text-4xl">⏰</span>
            <h1 className="text-2xl font-extrabold text-red-600 mt-3">
              {isCancelled ? "Бронирование отменено" : "Оплата отклонена"}
            </h1>
            <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
              {isCancelled 
                ? "Время, отведенное на оплату (1 час), истекло. Выбранные даты и домики снова свободны." 
                : "К сожалению, ваш платеж не был подтвержден. Пожалуйста, проверьте данные или свяжитесь с администрацией."}
            </p>
            <Link to="/booking" className="mt-4 inline-block text-xs font-bold text-natural-blue hover:underline">
              Попробовать забронировать заново →
            </Link>
          </div>
        )}
      </div>

      {/* Детализация заезда */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Детализация заезда</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <span className="text-gray-400 block text-xs uppercase font-semibold">Объект размещения</span>
            <span className="font-bold text-gray-900">Гостевой дом(а) {cabinNumbers}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs uppercase font-semibold">Сумма к оплате</span>
            <span className="font-extrabold text-natural-blue text-lg">{booking.total_price} руб.</span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs uppercase font-semibold">Даты проживания</span>
            <span className="font-semibold">{booking.start_date} — {booking.end_date}</span>
          </div>
          <div>
            <span className="text-gray-400 block text-xs uppercase font-semibold">Получатель путевки</span>
            <span className="font-semibold">{booking.contact_name}</span>
          </div>
        </div>
      </div>

      {/* Реквизиты и Инструкция (ТОЛЬКО ЕСЛИ ОЖИДАЕТ ОПЛАТЫ) */}
      {isPending && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          
          <div className="space-y-4">
            <h3 className="text-base font-bold text-gray-900 pb-2 border-b border-gray-100">Реквизиты ФГБОУ ВО «Забайкальский государственный университет»</h3>
            
            <div className="bg-gray-50 p-5 rounded-xl font-mono text-xs sm:text-sm text-gray-800 space-y-2 leading-relaxed border border-gray-200/50">
              <div><span className="text-gray-400 select-none font-sans block text-[10px] uppercase font-semibold">Получатель платежа</span>УФК по Приморскому краю (ФГБОУ ВО «ЗабГУ» л/с 20916X16810)</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <div><span className="text-gray-400 select-none font-sans block text-[10px] uppercase font-semibold">ИНН</span>7534000257</div>
                <div><span className="text-gray-400 select-none font-sans block text-[10px] uppercase font-semibold">КПП</span>753601001</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <div><span className="text-gray-400 select-none font-sans block text-[10px] uppercase font-semibold">ОКТМО</span>76701000</div>
                <div><span className="text-gray-400 select-none font-sans block text-[10px] uppercase font-semibold">УИН</span>не заполнять, пропустить</div>
              </div>
              <div className="pt-2">
                <span className="text-gray-400 select-none font-sans block text-[10px] uppercase font-semibold">Банк получателя</span>
                ОКЦ № 1 ДГУ Банка России//УФК по Приморскому краю, г Владивосток
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <div><span className="text-gray-400 select-none font-sans block text-[10px] uppercase font-semibold">БИК</span>010507002</div>
                <div><span className="text-gray-400 select-none font-sans block text-[10px] uppercase font-semibold">Счет банка (ЕКС)</span>40102810545370000012</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                <div><span className="text-gray-400 select-none font-sans block text-[10px] uppercase font-semibold">Счет получателя</span>03214643000000012009</div>
                <div><span className="text-gray-400 select-none font-sans block text-[10px] uppercase font-semibold">КБК</span>00000000000000000130</div>
              </div>
              <div className="pt-3 border-t border-gray-200 font-sans">
                <span className="text-red-700 block text-xs uppercase font-extrabold mb-1">Назначение платежа</span>
                <span className="font-bold text-red-700 bg-red-50 border border-red-100 px-3 py-1 rounded inline-block">
                  Арахлей, бронь №{booking.booking_number}
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 bg-blue-50/50 rounded-xl border border-blue-100">
            <h3 className="text-base font-bold text-natural-blue pb-2 border-b border-blue-100/50 mb-3 uppercase text-xs tracking-wider">
              📱 Инструкция по оплате через приложение банка:
            </h3>
            <ol className="list-decimal pl-5 text-xs text-gray-700 space-y-2">
              <li>В приложении банка выберите <b>«Оплата по реквизитам»</b>.</li>
              <li>Укажите ИНН университета: <span className="font-bold text-gray-900 font-mono bg-white px-1.5 py-0.5 border border-gray-200 rounded">7534000257</span>.</li>
              <li>Выберите тип платежа <b>«Оплата общежития»</b> (единый счет университета).</li>
              <li>В поле <b>«Назначение платежа»</b> ОБЯЗАТЕЛЬНО напишите: <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 border border-emerald-200 rounded">Арахлей, бронь №{booking.booking_number}</span>.</li>
            </ol>
          </div>

          <div className="p-5 bg-red-50 rounded-xl border border-red-100 space-y-3">
            <h4 className="font-bold text-red-800 text-sm">⚠️ Важные правила:</h4>
            <ul className="list-disc pl-5 text-xs text-red-700 space-y-1">
              <li>Освобождение домика — строго до <b>12:00</b>.</li>
              <li>Документы при заселении: оригинал паспорта (взрослым) и св-во о рождении (детям).</li>
            </ul>
            
            <div className="flex items-start gap-2.5 pt-3 border-t border-red-200/50">
              <input
                id="rules-agree"
                type="checkbox"
                required
                checked={rulesAgreed}
                onChange={(e) => setRulesAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-red-600 border-red-300 rounded focus:ring-red-500 cursor-pointer"
              />
              <label htmlFor="rules-agree" className="text-xs text-red-800 font-semibold leading-tight cursor-pointer select-none">
                Я подтверждаю, что ознакомлен с правилами пребывания и временем выезда до 12:00.
              </label>
            </div>
          </div>

          {!showUploadForm ? (
            <button
              onClick={() => {
                if (!rulesAgreed) {
                  alert("Пожалуйста, сначала ознакомьтесь с правилами и отметьте галочку согласия.");
                  return;
                }
                setShowUploadForm(true);
              }}
              className={`w-full py-3.5 rounded-xl font-bold transition duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                rulesAgreed ? 'bg-natural-blue text-white shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              🙋‍♂️ Я оплатил, прикрепить чек
            </button>
          ) : (
            <form onSubmit={handleUploadSubmit} className="border-t border-gray-100 pt-6 space-y-4">
              <h4 className="font-bold text-gray-900 text-sm">Подтверждение платежа</h4>
              <input
                type="file"
                required
                accept=".pdf, .png, .jpg, .jpeg"
                onChange={handleFileChange}
                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-natural-blue"
              />
              <textarea
                rows="2"
                placeholder="Комментарий к платежу"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={isUploading} className="flex-grow py-2.5 bg-emerald-500 text-white font-bold rounded-lg text-xs">
                  {isUploading ? "Загрузка..." : "📤 Отправить квитанцию"}
                </button>
                <button type="button" onClick={() => setShowUploadForm(false)} className="px-4 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-lg text-xs">
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