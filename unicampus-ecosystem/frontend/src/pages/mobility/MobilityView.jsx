import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  Plane, Plus, CheckCircle2, XCircle, Clock, 
  FileText, DollarSign, AlertCircle
} from 'lucide-react';

export default function MobilityView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('my_trips'); // 'my_trips' | 'approval_queue'
  const [trips, setTrips] = useState([]);
  const [pendingTrips, setPendingTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Форма заявки
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [tripForm, setTripForm] = useState({
    trip_type: 'Научная конференция',
    title: '',
    destination_city: '',
    host_organization: '',
    start_date: '',
    end_date: '',
    invitation_file_url: '',
    estimated_transport_cost: 0,
    estimated_living_cost: 0,
    estimated_daily_cost: 0,
    funded_by_university: true
  });
  const [uploadingInvite, setUploadingInvite] = useState(false);

  // Сдача отчета
  const [reportingTripId, setReportingTripId] = useState(null);
  const [reportSummary, setReportSummary] = useState('');
  const [certUrl, setCertUrl] = useState('');
  const [financeUrl, setFinanceUrl] = useState('');

  const canApprove = user && ['ADMIN', 'CURATOR', 'HEAD_CURATOR', 'STAFF'].includes(user.role);

  const loadData = () => {
    setLoading(true);
    if (user?.role === 'STUDENT') {
      api.get('/mobility/my-trips')
        .then(res => setTrips(res.data))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    if (canApprove) {
      api.get('/mobility/trips/pending')
        .then(res => setPendingTrips(res.data))
        .catch(err => console.error(err));
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleFileUpload = async (file, setTargetUrl) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setTargetUrl(res.data.url);
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!tripForm.invitation_file_url) {
      alert('Прикрепите скан вызова/приглашения');
      return;
    }
    try {
      await api.post('/mobility/trips', tripForm);
      setIsApplyModalOpen(false);
      alert('Заявка на поездку создана и передана куратору на согласование!');
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка создания поездки');
    }
  };

  const handleApproveStage = async (tripId, stage, approve) => {
    const comment = prompt(approve ? 'Комментарий (опц.):' : 'Причина отклонения:');
    if (!approve && !comment) return;

    try {
      await api.post(`/mobility/trips/${tripId}/approve-stage?stage=${stage}`, {
        approve,
        comment
      });
      alert(approve ? 'Этап завизирован!' : 'Поездка отклонена');
      loadData();
    } catch (err) {
      alert('Ошибка визирования');
    }
  };

  const handleSubmitReport = async (tripId) => {
    if (!certUrl || !reportSummary) {
      alert('Заполните итоги и прикрепите скан сертификата');
      return;
    }
    try {
      await api.post(`/mobility/trips/${tripId}/report`, {
        certificate_file_url: certUrl,
        financial_report_file_url: financeUrl || null,
        summary_text: reportSummary
      });
      setReportingTripId(null);
      alert('Отчет отправлен в отдел сопровождения!');
      loadData();
    } catch (err) {
      alert('Ошибка отправки отчета');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <Plane className="w-6 h-6 mr-2 text-blue-600" />
            Студенческая мобильность и командировки
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Согласование поездок на конференции, форумы и олимпиады со сметой расходов
          </p>
        </div>

        {user?.role === 'STUDENT' && (
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow cursor-pointer transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Подать заявку на поездку
          </button>
        )}
      </div>

      {/* Вкладки */}
      <div className="flex border-b border-slate-200 space-x-6 font-bold">
        {user?.role === 'STUDENT' && (
          <button
            onClick={() => setActiveTab('my_trips')}
            className={`pb-3 border-b-2 cursor-pointer transition ${
              activeTab === 'my_trips' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Мои поездки ({trips.length})
          </button>
        )}

        {canApprove && (
          <button
            onClick={() => setActiveTab('approval_queue')}
            className={`pb-3 border-b-2 cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'approval_queue' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Лист согласования ({pendingTrips.length})
            {pendingTrips.length > 0 && <span className="w-2 h-2 rounded-full bg-red-500" />}
          </button>
        )}
      </div>

      {/* МОИ ПОЕЗДКИ */}
      {activeTab === 'my_trips' && (
        <div className="space-y-4">
          {trips.map(trip => (
            <div key={trip.id} className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">
                    {trip.trip_type}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{trip.title}</h3>
                  <p className="text-slate-500">
                    {trip.destination_city} ({trip.host_organization}) | {trip.start_date} — {trip.end_date}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm text-slate-900">{trip.total_estimated_budget} ₽</span>
                  <span className="text-slate-400 block text-[10px]">Бюджет вуза</span>
                </div>
              </div>

              {/* Маршрут визирования (3 этапа) */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border text-center">
                {trip.approval_steps.map((st, i) => (
                  <div key={i} className="space-y-0.5">
                    <span className="font-bold text-slate-700 block">
                      {st.stage === 'CURATOR' ? '1. Куратор' : st.stage === 'DEAN' ? '2. Деканат' : '3. Бухгалтерия'}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md inline-block ${
                      st.is_approved === true ? 'bg-emerald-100 text-emerald-800' :
                      st.is_approved === false ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {st.is_approved === true ? 'Согласовано ✓' : st.is_approved === false ? 'Отклонено ✖' : 'Ожидает'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Кнопка сдачи отчета */}
              {trip.status === 'APPROVED' && (
                <div className="pt-2 border-t flex justify-end">
                  <button
                    onClick={() => setReportingTripId(trip.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer"
                  >
                    Прикрепить сертификат и авансовый отчет
                  </button>
                </div>
              )}
            </div>
          ))}
          {trips.length === 0 && (
            <div className="p-12 text-center bg-white rounded-3xl border text-slate-400">
              Вы еще не оформляли командировок.
            </div>
          )}
        </div>
      )}

      {/* ОЧЕРЕДЬ СОГЛАСОВАНИЯ ДЛЯ СОТРУДНИКОВ */}
      {activeTab === 'approval_queue' && (
        <div className="space-y-4">
          {pendingTrips.map(trip => {
            const currentStage = 
              trip.status === 'ON_REVIEW_CURATOR' ? 'CURATOR' :
              trip.status === 'ON_REVIEW_DEAN' ? 'DEAN' : 'ACCOUNTING';

            return (
              <div key={trip.id} className="bg-white p-6 rounded-3xl border shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{trip.title}</h3>
                    <p className="text-blue-600 font-semibold">{trip.student_name} ({trip.group_name})</p>
                    <p className="text-slate-500">{trip.destination_city} | {trip.start_date} — {trip.end_date}</p>
                  </div>
                  <a
                    href={trip.invitation_file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 font-bold rounded-xl flex items-center gap-1"
                  >
                    <FileText className="w-4 h-4" /> Вызов/Приглашение
                  </a>
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border">
                  <span>Смета: <b>{trip.total_estimated_budget} ₽</b> (Проезд + Проживание)</span>
                  <span className="font-bold text-amber-600">Текущий этап: {currentStage}</span>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t">
                  <button
                    onClick={() => handleApproveStage(trip.id, currentStage, true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer"
                  >
                    Согласовать этап
                  </button>
                  <button
                    onClick={() => handleApproveStage(trip.id, currentStage, false)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow cursor-pointer"
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Модальное окно подачи заявки */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <form
            onSubmit={handleCreateTrip}
            className="bg-white p-6 rounded-3xl max-w-lg w-full border shadow-2xl space-y-4 my-8"
          >
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Заявка на академическую поездку</h3>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
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
                placeholder="напр. Всероссийский форум «Инженеры будущего»"
                value={tripForm.title}
                onChange={e => setTripForm({ ...tripForm, title: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Город назначения</label>
                <input
                  type="text"
                  required
                  placeholder="Москва / Владивосток"
                  value={tripForm.destination_city}
                  onChange={e => setTripForm({ ...tripForm, destination_city: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Принимающая сторона</label>
                <input
                  type="text"
                  required
                  placeholder="МГУ / VK"
                  value={tripForm.host_organization}
                  onChange={e => setTripForm({ ...tripForm, host_organization: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Дата отъезда</label>
                <input
                  type="date"
                  required
                  value={tripForm.start_date}
                  onChange={e => setTripForm({ ...tripForm, start_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Дата возвращения</label>
                <input
                  type="date"
                  required
                  value={tripForm.end_date}
                  onChange={e => setTripForm({ ...tripForm, end_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border space-y-2">
              <span className="font-bold text-slate-800 block">Предварительная смета расходов (₽):</span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block">Проезд</label>
                  <input
                    type="number"
                    value={tripForm.estimated_transport_cost}
                    onChange={e => setTripForm({ ...tripForm, estimated_transport_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block">Проживание</label>
                  <input
                    type="number"
                    value={tripForm.estimated_living_cost}
                    onChange={e => setTripForm({ ...tripForm, estimated_living_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block">Суточные</label>
                  <input
                    type="number"
                    value={tripForm.estimated_daily_cost}
                    onChange={e => setTripForm({ ...tripForm, estimated_daily_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full px-2 py-1 border rounded bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Скан официального приглашения (PDF/Фото)</label>
              <input
                type="file"
                required
                accept="image/*,.pdf"
                onChange={e => {
                  setUploadingInvite(true);
                  handleFileUpload(e.target.files[0], url => setTripForm({ ...tripForm, invitation_file_url: url }))
                    .finally(() => setUploadingInvite(false));
                }}
                className="w-full text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-100 file:text-blue-800"
              />
              {uploadingInvite && <span className="text-blue-600 block mt-1">Загрузка файла...</span>}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={uploadingInvite || !tripForm.invitation_file_url}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow"
              >
                Подать на визирование
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}