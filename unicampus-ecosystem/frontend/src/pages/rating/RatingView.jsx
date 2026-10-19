import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  Award, Upload, Download, CheckCircle2, XCircle, 
  Clock, Filter, Plus, FileText, AlertCircle
} from 'lucide-react';

export default function RatingView() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' | 'my_achievements' | 'moderation'
  
  // Лидерборд
  const [leaderboard, setLeaderboard] = useState([]);
  const [semester, setSemester] = useState('2026-1');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);

  // Мои достижения
  const [myAchievements, setMyAchievements] = useState([]);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [newAchievement, setNewAchievement] = useState({
    title: '',
    description: '',
    category: 'Научно-исследовательская',
    level: 'Вузовский',
    event_date: new Date().toISOString().substring(0, 10),
    proof_file_url: '',
    semester: '2026-1'
  });
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Очередь модерации
  const [pendingQueue, setPendingQueue] = useState([]);
  const [reviewComment, setReviewComment] = useState({});

  const isModerator = user && ['ADMIN', 'MODERATOR_RATING', 'HEAD_CURATOR'].includes(user.role);

  const loadLeaderboard = () => {
    setLoading(true);
    let url = `/rating/leaderboard?semester=${semester}`;
    if (selectedCourse) url += `&course=${selectedCourse}`;

    api.get(url)
      .then(res => setLeaderboard(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const loadMyAchievements = () => {
    api.get('/rating/my-achievements')
      .then(res => setMyAchievements(res.data))
      .catch(err => console.error(err));
  };

  const loadPendingQueue = () => {
    if (!isModerator) return;
    api.get('/rating/achievements/pending')
      .then(res => setPendingQueue(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadLeaderboard();
    if (user?.role === 'STUDENT') loadMyAchievements();
    if (isModerator) loadPendingQueue();
  }, [semester, selectedCourse, activeTab]);

  // Загрузка файла документа
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setNewAchievement(prev => ({ ...prev, proof_file_url: res.data.url }));
    } catch (err) {
      alert('Ошибка загрузки скана грамоты');
    } finally {
      setUploadingDoc(false);
    }
  };

  // Подача достижения студентом
  const handleSubmitAchievement = async (e) => {
    e.preventDefault();
    if (!newAchievement.proof_file_url) {
      alert('Пожалуйста, прикрепите скан диплома или грамоты');
      return;
    }

    try {
      await api.post('/rating/achievements', newAchievement);
      setIsSubmitModalOpen(false);
      setNewAchievement({
        title: '', description: '', category: 'Научно-исследовательская',
        level: 'Вузовский', event_date: new Date().toISOString().substring(0, 10),
        proof_file_url: '', semester: '2026-1'
      });
      loadMyAchievements();
      alert('Достижение отправлено на рассмотрение стипендиальной комиссии!');
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка отправки заявки');
    }
  };

  // Верификация достижения модератором
  const handleReview = async (achievementId, approve) => {
    const comment = reviewComment[achievementId] || '';
    if (!approve && !comment) {
      alert('Укажите причину отклонения достижения в комментарии');
      return;
    }

    try {
      await api.post(`/rating/achievements/${achievementId}/review`, {
        approve,
        comment: comment || null
      });
      loadPendingQueue();
      loadLeaderboard();
    } catch (err) {
      alert('Ошибка при проверке достижения');
    }
  };

  // Экспорт ведомости CSV
  const handleExportCsv = () => {
    window.open(`/api/rating/export-csv?semester=${semester}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Шапка */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <Award className="w-6 h-6 mr-2 text-amber-500" />
            Балльно-рейтинговая система и ПГАС
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Портфолио достижений студентов и прозрачное ранжирование на повышенную государственную академическую стипендию
          </p>
        </div>

        <div className="flex items-center gap-2">
          {user?.role === 'STUDENT' && (
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Подать грамоту / достижение
            </button>
          )}

          {isModerator && (
            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Ведомость CSV
            </button>
          )}
        </div>
      </div>

      {/* Переключатель вкладок */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 border-b-2 cursor-pointer transition ${
            activeTab === 'leaderboard' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Рейтинговый список (Лидерборд)
        </button>

        {user?.role === 'STUDENT' && (
          <button
            onClick={() => setActiveTab('my_achievements')}
            className={`pb-3 border-b-2 cursor-pointer transition ${
              activeTab === 'my_achievements' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Мое портфолио ({myAchievements.length})
          </button>
        )}

        {isModerator && (
          <button
            onClick={() => setActiveTab('moderation')}
            className={`pb-3 border-b-2 cursor-pointer transition flex items-center gap-1.5 ${
              activeTab === 'moderation' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Очередь модерации ({pendingQueue.length})
            {pendingQueue.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
        )}
      </div>

      {/* 1. ТУРНИРНАЯ ТАБЛИЦА */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
          {/* Фильтры семестра и курса */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-600">Семестр:</span>
            <select
              value={semester}
              onChange={e => setSemester(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
            >
              <option value="2026-1">2025/2026 уч. год (1 семестр)</option>
              <option value="2026-2">2025/2026 уч. год (2 семестр)</option>
            </select>

            <span className="font-bold text-slate-600 ml-2">Курс:</span>
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
            >
              <option value="">Все курсы</option>
              {[1, 2, 3, 4, 5, 6].map(c => (
                <option key={c} value={c}>{c} курс</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b text-slate-400 font-bold">
                  <th className="py-2.5 text-center w-12">Место</th>
                  <th className="py-2.5">Студент</th>
                  <th className="py-2.5">Группа / Институт</th>
                  <th className="py-2.5 text-center">Учеба</th>
                  <th className="py-2.5 text-center">Наука</th>
                  <th className="py-2.5 text-center">Общественная</th>
                  <th className="py-2.5 text-center">Творчество</th>
                  <th className="py-2.5 text-center">Спорт</th>
                  <th className="py-2.5 text-right font-black">Итого баллов</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map(item => (
                  <tr key={item.student_id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 text-center font-black">
                      {item.place <= 3 ? (
                        <span className={`px-2 py-0.5 rounded-full text-white text-[10px] ${
                          item.place === 1 ? 'bg-amber-500' : item.place === 2 ? 'bg-slate-400' : 'bg-amber-700'
                        }`}>
                          #{item.place}
                        </span>
                      ) : (
                        `#${item.place}`
                      )}
                    </td>
                    <td className="py-3 font-bold text-slate-900">{item.full_name}</td>
                    <td className="py-3 text-slate-500">{item.group_name} ({item.course} курс)</td>
                    <td className="py-3 text-center text-slate-600">{item.study_points}</td>
                    <td className="py-3 text-center text-slate-600 font-bold text-blue-600">{item.science_points}</td>
                    <td className="py-3 text-center text-slate-600">{item.public_points}</td>
                    <td className="py-3 text-center text-slate-600">{item.culture_points}</td>
                    <td className="py-3 text-center text-slate-600">{item.sport_points}</td>
                    <td className="py-3 text-right font-black text-amber-600 text-sm">
                      {item.total_points} б.
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. МОИ ДОСТИЖЕНИЯ (СТУДЕНТ) */}
      {activeTab === 'my_achievements' && (
        <div className="space-y-4 text-xs">
          {myAchievements.map(a => (
            <div key={a.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900">{a.title}</h3>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    a.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                    a.status === 'PENDING' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {a.status === 'APPROVED' ? `Одобрено (+${a.points_awarded} б.)` : a.status === 'PENDING' ? 'На проверке комиссией' : 'Отклонено'}
                  </span>
                </div>
                <p className="text-slate-500">{a.description}</p>
                <div className="text-[11px] text-slate-400">
                  Категория: <b>{a.category}</b> | Уровень: <b>{a.level}</b> | Дата: {a.event_date}
                </div>
                {a.reviewer_comment && (
                  <p className="text-red-600 font-semibold">Комментарий комиссии: {a.reviewer_comment}</p>
                )}
              </div>

              <a
                href={a.proof_file_url}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition shrink-0"
              >
                <FileText className="w-3.5 h-3.5" /> Скан документа
              </a>
            </div>
          ))}
          {myAchievements.length === 0 && (
            <div className="p-12 text-center bg-white rounded-3xl border text-slate-400">
              Вы еще не загрузили подтверждения своих достижений.
            </div>
          )}
        </div>
      )}

      {/* 3. МОДЕРАЦИЯ (КОМИССИЯ) */}
      {activeTab === 'moderation' && (
        <div className="space-y-4 text-xs">
          {pendingQueue.map(item => (
            <div key={item.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                  <p className="text-xs text-blue-600 font-semibold">
                    Студент: {item.student_name} ({item.group_name})
                  </p>
                </div>
                <a
                  href={item.proof_file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl flex items-center gap-1.5 transition"
                >
                  <FileText className="w-4 h-4" /> Просмотреть грамоту/приказ
                </a>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600">
                <div><span className="text-slate-400 block font-bold">Направление:</span> {item.category}</div>
                <div><span className="text-slate-400 block font-bold">Уровень:</span> {item.level}</div>
                <div><span className="text-slate-400 block font-bold">Дата события:</span> {item.event_date}</div>
                <div><span className="text-slate-400 block font-bold">Семестр:</span> {item.semester}</div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t">
                <input
                  type="text"
                  placeholder="Замечание (обязательно при отклонении)..."
                  value={reviewComment[item.id] || ''}
                  onChange={e => setReviewComment({ ...reviewComment, [item.id]: e.target.value })}
                  className="flex-grow px-3 py-1.5 border rounded-xl"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReview(item.id, true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer transition"
                  >
                    Подтвердить и начислить баллы
                  </button>
                  <button
                    onClick={() => handleReview(item.id, false)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow cursor-pointer transition"
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            </div>
          ))}
          {pendingQueue.length === 0 && (
            <div className="p-12 text-center bg-white rounded-3xl border text-slate-400">
              В очереди нет заявок, ожидающих верификации.
            </div>
          )}
        </div>
      )}

      {/* Модальное окно подачи грамоты */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSubmitAchievement}
            className="bg-white p-6 rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Подача достижения в портфолио</h3>
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Название достижения / мероприятия</label>
              <input
                type="text"
                required
                value={newAchievement.title}
                onChange={e => setNewAchievement({ ...newAchievement, title: e.target.value })}
                placeholder="напр. 1 место на Всероссийской олимпиаде по программированию"
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Направление</label>
                <select
                  value={newAchievement.category}
                  onChange={e => setNewAchievement({ ...newAchievement, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                >
                  <option value="Учебная">Учебная</option>
                  <option value="Научно-исследовательская">Научно-исследовательская</option>
                  <option value="Общественная">Общественная</option>
                  <option value="Культурно-творческая">Культурно-творческая</option>
                  <option value="Спортивная">Спортивная</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Уровень</label>
                <select
                  value={newAchievement.level}
                  onChange={e => setNewAchievement({ ...newAchievement, level: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-white"
                >
                  <option value="Вузовский">Вузовский (10 б.)</option>
                  <option value="Региональный">Региональный (25 б.)</option>
                  <option value="Всероссийский">Всероссийский (50 б.)</option>
                  <option value="Международный">Международный (100 б.)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Дата события</label>
                <input
                  type="date"
                  required
                  value={newAchievement.event_date}
                  onChange={e => setNewAchievement({ ...newAchievement, event_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Семестр</label>
                <input
                  type="text"
                  value={newAchievement.semester}
                  onChange={e => setNewAchievement({ ...newAchievement, semester: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-slate-50"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Скан диплома / грамоты / приказа (PDF/Фото)</label>
              <input
                type="file"
                required
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="w-full text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800"
              />
              {uploadingDoc && <span className="text-amber-600 font-bold block mt-1">Загрузка файла...</span>}
              {newAchievement.proof_file_url && (
                <span className="text-emerald-600 font-bold block mt-1">✓ Документ успешно прикреплен!</span>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsSubmitModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={uploadingDoc || !newAchievement.proof_file_url}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-white font-bold rounded-xl shadow"
              >
                Отправить в комиссию
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}