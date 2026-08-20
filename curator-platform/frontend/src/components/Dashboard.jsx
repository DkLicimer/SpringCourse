import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Users, Award, Calendar, CheckSquare, LogOut, RefreshCw, 
  Search, UserPlus, PlusCircle, Check, X, Shield, BookOpen, Clock, Tag, Briefcase, AlertTriangle, ShieldAlert, ArrowUpCircle, ArrowDownCircle, FileText, HelpCircle, Save, Bell
} from 'lucide-react';

function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, students, tasks, rating, surveys, admin
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupDetails, setGroupDetails] = useState(null);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Справочники, анкеты и уведомления
  const [socialCategories, setSocialCategories] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [activeSurveys, setActiveSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null); 
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false); // Открытие выпадающего списка уведомлений

  // Состояния для задач, календаря и рейтинга
  const [myTasks, setMyTasks] = useState([]);
  const [allExecutions, setAllExecutions] = useState([]); 
  const [calendar, setCalendar] = useState([]);
  const [ratingList, setRatingList] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Формы ввода
  const [newStudent, setNewStudent] = useState({ 
    first_name: '', last_name: '', middle_name: '', is_union_member: false,
    social_category_ids: [], organization_ids: []
  });
  const [newGroup, setNewGroup] = useState({ name: '', faculty: '', training_direction: '', course: 1 });
  const [newAssignment, setNewAssignment] = useState({ user_id: '', role_code: 'CURATOR', protocol_number: '', protocol_date: '' });
  const [newTask, setNewTask] = useState({ title: '', description: '', category: 'mandatory', type: 'photo_proof', due_date: '', points: 10, requirements: '', confirmation_requirements: '' });
  
  // Формы справочников и санкций
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [pointsAdjustment, setPointsAdjustment] = useState({ curator_id: '', points: 0, reason: '' });
  const [disciplinaryMark, setDisciplinaryMark] = useState({ curator_id: '', reason: '' });

  // Форма КОНСТРУКТОРА АНКЕТ
  const [newSurveyForm, setNewSurveyForm] = useState({ title: '', description: '', is_mandatory: false, expires_at: '' });
  const [surveyQuestions, setSurveyQuestions] = useState([]); 
  const [tempQuestion, setTempQuestion] = useState({ text: '', type: 'text', options: '' });

  // Ответы на анкету
  const [surveyAnswers, setSurveyAnswers] = useState({}); 

  const [reviewComment, setReviewComment] = useState({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const userRes = await api.get('/auth/me');
      setUser(userRes.data);

      const groupsRes = await api.get('/groups/');
      setGroups(groupsRes.data);

      const catsRes = await api.get('/directories/social-categories');
      setSocialCategories(catsRes.data);

      const orgsRes = await api.get('/directories/organizations');
      setOrganizations(orgsRes.data);

      const ratingRes = await api.get('/rating/');
      setRatingList(ratingRes.data);

      const surveysRes = await api.get('/surveys/');
      setActiveSurveys(surveysRes.data);

      // Загружаем Уведомления куратора (Раздел 34 ТЗ)
      const notifsRes = await api.get('/notifications/');
      setNotifications(notifsRes.data);

      if (groupsRes.data.length > 0) {
        const defaultGroupId = selectedGroupId || groupsRes.data[0].id;
        if (!selectedGroupId) setSelectedGroupId(defaultGroupId);
        await loadGroupData(defaultGroupId);
      }

      const calendarRes = await api.get('/tasks/my-calendar');
      setCalendar(calendarRes.data);

      if (userRes.data.system_role === 'ADMIN') {
        const execsRes = await api.get('/tasks/executions');
        setAllExecutions(execsRes.data);
      } else {
        const myTasksRes = await api.get('/tasks/my-tasks');
        setMyTasks(myTasksRes.data);
      }

    } catch (err) {
      setError('Не удалось загрузить данные с сервера.');
    } finally {
      setLoading(false);
    }
  };

  const loadGroupData = async (groupId) => {
    try {
      const detailsRes = await api.get(`/groups/${groupId}`);
      setGroupDetails(detailsRes.data);

      const studentsRes = await api.get(`/groups/${groupId}/students?search=${searchQuery}`);
      setStudents(studentsRes.data);
    } catch (err) {
      setError('Ошибка при загрузке данных группы.');
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedGroupId]);

  useEffect(() => {
    if (selectedGroupId) {
      const delayDebounce = setTimeout(() => {
        loadGroupData(selectedGroupId);
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [searchQuery]);

  // --- ОБРАБОТЧИКИ ДЕЙСТВИЙ (API ЗАПРОСЫ) ---

  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/groups/${selectedGroupId}/students`, newStudent);
      setNewStudent({ 
        first_name: '', last_name: '', middle_name: '', is_union_member: false,
        social_category_ids: [], organization_ids: []
      });
      setSuccessMsg('Студент успешно добавлен в социальный паспорт!');
      loadGroupData(selectedGroupId);
    } catch (err) {
      setError('Не удалось добавить студента.');
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post('/groups/', newGroup);
      setNewGroup({ name: '', faculty: '', training_direction: '', course: 1 });
      setSuccessMsg('Группа успешно создана!');
      loadData();
    } catch (err) {
      setError('Не удалось создать группу.');
    }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    try {
      const body = { ...newAssignment };
      if (body.role_code !== 'PROFORG') {
        delete body.protocol_number;
        delete body.protocol_date;
      } else {
        body.protocol_date = body.protocol_date ? new Date(body.protocol_date).toISOString() : null;
      }
      await api.post(`/groups/${selectedGroupId}/assign`, body);
      setNewAssignment({ user_id: '', role_code: 'CURATOR', protocol_number: '', protocol_date: '' });
      setSuccessMsg('Ответственное лицо успешно назначено!');
      loadGroupData(selectedGroupId);
    } catch (err) {
      setError('Не удалось назначить роль.');
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const body = {
        ...newTask,
        due_date: new Date(newTask.due_date).toISOString()
      };
      await api.post('/tasks/', body);
      setNewTask({ title: '', description: '', category: 'mandatory', type: 'photo_proof', due_date: '', points: 10, requirements: '', confirmation_requirements: '' });
      setSuccessMsg('Задача успешно создана и отправлена кураторам!');
      loadData();
    } catch (err) {
      setError('Не удалось опубликовать задачу.');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/directories/social-categories', { name: newCategoryName });
      setNewCategoryName('');
      setSuccessMsg('Новая социальная категория добавлена!');
      loadData();
    } catch (err) {
      setError('Не удалось создать категорию.');
    }
  };

  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    try {
      await api.post('/directories/organizations', { name: newOrgName });
      setNewOrgName('');
      setSuccessMsg('Организация добавлена!');
      loadData();
    } catch (err) {
      setError('Не удалось создать организацию.');
    }
  };

  const handleAdjustPoints = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rating/sanctions/adjust-points', pointsAdjustment);
      setPointsAdjustment({ curator_id: '', points: 0, reason: '' });
      setSuccessMsg('Баллы куратора успешно скорректированы!');
      loadData();
    } catch (err) {
      setError('Не удалось изменить баллы.');
    }
  };

  const handleIssueViolation = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rating/sanctions/disciplinary-mark', disciplinaryMark);
      setDisciplinaryMark({ curator_id: '', reason: '' });
      setSuccessMsg('Дисциплинарная отметка установлена!');
      loadData();
    } catch (err) {
      setError('Не удалось вынести взыскание.');
    }
  };

  const handleRemoveViolation = async (curatorId) => {
    try {
      await api.delete(`/rating/sanctions/disciplinary-mark/${curatorId}`);
      setSuccessMsg('Дисциплинарная отметка снята.');
      loadData();
    } catch (err) {
      setError('Ошибка при снятии отметки.');
    }
  };

  const handleSubmitTask = async (executionId, type) => {
    try {
      let photoUrl = null;
      if (type === 'photo_proof') {
        photoUrl = prompt('Введите URL фотографии-подтверждения:', 'http://storage.ru/photo.jpg');
        if (!photoUrl) return;
      }
      await api.post(`/tasks/my-tasks/${executionId}/submit`, { photo_url: photoUrl });
      setSuccessMsg('Отчет успешно отправлен на проверку!');
      loadData();
    } catch (err) {
      setError('Не удалось отправить отчет.');
    }
  };

  const handleReviewTask = async (executionId, approve) => {
    try {
      const comment = reviewComment[executionId] || '';
      if (!approve && !comment) {
        alert('Пожалуйста, напишите причину возврата на доработку.');
        return;
      }
      await api.post(`/tasks/executions/${executionId}/review`, { approve, comment });
      setSuccessMsg(approve ? 'Отчет успешно одобрен!' : 'Отчет возвращен на доработку.');
      loadData();
    } catch (err) {
      setError('Ошибка при проверке отчета.');
    }
  };

  // --- КОНСТРУКТОР АНКЕТ ---

  const handleAddQuestionToDraft = (e) => {
    e.preventDefault();
    if (!tempQuestion.text) return;
    setSurveyQuestions([...surveyQuestions, tempQuestion]);
    setTempQuestion({ text: '', type: 'text', options: '' });
  };

  const handleRemoveQuestionFromDraft = (index) => {
    setSurveyQuestions(surveyQuestions.filter((_, i) => i !== index));
  };

  const handlePublishSurvey = async (e) => {
    e.preventDefault();
    if (surveyQuestions.length === 0) {
      alert('Пожалуйста, добавьте хотя бы один вопрос в анкету.');
      return;
    }
    try {
      const body = {
        title: newSurveyForm.title,
        description: newSurveyForm.description,
        is_mandatory: newSurveyForm.is_mandatory,
        expires_at: new Date(newSurveyForm.expires_at).toISOString(),
        questions: surveyQuestions
      };
      await api.post('/surveys/', body);
      setNewSurveyForm({ title: '', description: '', is_mandatory: false, expires_at: '' });
      setSurveyQuestions([]);
      setSuccessMsg('Новая анкета успешно опубликована!');
      loadData();
    } catch (err) {
      setError('Не удалось опубликовать анкету.');
    }
  };

  const handleAnswerChange = (qId, val) => {
    setSurveyAnswers({ ...surveyAnswers, [qId]: val });
  };

  const handleSurveySubmit = async (e) => {
    e.preventDefault();
    try {
      const answersPayload = Object.keys(surveyAnswers).map(qId => ({
        question_id: qId,
        value: Array.isArray(surveyAnswers[qId]) ? surveyAnswers[qId].join('; ') : String(surveyAnswers[qId])
      }));

      if (answersPayload.length < selectedSurvey.questions.length) {
        alert('Пожалуйста, ответьте на все вопросы анкеты.');
        return;
      }

      await api.post('/surveys/submit', {
        survey_id: selectedSurvey.id,
        answers: answersPayload
      });

      setSuccessMsg('Анкета успешно пройдена! Результаты сохранены.');
      setSelectedSurvey(null);
      setSurveyAnswers({});
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось отправить ответы на анкету.');
    }
  };

  // --- ОБРАБОТЧИКИ УВЕДОМЛЕНИЙ ---

  const handleMarkAsRead = async (notifId) => {
    try {
      await api.post(`/notifications/${notifId}/read`);
      loadData();
    } catch (err) {
      console.error('Не удалось прочитать уведомление');
    }
  };

  const handleReadAllNotifications = async () => {
    try {
      await api.post('/notifications/read-all');
      loadData();
    } catch (err) {
      console.error('Не удалось прочитать все уведомления');
    }
  };

  const handleCheckboxChange = (id, type) => {
    const listName = type === 'category' ? 'social_category_ids' : 'organization_ids';
    const currentList = newStudent[listName];
    if (currentList.includes(id)) {
      setNewStudent({ ...newStudent, [listName]: currentList.filter(item => item !== id) });
    } else {
      setNewStudent({ ...newStudent, [listName]: [...currentList, id] });
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="animate-spin h-8 w-8 text-blue-500 mr-2" /> Загрузка...
      </div>
    );
  }

  const totalMyTasksCount = myTasks.length;
  const approvedMyTasksCount = myTasks.filter(t => t.status === 'APPROVED').length;
  const completionPercentage = totalMyTasksCount > 0 ? Math.round((approvedMyTasksCount / totalMyTasksCount) * 100) : 0;
  
  const myPoints = myTasks.reduce((sum, t) => sum + t.points_awarded, 0);

  const currentCuratorRating = ratingList.find(r => r.curator_id === user?.id);
  const myPointsCalculated = currentCuratorRating ? currentCuratorRating.points : myPoints;
  const isMyViolation = currentCuratorRating ? currentCuratorRating.has_violation : false;

  // Количество непрочитанных уведомлений
  const unreadNotifsCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Шапка */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <h1 className="text-xl font-bold text-slate-800">Книжка куратора</h1>
        </div>
        <div className="flex items-center space-x-6">
          
          {/* Интерактивный колокольчик уведомлений (Раздел 34 ТЗ) */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-500 hover:text-slate-800 focus:outline-none transition-colors cursor-pointer"
            >
              <Bell className="h-6 w-6" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white font-black text-[10px] h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Выпадающий поп-ап со списком уведомлений */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 py-2 animate-fadeIn max-h-96 overflow-y-auto">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">Уведомления</span>
                  {unreadNotifsCount > 0 && (
                    <button 
                      onClick={handleReadAllNotifications}
                      className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      Прочитать все
                    </button>
                  )}
                </div>
                
                <div className="divide-y divide-slate-100">
                  {notifications.length > 0 ? (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                        className={`p-4 text-xs transition-colors cursor-pointer hover:bg-slate-50 ${!notif.is_read ? 'bg-blue-50/30 font-semibold' : ''}`}
                      >
                        <p className="text-slate-700 leading-relaxed">{notif.text}</p>
                        <span className="text-[10px] text-slate-400 mt-2 block">
                          {new Date(notif.created_at).toLocaleString('ru-RU')}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-slate-400 text-xs">У вас нет новых уведомлений.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <span className="text-sm bg-slate-100 px-3 py-1.5 rounded-lg text-slate-700 font-medium flex items-center">
            <Shield className="h-4 w-4 mr-1.5 text-blue-500" />
            Логин: <strong className="text-slate-900 ml-1">{user?.username}</strong> 
            <span className="ml-1 text-slate-500">({user?.system_role})</span>
          </span>
          <button onClick={onLogout} className="flex items-center text-red-600 hover:text-red-700 font-semibold text-sm transition-colors cursor-pointer">
            <LogOut className="h-4 w-4 mr-1.5" /> Выйти
          </button>
        </div>
      </nav>

      {/* Выбор группы */}
      {groups.length > 0 && (
        <div className="bg-blue-600 text-white px-6 py-3 flex items-center justify-between shadow-inner">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold text-blue-100">Выбранная группа:</span>
            <select 
              value={selectedGroupId} 
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg border border-blue-500 focus:outline-none"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name} ({g.faculty})</option>
              ))}
            </select>
          </div>
          <span className="text-xs text-blue-200 font-mono">ID Группы: {selectedGroupId}</span>
        </div>
      )}

      {/* Сообщения */}
      <div className="max-w-7xl mx-auto w-full px-6 mt-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm shadow-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="font-bold">×</button>
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-sm shadow-sm flex items-center justify-between">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="font-bold">×</button>
          </div>
        )}
      </div>

      {/* Вкладки */}
      <div className="max-w-7xl mx-auto w-full px-6 mt-4 flex border-b border-slate-200 space-x-8">
        <button onClick={() => setActiveTab('overview')} className={`pb-4 text-sm font-semibold transition-all border-b-2 ${activeTab === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Дашборд
        </button>
        <button onClick={() => setActiveTab('students')} className={`pb-4 text-sm font-semibold transition-all border-b-2 ${activeTab === 'students' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Социальный паспорт группы
        </button>
        <button onClick={() => setActiveTab('tasks')} className={`pb-4 text-sm font-semibold transition-all border-b-2 ${activeTab === 'tasks' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Задачи и отчеты {user?.system_role === 'ADMIN' && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full ml-1 font-bold">Контроль</span>}
        </button>
        <button onClick={() => setActiveTab('rating')} className={`pb-4 text-sm font-semibold transition-all border-b-2 ${activeTab === 'rating' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Рейтинг кураторов
        </button>
        <button onClick={() => setActiveTab('surveys')} className={`pb-4 text-sm font-semibold transition-all border-b-2 ${activeTab === 'surveys' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Анкеты / Опросы {activeSurveys.length > 0 && <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full ml-1">{activeSurveys.length}</span>}
        </button>
        {user?.system_role === 'ADMIN' && (
          <button onClick={() => setActiveTab('admin')} className={`pb-4 text-sm font-semibold transition-all border-b-2 ${activeTab === 'admin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Панель управления (Админ)
          </button>
        )}
      </div>

      {/* Контент */}
      <main className="max-w-7xl mx-auto w-full p-6 flex-grow">
        
        {/* ================= Вкладка 1: ДАШБОРД ================= */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600"><Users className="h-6 w-6" /></div>
                  <h2 className="text-lg font-bold text-slate-800">Моя группа</h2>
                </div>
                {groupDetails ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-slate-500">Название</div>
                      <div className="text-xl font-bold text-slate-900">{groupDetails.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Факультет</div>
                      <div className="font-semibold text-slate-800">{groupDetails.faculty}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Количество студентов</div>
                      <div className="text-lg font-bold text-blue-600">{groupDetails.students_count} чел.</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-sm py-8 text-center">Группа не выбрана.</div>
                )}
              </div>
              {groupDetails && (
                <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Староста:</span>
                    <span className="font-semibold text-slate-800">{groupDetails.starosta?.username || 'Не назначен'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Профорг:</span>
                    <span className="font-semibold text-slate-800">{groupDetails.proforg?.username || 'Не назначен'}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600"><Award className="h-6 w-6" /></div>
                  <h2 className="text-lg font-bold text-slate-800">Мой прогресс</h2>
                </div>
                {user?.system_role === 'ADMIN' ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    Администраторы проверяют отчеты во вкладке «Задачи и отчеты».
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center py-4 bg-slate-50 rounded-2xl relative">
                      {isMyViolation && (
                        <div className="absolute top-2.5 right-2.5 text-red-500" title="Взыскание!">
                          <AlertTriangle className="h-5 w-5 animate-bounce" />
                        </div>
                      )}
                      <div className="text-4xl font-extrabold text-slate-800">{approvedMyTasksCount} / {totalMyTasksCount}</div>
                      <div className="text-sm text-slate-500 mt-1">Выполнено задач</div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm font-semibold mb-2">
                        <span className="text-slate-600">Процент выполнения</span>
                        <span className="text-slate-900">{completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-3">
                        <div className="bg-blue-600 h-3 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {user?.system_role !== 'ADMIN' && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-slate-500 text-sm">Текущие баллы:</span>
                  <span className="text-2xl font-black text-emerald-600">{myPointsCalculated} б.</span>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-purple-50 p-2.5 rounded-xl text-purple-600"><Calendar className="h-6 w-6" /></div>
                <h2 className="text-lg font-bold text-slate-800">Ближайшие события</h2>
              </div>
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {calendar.length > 0 ? (
                  calendar.map((item) => (
                    <div key={item.id} className={`p-4 rounded-xl border flex items-start space-x-3 ${item.type === 'event' ? 'bg-purple-50/50 border-purple-100' : 'bg-amber-50/50 border-amber-100'}`}>
                      <div className="mt-0.5">
                        {item.type === 'event' ? <Calendar className="h-4 w-4 text-purple-600" /> : <CheckSquare className="h-4 w-4 text-amber-600" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-slate-800 leading-tight">{item.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(item.date_time).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                          {item.location && ` • ${item.location}`}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-slate-500 text-sm py-12">Событий не запланировано.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= Вкладка 2: СПИСОК СТУДЕНТОВ ================= */}
        {activeTab === 'students' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-fadeIn grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800">Паспорт академической группы</h2>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input type="text" placeholder="Быстрый поиск по ФИО..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                      <th className="pb-3">Студент (ФИО)</th>
                      <th className="pb-3 text-center">Профсоюз</th>
                      <th className="pb-3">Социальные категории</th>
                      <th className="pb-3">Студ. организации</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length > 0 ? (
                      students.map(s => (
                        <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-all">
                          <td className="py-4 font-bold text-slate-800">{s.last_name} {s.first_name} {s.middle_name || ''}</td>
                          <td className="py-4 text-center">
                            {s.is_union_member ? <span className="bg-emerald-50 text-emerald-600 text-xs px-2.5 py-1 rounded-full font-bold">Член ✓</span> : <span className="text-slate-400 text-xs">-</span>}
                          </td>
                          <td className="py-4">
                            <div className="flex flex-wrap gap-1">
                              {s.social_categories.length > 0 ? s.social_categories.map(c => (
                                <span key={c.id} className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center"><Tag className="h-2.5 w-2.5 mr-0.5" /> {c.name}</span>
                              )) : <span className="text-slate-300 text-xs">—</span>}
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex flex-wrap gap-1">
                              {s.organizations.length > 0 ? s.organizations.map(o => (
                                <span key={o.id} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center"><Briefcase className="h-2.5 w-2.5 mr-0.5" /> {o.name}</span>
                              )) : <span className="text-slate-300 text-xs">—</span>}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="4" className="py-8 text-center text-slate-400">Студенты не найдены.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 h-fit">
              <div className="flex items-center space-x-2.5 mb-6">
                <UserPlus className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-800">Добавить студента</h3>
              </div>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Фамилия</label>
                  <input required type="text" value={newStudent.last_name} onChange={(e) => setNewStudent({...newStudent, last_name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-800" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Имя</label>
                  <input required type="text" value={newStudent.first_name} onChange={(e) => setNewStudent({...newStudent, first_name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-800" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Отчество</label>
                  <input type="text" value={newStudent.middle_name} onChange={(e) => setNewStudent({...newStudent, middle_name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white text-slate-800" />
                </div>
                <div className="flex items-center space-x-3 py-1">
                  <input type="checkbox" id="is_union" checked={newStudent.is_union_member} onChange={(e) => setNewStudent({...newStudent, is_union_member: e.target.checked})} className="rounded text-blue-600 h-4 w-4" />
                  <label htmlFor="is_union" className="text-sm font-semibold text-slate-700">Состоит в профсоюзе</label>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Социальные категории</label>
                  <div className="max-h-24 overflow-y-auto border border-slate-200 bg-white p-2.5 rounded-lg space-y-1.5">
                    {socialCategories.map(cat => (
                      <div key={cat.id} className="flex items-center space-x-2 text-xs">
                        <input type="checkbox" checked={newStudent.social_category_ids.includes(cat.id)} onChange={() => handleCheckboxChange(cat.id, 'category')} className="rounded h-3 w-3" />
                        <span className="text-slate-700 font-semibold">{cat.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Студенческие организации</label>
                  <div className="max-h-24 overflow-y-auto border border-slate-200 bg-white p-2.5 rounded-lg space-y-1.5">
                    {organizations.map(org => (
                      <div key={org.id} className="flex items-center space-x-2 text-xs">
                        <input type="checkbox" checked={newStudent.organization_ids.includes(org.id)} onChange={() => handleCheckboxChange(org.id, 'org')} className="rounded h-3 w-3" />
                        <span className="text-slate-700 font-semibold">{org.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-all shadow-md mt-4 cursor-pointer">
                  Сохранить в паспорт группы
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= Вкладка 3: ЗАДАЧИ И ОТЧЕТЫ ================= */}
        {activeTab === 'tasks' && (
          <div className="grid grid-cols-1 gap-6 animate-fadeIn">
            {user?.system_role === 'ADMIN' ? (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center space-x-3 mb-6 border-b border-slate-100 pb-4">
                  <Shield className="h-5 w-5 text-red-500" />
                  <h2 className="text-lg font-bold text-slate-800">Все отчеты кураторов в системе</h2>
                </div>
                <div className="space-y-6">
                  {allExecutions.length > 0 ? (
                    allExecutions.map(exe => (
                      <div key={exe.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800 text-base">{exe.task?.title}</span>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                              exe.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                              exe.status === 'PENDING' ? 'bg-amber-50 text-amber-600 animate-pulse' :
                              exe.status === 'REVISION' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {exe.status === 'APPROVED' ? 'Одобрена' :
                               exe.status === 'PENDING' ? 'На проверке' :
                               exe.status === 'REVISION' ? 'Доработка' : 'Не начата'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">{exe.task?.description}</p>
                          {exe.photo_url && (
                            <div className="mt-3 text-xs bg-blue-50 border border-blue-100 p-2 rounded-lg text-blue-600 inline-block">
                              Фотоподтверждение: <a href={exe.photo_url} target="_blank" rel="noreferrer" className="underline font-bold">{exe.photo_url}</a>
                            </div>
                          )}
                          {exe.admin_comment && (
                            <p className="text-xs text-red-500 font-semibold mt-2">Комментарий: {exe.admin_comment}</p>
                          )}
                        </div>
                        {exe.status === 'PENDING' && (
                          <div className="border-t md:border-t-0 pt-4 md:pt-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <input type="text" placeholder="Замечание..." value={reviewComment[exe.id] || ''} onChange={(e) => setReviewComment({...reviewComment, [exe.id]: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-800" />
                            <div className="flex gap-2">
                              <button onClick={() => handleReviewTask(exe.id, true)} className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg flex items-center justify-center cursor-pointer"><Check className="h-3.5 w-3.5 mr-1" /> Одобрить</button>
                              <button onClick={() => handleReviewTask(exe.id, false)} className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg flex items-center justify-center cursor-pointer"><X className="h-3.5 w-3.5 mr-1" /> Вернуть</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-400 py-12">Отчетов на проверке нет.</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 mb-6">Мои задачи куратора</h2>
                <div className="space-y-6">
                  {myTasks.length > 0 ? (
                    myTasks.map(exe => (
                      <div key={exe.id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-800 text-base">{exe.task?.title}</span>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                              exe.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                              exe.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                              exe.status === 'REVISION' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {exe.status === 'APPROVED' ? 'Одобрена' : exe.status === 'PENDING' ? 'На проверке' : exe.status === 'REVISION' ? 'Доработка' : 'Не начата'}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 mt-1">{exe.task?.description}</p>
                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            {exe.task?.requirements && <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">Требования: {exe.task.requirements}</span>}
                            {exe.task?.confirmation_requirements && <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded">Проверка: {exe.task.confirmation_requirements}</span>}
                          </div>
                          {exe.admin_comment && <p className="text-sm text-red-500 font-bold mt-2">Замечание: {exe.admin_comment}</p>}
                        </div>
                        {(exe.status === 'NOT_STARTED' || exe.status === 'REVISION') && (
                          <button onClick={() => handleSubmitTask(exe.id, exe.task?.type)} className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg shadow cursor-pointer">
                            {exe.task?.type === 'photo_proof' ? 'Загрузить фотоотчет' : 'Отметить выполнение'}
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-400 py-12">Активных задач нет.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= Вкладка 4: ТУРНИРНАЯ ТАБЛИЦА (РЕЙТИНГ) ================= */}
        {activeTab === 'rating' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-fadeIn space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800">Рейтинговая таблица кураторов</h2>
              <span className="text-xs text-slate-400">Формируется автоматически на основе баллов и выполнения</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="pb-3 text-center">Место</th>
                    <th className="pb-3">Куратор (ID)</th>
                    <th className="pb-3 text-center">Прогресс программы</th>
                    <th className="pb-3 text-center">Доп. баллы (штрафы/премии)</th>
                    <th className="pb-3 text-right">Суммарный балл</th>
                  </tr>
                </thead>
                <tbody>
                  {ratingList.length > 0 ? (
                    ratingList.map(r => (
                      <tr key={r.curator_id} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-all ${user?.id === r.curator_id ? 'bg-blue-50/20 font-semibold' : ''}`}>
                        <td className="py-4 text-center">
                          <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full font-bold text-xs ${
                            r.place === 1 ? 'bg-amber-100 text-amber-800' :
                            r.place === 2 ? 'bg-slate-200 text-slate-800' :
                            r.place === 3 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {r.place}
                          </span>
                        </td>
                        <td className="py-4 flex items-center space-x-2">
                          <span className="text-slate-800 font-bold">{r.username}</span>
                          <span className="text-xs font-mono text-slate-400">({r.curator_id.substring(0,8)})</span>
                          {r.has_violation && (
                            <span className="text-red-500 flex items-center" title={r.violation_reason || 'Имеется активное взыскание / нарушение (причина скрыта)'}>
                              <AlertTriangle className="h-4 w-4" />
                              {r.violation_reason && (
                                <span className="text-[10px] ml-1 bg-red-50 text-red-600 px-1.5 py-0.5 rounded font-mono">
                                  {r.violation_reason}
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <span className="text-xs font-semibold">{r.completion_percentage}%</span>
                            <div className="w-16 bg-slate-100 h-1.5 rounded-full">
                              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${r.completion_percentage}%` }}></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 text-center font-semibold">
                          {r.additional_points > 0 ? (
                            <span className="text-emerald-600 flex items-center justify-center"><ArrowUpCircle className="h-4 w-4 mr-1" /> +{r.additional_points} б.</span>
                          ) : r.additional_points < 0 ? (
                            <span className="text-red-600 flex items-center justify-center"><ArrowDownCircle className="h-4 w-4 mr-1" /> {r.additional_points} б.</span>
                          ) : (
                            <span className="text-slate-400">0 б.</span>
                          )}
                        </td>
                        <td className="py-4 text-right font-black text-slate-800 text-base">{r.points} б.</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="5" className="py-8 text-center text-slate-400">В рейтинге пока нет кураторов.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= Вкладка 5: АНКЕТЫ И ОПРОСЫ ================= */}
        {activeTab === 'surveys' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-fadeIn space-y-6">
            
            {selectedSurvey ? (
              <div>
                <button onClick={() => setSelectedSurvey(null)} className="mb-4 text-sm font-bold text-blue-600 hover:underline flex items-center cursor-pointer">
                  ← Назад к списку анкет
                </button>
                <div className="border-b border-slate-100 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-slate-800">{selectedSurvey.title}</h2>
                  {selectedSurvey.description && <p className="text-slate-500 mt-2 text-sm">{selectedSurvey.description}</p>}
                  {selectedSurvey.is_mandatory && <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded mt-2 inline-block">Обязательный опрос</span>}
                </div>

                <form onSubmit={handleSurveySubmit} className="space-y-6 max-w-2xl">
                  {selectedSurvey.questions.map((q, idx) => (
                    <div key={q.id} className="p-5 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-3">
                      <label className="block font-bold text-slate-800 text-base">
                        {idx + 1}. {q.text}
                      </label>
                      {q.type === 'text' && (
                        <input required type="text" onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800" />
                      )}
                      {q.type === 'long_text' && (
                        <textarea required rows="3" onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800" />
                      )}
                      {q.type === 'single_choice' && (
                        <div className="space-y-2.5">
                          {q.options?.split(';').map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center space-x-3 text-sm font-semibold">
                              <input required name={`q_${q.id}`} type="radio" value={opt.trim()} onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="h-4 w-4" />
                              <span className="text-slate-700">{opt.trim()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {q.type === 'multiple_choice' && (
                        <div className="space-y-2.5">
                          {q.options?.split(';').map((opt, oIdx) => {
                            const trimmedOpt = opt.trim();
                            const currentAnswers = surveyAnswers[q.id] || [];
                            return (
                              <div key={oIdx} className="flex items-center space-x-3 text-sm font-semibold">
                                <input type="checkbox" checked={currentAnswers.includes(trimmedOpt)} onChange={() => {
                                  if (currentAnswers.includes(trimmedOpt)) {
                                    handleAnswerChange(q.id, currentAnswers.filter(a => a !== trimmedOpt));
                                  } else {
                                    handleAnswerChange(q.id, [...currentAnswers, trimmedOpt]);
                                  }
                                }} className="rounded h-4 w-4" />
                                <span className="text-slate-700">{trimmedOpt}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {q.type === 'dropdown' && (
                        <select required onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-800">
                          <option value="">Выберите ответ...</option>
                          {q.options?.split(';').map((opt, oIdx) => (
                            <option key={oIdx} value={opt.trim()}>{opt.trim()}</option>
                          ))}
                        </select>
                      )}
                      {q.type === 'number' && (
                        <input required type="number" onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-800" />
                      )}
                      {q.type === 'date' && (
                        <input required type="date" onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-800" />
                      )}
                      {q.type === 'scale' && (
                        <div className="flex justify-between max-w-sm">
                          {[1, 2, 3, 4, 5].map(num => (
                            <div key={num} className="flex flex-col items-center">
                              <span className="text-xs text-slate-400 mb-1">{num}</span>
                              <input required type="radio" name={`scale_${q.id}`} value={num} onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="h-4 w-4" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <button type="submit" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow cursor-pointer">
                    Отправить ответы на проверку
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <FileText className="h-6 w-6 text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-800">Активные анкеты и опросы кураторов</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeSurveys.length > 0 ? (
                    activeSurveys.map(survey => (
                      <div key={survey.id} className="p-6 border border-slate-150 rounded-2xl bg-white shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-bold text-lg text-slate-800">{survey.title}</span>
                            {survey.is_mandatory && (
                              <span className="bg-red-50 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded">Обязательно</span>
                            )}
                          </div>
                          {survey.description && <p className="text-sm text-slate-500 line-clamp-2">{survey.description}</p>}
                        </div>
                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-400">Вопросов: <strong className="text-slate-700">{survey.questions?.length}</strong></span>
                          <button onClick={() => setSelectedSurvey(survey)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg cursor-pointer">
                            Пройти опрос
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-400 py-12 md:col-span-2">На данный момент нет активных опросов кураторов.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= Вкладка 6: ПАНЕЛЬ УПРАВЛЕНИЯ (ТОЛЬКО АДМИН) ================= */}
        {activeTab === 'admin' && user?.system_role === 'ADMIN' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* ИНТЕРАКТИВНЫЙ КОНСТРУКТОР АНКЕТ */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center space-x-2.5 mb-6 border-b border-slate-100 pb-4">
                <FileText className="h-5 w-5 text-purple-600" />
                <h3 className="font-bold text-slate-800">Конструктор опросов (Собрать анкету)</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Название анкеты</label>
                      <input required type="text" placeholder="например, Качество работы с первокурсниками" value={newSurveyForm.title} onChange={(e) => setNewSurveyForm({...newSurveyForm, title: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Описание опроса</label>
                      <input type="text" placeholder="краткое описание для кураторов" value={newSurveyForm.description} onChange={(e) => setNewSurveyForm({...newSurveyForm, description: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Период прохождения (Дедлайн)</label>
                      <input required type="datetime-local" value={newSurveyForm.expires_at} onChange={(e) => setNewSurveyForm({...newSurveyForm, expires_at: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white" />
                    </div>
                    <div className="flex items-center space-x-3 pt-4">
                      <input type="checkbox" id="survey_mandatory" checked={newSurveyForm.is_mandatory} onChange={(e) => setNewSurveyForm({...newSurveyForm, is_mandatory: e.target.checked})} className="rounded h-4 w-4" />
                      <label htmlFor="survey_mandatory" className="text-sm font-semibold text-slate-700">Обязательное прохождение</label>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    <h4 className="font-bold text-slate-700 mb-4 flex items-center">
                      <HelpCircle className="h-4.5 w-4.5 text-blue-500 mr-2" /> Вопросы в анкете ({surveyQuestions.length})
                    </h4>
                    <div className="space-y-3">
                      {surveyQuestions.length > 0 ? (
                        surveyQuestions.map((q, idx) => (
                          <div key={idx} className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex items-center justify-between">
                            <div>
                              <span className="text-xs text-slate-400 font-bold">Вопрос {idx + 1} ({q.type})</span>
                              <p className="font-semibold text-slate-800 mt-0.5">{q.text}</p>
                              {q.options && <p className="text-xs text-slate-400 mt-1">Варианты: {q.options}</p>}
                            </div>
                            <button onClick={() => handleRemoveQuestionFromDraft(idx)} className="text-red-500 hover:text-red-700 font-bold text-lg">×</button>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-slate-400 text-xs py-8">Вы еще не добавили ни одного вопроса.</p>
                      )}
                    </div>
                  </div>

                  {surveyQuestions.length > 0 && (
                    <button onClick={handlePublishSurvey} className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-sm shadow transition-all flex items-center justify-center cursor-pointer">
                      <Save className="h-4.5 w-4.5 mr-2" /> Опубликовать и разослать анкету кураторам
                    </button>
                  )}
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 h-fit">
                  <h4 className="font-bold text-slate-800 text-sm mb-4">Добавить новый вопрос</h4>
                  <form onSubmit={handleAddQuestionToDraft} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Текст вопроса</label>
                      <input required type="text" placeholder="например, Сколько студентов пришло?" value={tempQuestion.text} onChange={(e) => setTempQuestion({...tempQuestion, text: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Тип ответа (п. 28 ТЗ)</label>
                      <select value={tempQuestion.type} onChange={(e) => setTempQuestion({...tempQuestion, type: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white">
                        <option value="text">Строка текста</option>
                        <option value="long_text">Развернутый текстовый ответ</option>
                        <option value="single_choice">Выбор одного варианта (radio)</option>
                        <option value="multiple_choice">Выбор нескольких вариантов (checkbox)</option>
                        <option value="dropdown">Выпадающий список (select)</option>
                        <option value="number">Числовой ввод</option>
                        <option value="date">Дата</option>
                        <option value="scale">Шкала оценок (от 1 до 5)</option>
                      </select>
                    </div>

                    {(tempQuestion.type === 'single_choice' || tempQuestion.type === 'multiple_choice' || tempQuestion.type === 'dropdown') && (
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Варианты ответов (через точку с запятой)</label>
                        <input required type="text" placeholder="например: Да; Нет; Затрудняюсь" value={tempQuestion.options} onChange={(e) => setTempQuestion({...tempQuestion, options: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white" />
                      </div>
                    )}

                    <button type="submit" className="w-full py-2 bg-blue-600 text-white font-bold rounded-lg text-xs cursor-pointer">
                      + Записать вопрос в черновик
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center space-x-2.5 mb-6">
                  <PlusCircle className="h-5 w-5 text-blue-600" />
                  <h3 className="font-bold text-slate-800">Создать группу</h3>
                </div>
                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Номер/Название группы</label>
                    <input required type="text" value={newGroup.name} onChange={(e) => setNewGroup({...newGroup, name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Факультет/Институт</label>
                    <input required type="text" value={newGroup.faculty} onChange={(e) => setNewGroup({...newGroup, faculty: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Направление подготовки</label>
                    <input type="text" value={newGroup.training_direction} onChange={(e) => setNewGroup({...newGroup, training_direction: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Курс (от 1 до 6)</label>
                    <input required type="number" min="1" max="6" value={newGroup.course} onChange={(e) => setNewGroup({...newGroup, course: parseInt(e.target.value)})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white" />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg text-sm transition-all cursor-pointer">Создать группу</button>
                </form>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center space-x-2.5 mb-6">
                  <UserPlus className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-800">Назначить ответственного</h3>
                </div>
                <form onSubmit={handleAssignRole} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">ID Пользователя системы (UUID)</label>
                    <input required type="text" placeholder="UUID пользователя" value={newAssignment.user_id} onChange={(e) => setNewAssignment({...newAssignment, user_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Роль в группе</label>
                    <select value={newAssignment.role_code} onChange={(e) => setNewAssignment({...newAssignment, role_code: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white">
                      <option value="CURATOR">Куратор</option>
                      <option value="STAROSTA">Староста</option>
                      <option value="PROFORG">Профорг</option>
                    </select>
                  </div>
                  {newAssignment.role_code === 'PROFORG' && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Номер протокола</label>
                        <input required type="text" value={newAssignment.protocol_number} onChange={(e) => setNewAssignment({...newAssignment, protocol_number: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Дата протокола</label>
                        <input required type="date" value={newAssignment.protocol_date} onChange={(e) => setNewAssignment({...newAssignment, protocol_date: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white" />
                      </div>
                    </div>
                  )}
                  <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white font-semibold rounded-lg text-sm transition-all cursor-pointer">Назначить роль</button>
                </form>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
                <div>
                  <div className="flex items-center space-x-2.5 mb-4">
                    <Tag className="h-5 w-5 text-amber-500" />
                    <h3 className="font-bold text-slate-800">Добавить соц. категорию</h3>
                  </div>
                  <form onSubmit={handleCreateCategory} className="flex gap-2">
                    <input required type="text" placeholder="например: Сирота" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="flex-grow px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white" />
                    <button type="submit" className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer">Создать</button>
                  </form>
                </div>
                
                <div className="border-t border-slate-100 pt-6">
                  <div className="flex items-center space-x-2.5 mb-4">
                    <Briefcase className="h-5 w-5 text-blue-500" />
                    <h3 className="font-bold text-slate-800">Добавить студ. организацию</h3>
                  </div>
                  <form onSubmit={handleCreateOrganization} className="flex gap-2">
                    <input required type="text" placeholder="например: Студсовет" value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} className="flex-grow px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white" />
                    <button type="submit" className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer">Создать</button>
                  </form>
                </div>
              </div>

            </div>

            {/* БЛОК САНКЦИЙ И ДИСЦИПЛИНАРНЫХ МЕР */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center space-x-2.5 mb-6">
                  <ShieldAlert className="h-5 w-5 text-red-500" />
                  <h3 className="font-bold text-slate-800">Санкции: Изменение баллов куратора</h3>
                </div>
                <form onSubmit={handleAdjustPoints} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">ID Куратора (UUID пользователя)</label>
                    <input required type="text" placeholder="UUID куратора из СУБД" value={pointsAdjustment.curator_id} onChange={(e) => setPointsAdjustment({...pointsAdjustment, curator_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Баллы</label>
                    <input required type="number" placeholder="например, -50 или 100" value={pointsAdjustment.points} onChange={(e) => setPointsAdjustment({...pointsAdjustment, points: parseInt(e.target.value)})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Причина</label>
                    <input required type="text" value={pointsAdjustment.reason} onChange={(e) => setPointsAdjustment({...pointsAdjustment, reason: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white" />
                  </div>
                  <button type="submit" className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-all cursor-pointer">Применить изменение баллов</button>
                </form>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center space-x-2.5 mb-6">
                  <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
                  <h3 className="font-bold text-slate-800">Санкции: Вынести дисциплинарную отметку (⚠)</h3>
                </div>
                <form onSubmit={handleIssueViolation} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">ID Куратора-нарушителя (UUID)</label>
                    <input required type="text" placeholder="UUID пользователя" value={disciplinaryMark.curator_id} onChange={(e) => setDisciplinaryMark({...disciplinaryMark, curator_id: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Суть нарушения</label>
                    <textarea required rows="2" placeholder="например, Неявка на собрание кураторов" value={disciplinaryMark.reason} onChange={(e) => setDisciplinaryMark({...disciplinaryMark, reason: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-grow py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-all cursor-pointer">Установить отметку (⚠)</button>
                    {disciplinaryMark.curator_id && (
                      <button type="button" onClick={() => handleRemoveViolation(disciplinaryMark.curator_id)} className="px-4 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-lg cursor-pointer">Снять</button>
                    )}
                  </div>
                </form>
              </div>

            </div>

            {/* Форма 4: Новая задача */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center space-x-2.5 mb-6">
                <CheckSquare className="h-5 w-5 text-purple-600" />
                <h3 className="font-bold text-slate-800">Создать новую задачу для кураторов</h3>
              </div>
              <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Заголовок</label>
                    <input required type="text" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Описание</label>
                    <textarea rows="3" value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Категория</label>
                    <select value={newTask.category} onChange={(e) => setNewTask({...newTask, category: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white">
                      <option value="mandatory">Обязательная</option>
                      <option value="optional">По выбору</option>
                      <option value="extramural">Заочная</option>
                      <option value="intramural">Очная</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Тип отчета</label>
                    <select value={newTask.type} onChange={(e) => setNewTask({...newTask, type: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white">
                      <option value="photo_proof">Требуется фотография-подтверждение</option>
                      <option value="no_proof">Просто отметка о выполнении</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Дедлайн</label>
                    <input required type="datetime-local" value={newTask.due_date} onChange={(e) => setNewTask({...newTask, due_date: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Количество баллов</label>
                    <input required type="number" min="0" value={newTask.points} onChange={(e) => setNewTask({...newTask, points: parseInt(e.target.value)})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Требования к выполнению</label>
                    <input type="text" value={newTask.requirements} onChange={(e) => setNewTask({...newTask, requirements: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Требования к проверке</label>
                    <input type="text" value={newTask.confirmation_requirements} onChange={(e) => setNewTask({...newTask, confirmation_requirements: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-purple-600 text-white font-bold rounded-lg text-sm transition-all shadow-lg hover:shadow-purple-200 mt-4 cursor-pointer">Опубликовать задачу</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default Dashboard;