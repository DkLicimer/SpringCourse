import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { useBrand } from '../../context/BrandContext';
import { CheckCircle2, Clock, Upload, AlertCircle } from 'lucide-react';

export default function RecreationSuccess() {
  const { id } = useParams();
  const { brand } = useBrand();

  const [booking, setBooking] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get(`/api/recreation/bookings/${id}/`).then(res => setBooking(res.data));
  }, [id]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post(`/api/recreation/bookings/${id}/upload-receipt/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess(true);
      api.get(`/api/recreation/bookings/${id}/`).then(res => setBooking(res.data));
    } catch (err) {
      alert('Ошибка при загрузке чека: ' + JSON.stringify(err.response?.data || err.message));
    } finally {
      setUploading(false);
    }
  };

  if (!booking) return <div className="text-center py-12 text-sm text-gray-500">Загрузка информации...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      
      {/* Статус */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-xs text-center space-y-3">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h1 className="text-2xl font-black font-heading text-gray-900">Бронирование оформлено!</h1>
        <p className="text-xs text-gray-500">
          Номер брони: <span className="font-mono font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-800">{booking.booking_number}</span>
        </p>
        <div className="text-sm font-semibold text-gray-700">
          Сумма к оплате: <span className="text-brand-primary text-xl font-black">{booking.total_price} руб.</span>
        </div>
      </div>

      {/* Банковские реквизиты вуза (из BrandContext) */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-gray-900 uppercase">Реквизиты для оплаты ({brand.university_short_name})</h3>
        <div className="bg-gray-50 p-4 rounded-xl font-mono text-xs space-y-2 text-gray-700 border border-gray-100">
          <p><span className="text-gray-400">Получатель:</span> {brand.recipient_name}</p>
          <div className="grid grid-cols-2 gap-2">
            <p><span className="text-gray-400">ИНН:</span> {brand.inn}</p>
            <p><span className="text-gray-400">КПП:</span> {brand.kpp}</p>
          </div>
          <p><span className="text-gray-400">Банк:</span> {brand.bank_name}</p>
          <div className="grid grid-cols-2 gap-2">
            <p><span className="text-gray-400">БИК:</span> {brand.bik}</p>
            <p><span className="text-gray-400">Счет получателя:</span> {brand.recipient_account}</p>
          </div>
          <p className="pt-2 border-t border-gray-200 font-bold text-red-700">
            Назначение платежа: {brand.payment_purpose} (Бронь {booking.booking_number})
          </p>
        </div>
      </div>

      {/* Форма загрузки чека */}
      {booking.status === 'PENDING' && (
        <form onSubmit={handleUpload} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-gray-900 uppercase">Прикрепить чек об оплате</h3>
          <p className="text-xs text-gray-500">
            Оплатите указанную сумму через приложение банка и прикрепите сюда скриншот или PDF-квитанцию.
          </p>
          <input
            type="file"
            required
            accept="image/*,.pdf"
            onChange={e => setFile(e.target.files[0])}
            className="text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-50 file:text-brand-primary"
          />
          <button
            type="submit"
            disabled={uploading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition"
          >
            {uploading ? 'Отправка документа...' : 'Отправить чек на проверку'}
          </button>
        </form>
      )}

      {booking.status === 'RECEIPT_UPLOADED' && (
        <div className="p-4 bg-blue-50 text-blue-800 rounded-xl text-xs font-semibold text-center">
          Чек отправлен на проверку. Администратор подтвердит бронь, и путевка придет вам на Email.
        </div>
      )}

    </div>
  );
}