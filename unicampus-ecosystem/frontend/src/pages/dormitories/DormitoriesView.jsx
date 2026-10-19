import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  Home, Bed, Users, CheckCircle2, Clock, 
  AlertCircle, Plus, FileText, Filter
} from 'lucide-react';

export default function DormitoriesView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('buildings'); // 'buildings' | 'my_apps' | 'review'
  
  const [buildings, setBuildings] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedDorm, setSelectedDorm] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Студенческое заявление
  const [myApplications, setMyApplications] = useState([]);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    application_type: 'CHECK_IN',
    preferred_dorm_id: '',
    priority_reason: '',
    comment: ''
  });

  // Очередь жилищного отдела
  const [pendingQueue, setPendingQueue] = useState([]);
  const [selectedAppToApprove, setSelectedAppToApprove] = useState(null);
  const [assignBedId, setAssignBedId] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  const isHousingStaff = user && ['ADMIN', 'STAFF'].includes(user.role);

  const loadData = () => {
    setLoading(true);
    api.get('/dormitories/buildings')
      .then(res => {
        setBuildings(res.data);
        if (res.data.length > 0 && !selectedDorm) {
          setSelectedDorm(res.data[0]);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));

    api.get('/dormitories/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error(err));

    if (user?.role === 'STUDENT') {
      api.get('/dormitories/my-applications')
        .then(res => setMyApplications(res.data))
        .catch(err => console.error(err));
    }

    if (isHousingStaff) {
      api.get('/dormitories/applications/pending')
        .then(res => setPendingQueue(res.data))
        .catch(err => console.error(err));
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  useEffect(() => {
    if (selectedDorm) {
      api.get(`/dormitories/buildings/${selectedDorm.id}/rooms`)
        .then(res => setRooms(res.data))
        .catch(err => console.error(err));
    }
  }, [selectedDorm]);

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/dormitories/applications', {
        ...applyForm,
        preferred_dorm_id: applyForm.preferred_dorm_id ? parseInt(applyForm.preferred_dorm_id) : null
      });
      setIsApplyModalOpen(false);
      setApplyForm({ application_type: 'CHECK_IN', preferred_dorm_id: '', priority_reason: '', comment: '' });
      alert('Заявление на заселение зарегистрировано!');
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка отправки заявления');
    }
  };

  const handleReview = async (appId, approve) => {
    try {
      await api.post(`/dormitories/applications/${appId}/review`, {
        approve,
        assigned_bed_id: approve ? parseInt(assignBedId) : null,
        rejection_reason: approve ? null : rejectReason
      });
      setSelectedAppToApprove(null);
      setAssignBedId('');
      setRejectReason('');
      alert(approve ? 'Ордер выписан, койка закреплена за студентом!' : 'Заявление отклонено');
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка обработки заявления');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      {/* Шапка */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <Home className="w-6 h-6 mr-2 text-blue-600" />
            Студенческий жилой фонд и Общежития
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Учет коечного фонда, электронные заявления на заселение и выдача ордеров
          </p>
        </div>

        {user?.role === 'STUDENT' && (
          <button
            onClick={() => setIsApplyModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow cursor-pointer transition flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Подать заявление на жилье
          </button>
        )}
      </div>

      {/* KPI карточки */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border shadow-2xs space-y-1">
            <span className="text-slate-400 font-bold">Корпусов общежитий</span>
            <div className="text-2xl font-black text-slate-900">{stats.total_dormitories}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border shadow-2xs space-y-1">
            <span className="text-slate-400 font-bold">Всего койко-мест</span>
            <div className="text-2xl font-black text-slate-900">{stats.total_beds}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border shadow-2xs space-y-1">
            <span className="text-slate-400 font-bold">Свободных мест</span>
            <div className="text-2xl font-black text-emerald-600">{stats.free_beds}</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border shadow-2xs space-y-1">
            <span className="text-slate-400 font-bold">Загрузка фонда</span>
            <div className="text-2xl font-black text-blue-600">{stats.occupancy_rate_percent}%</div>
          </div>
        </div>
      )}

      {/* Вкладки */}
      <div className="flex border-b border-slate-200 space-x-6 font-bold">
        <button
          onClick={() => setActiveTab('buildings')}
          className={`pb-3 border-b-2 cursor-pointer transition ${
            activeTab === 'buildings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Корпуса и Комнаты
        </button>

        {user?.role === 'STUDENT' && (
          <button
            onClick={() => setActiveTab('my_apps')}
            className={`pb-3 border-b-2 cursor-pointer transition ${
              activeTab === 'my_apps' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Мои заявления ({myApplications.length})
          </button>
        )}

        {isHousingStaff && (
          <button
            onClick={() => setActiveTab('review')}
            className={`pb-3 border-b-2 cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'review' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Очередь заселения ({pendingQueue.length})
          </button>
        )}
      </div>

      {/* 1. КОРПУСА И КОМНАТЫ */}
      {activeTab === 'buildings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Список корпусов */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-700">Корпуса общежитий</h3>
            {buildings.map(dorm => (
              <div
                key={dorm.id}
                onClick={() => setSelectedDorm(dorm)}
                className={`p-4 rounded-2xl border cursor-pointer transition space-y-1 ${
                  selectedDorm?.id === dorm.id
                    ? 'border-blue-600 bg-blue-50/50 shadow-2xs ring-1 ring-blue-500'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-sm text-slate-900">{dorm.name}</span>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {dorm.free_beds} мест своб.
                  </span>
                </div>
                <p className="text-slate-500 text-[11px]">{dorm.address}</p>
                {dorm.commandant_name && (
                  <p className="text-slate-400 text-[10px]">Комендант: {dorm.commandant_name}</p>
                )}
              </div>
            ))}
          </div>

          {/* Комнаты выбранного корпуса */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {selectedDorm ? selectedDorm.name : 'Выберите корпус'}
                </h3>
                <span className="text-slate-400 text-[11px]">Поэтажный план и статус коек</span>
              </div>
              <span className="text-slate-500 font-bold">Комнат: {rooms.length}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
              {rooms.map(room => (
                <div key={room.id} className="p-3 bg-slate-50 border rounded-2xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900">Комн. {room.room_number}</span>
                    <span className="text-[10px] text-slate-400">{room.floor} этаж</span>
                  </div>

                  <div className="flex gap-1.5">
                    {room.beds.map(bed => (
                      <div
                        key={bed.id}
                        className={`flex-1 py-1 rounded text-center text-[10px] font-black ${
                          bed.is_occupied
                            ? 'bg-slate-300 text-slate-600'
                            : 'bg-emerald-500 text-white shadow-2xs'
                        }`}
                        title={bed.is_occupied ? 'Место занято' : `Койка #${bed.bed_number} свободна (ID: ${bed.id})`}
                      >
                        #{bed.bed_number}
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t">
                    <span>{room.price_per_month} ₽/мес</span>
                    <span className="font-bold text-blue-600">{room.gender_policy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. МОИ ЗАЯВЛЕНИЯ (СТУДЕНТ) */}
      {activeTab === 'my_apps' && (
        <div className="space-y-3">
          {myApplications.map(app => (
            <div key={app.id} className="bg-white p-5 rounded-2xl border shadow-2xs flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">
                    {app.application_type === 'CHECK_IN' ? 'Заявление на заселение' : 'Заявление на переселение'}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    app.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                    app.status === 'PENDING' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {app.status === 'APPROVED' ? 'Ордер выписан ✓' : app.status === 'PENDING' ? 'На рассмотрении' : 'Отклонено'}
                  </span>
                </div>
                {app.priority_reason && (
                  <p className="text-slate-500 mt-1">Основание льготы: {app.priority_reason}</p>
                )}
                {app.rejection_reason && (
                  <p className="text-red-600 font-bold mt-1">Причина отказа: {app.rejection_reason}</p>
                )}
              </div>
              <span className="text-slate-400 font-mono">
                {new Date(app.created_at).toLocaleDateString('ru-RU')}
              </span>
            </div>
          ))}
          {myApplications.length === 0 && (
            <div className="p-12 text-center bg-white rounded-3xl border text-slate-400">
              У вас нет активных заявлений на общежитие.
            </div>
          )}
        </div>
      )}

      {/* 3. ОЧЕРЕДЬ ЗАСЕЛЕНИЯ (ЖИЛИЩНЫЙ ОТДЕЛ) */}
      {activeTab === 'review' && (
        <div className="space-y-4">
          {pendingQueue.map(app => (
            <div key={app.id} className="bg-white p-6 rounded-3xl border shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {app.student_name} ({app.group_name})
                  </h4>
                  <p className="text-blue-600 font-semibold">{app.application_type}</p>
                </div>
                <span className="text-slate-400">{new Date(app.created_at).toLocaleDateString('ru-RU')}</span>
              </div>

              {app.priority_reason && (
                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900 font-bold">
                  Льгота / Приоритет: {app.priority_reason}
                </div>
              )}

              {selectedAppToApprove === app.id ? (
                <div className="p-3 bg-slate-50 border rounded-2xl space-y-2">
                  <label className="block font-bold text-slate-700">Назначить ID койко-места (из плана):</label>
                  <input
                    type="number"
                    placeholder="Введите ID свободной койки..."
                    value={assignBedId}
                    onChange={e => setAssignBedId(e.target.value)}
                    className="w-full px-3 py-1.5 border rounded-xl bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview(app.id, true)}
                      disabled={!assignBedId}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer"
                    >
                      Подтвердить и выписать ордер
                    </button>
                    <button
                      onClick={() => setSelectedAppToApprove(null)}
                      className="px-4 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-xl"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedAppToApprove(app.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer"
                  >
                    Заселить (Выбрать койку)
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt('Причина отказа:');
                      if (reason) {
                        setRejectReason(reason);
                        handleReview(app.id, false);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow cursor-pointer"
                  >
                    Отклонить
                  </button>
                </div>
              )}
            </div>
          ))}
          {pendingQueue.length === 0 && (
            <div className="p-12 text-center bg-white rounded-3xl border text-slate-400">
              В очереди нет заявлений на рассмотрение.
            </div>
          )}
        </div>
      )}

      {/* Модальное окно подачи заявления студентом */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <form
            onSubmit={handleApplySubmit}
            className="bg-white p-6 rounded-3xl max-w-md w-full border shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Заявление на общежитие</h3>
              <button
                type="button"
                onClick={() => setIsApplyModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Тип заявления</label>
              <select
                value={applyForm.application_type}
                onChange={e => setApplyForm({ ...applyForm, application_type: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-white"
              >
                <option value="CHECK_IN">Первичное заселение</option>
                <option value="RELOCATION">Переселение в другую комнату</option>
                <option value="CHECK_OUT">Освобождение места / выселение</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Желаемый корпус общежития</label>
              <select
                value={applyForm.preferred_dorm_id}
                onChange={e => setApplyForm({ ...applyForm, preferred_dorm_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-white"
              >
                <option value="">Не имеет значения</option>
                {buildings.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.address})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Основания льготы (если есть)</label>
              <input
                type="text"
                placeholder="Сирота / Инвалид / Высокий балл рейтинга / Иногородний"
                value={applyForm.priority_reason}
                onChange={e => setApplyForm({ ...applyForm, priority_reason: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
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
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow"
              >
                Подать в жилищный отдел
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}