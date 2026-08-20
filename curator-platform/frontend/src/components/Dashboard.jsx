import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Users, Award, Calendar, CheckSquare, LogOut, RefreshCw, 
  Search, UserPlus, PlusCircle, Check, X, Shield, BookOpen, Clock, Tag, Briefcase, AlertTriangle, ShieldAlert, ArrowUpCircle, ArrowDownCircle, FileText, HelpCircle, Save, Bell, ChevronLeft, ChevronRight, Upload
} from 'lucide-react';

function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview'); // overview, students, tasks, rating, surveys, statistics, admin
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

  // Результаты опросов для администратора
  const [surveyResponsesSummary, setSurveyResponsesSummary] = useState(null);

  // Состояния для задач, календаря и рейтинга
  const [myTasks, setMyTasks] = useState([]);
  const [allExecutions, setAllExecutions] = useState([]); 
  const [calendar, setCalendar] = useState([]);
  const [ratingList, setRatingList] = useState([]);

  // Настройки календаря на месяц
  const [currentCalDate, setCurrentCalDate] = useState(new Date());
  const [selectedCalItem, setSelectedCalItem] = useState(null); // Модальное окно деталей события

  // Состояния интерактивной карточки студента
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editStudentForm, setEditStudentForm] = useState({
    first_name: '', last_name: '', middle_name: '', is_union_member: false,
    social_category_ids: [], organization_ids: [],
    phone: '', address: '', parent_info: ''
  });

  // Состояния интерактивной загрузки отчетов
  const [submittingTaskExe, setSubmittingTaskExe] = useState(null); // Текущая сдаваемая задача
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState(''); // Ссылка на загруженное фото на сервере
  const [isUploadingFile, setIsUploadingFile] = useState(false); // Процесс загрузки
  const [confirmedRequirements, setConfirmedRequirements] = useState(false); // Чекбокс подтверждения требований

  // История назначений группы
  const [assignmentHistory, setAssignmentHistory] = useState([]);
  
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
  
  // Создание задачи с параметрами таргетинга
  const [newTask, setNewTask] = useState({ 
    title: '', description: '', category: 'mandatory', type: 'photo_proof', 
    due_date: '', points: 10, requirements: '', confirmation_requirements: '',
    target_type: 'all', target_course: 1, target_faculty: '', target_group_ids: []
  });
  
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

      // Загружаем Уведомления куратора
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

      // Загружаем историю назначений группы
      const historyRes = await api.get(`/groups/${groupId}/history`);
      setAssignmentHistory(historyRes.data);
    } catch (err) {
      setError('Ошибка при загрузке данных группы и ее истории.');
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

  // Метод снятия ответственного лица с роли
  const handleUnassignRole = async (userId, roleCode) => {
    if (!window.confirm(`Вы действительно хотите снять пользователя с роли ${roleCode}?`)) return;
    try {
      await api.post(`/groups/${selectedGroupId}/unassign`, null, {
        params: { user_id: userId, role_code: roleCode }
      });
      setSuccessMsg(`Пользователь успешно снят с роли ${roleCode}!`);
      loadGroupData(selectedGroupId);
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось снять пользователя с роли.');
    }
  };

  // --- МЕТОДЫ УПРАВЛЕНИЯ СПРАВОЧНИКАМИ ---

  const handleToggleCategoryActive = async (id, name, newActive) => {
    try {
      await api.put(`/directories/social-categories/${id}`, { name }, {
        params: { is_active: newActive }
      });
      setSuccessMsg(`Категория успешно ${newActive ? 'активирована' : 'деактивирована'}!`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось обновить статус категории.');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Вы действительно хотите удалить эту категорию?')) return;
    try {
      await api.delete(`/directories/social-categories/${id}`);
      setSuccessMsg('Категория успешно удалена!');
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось удалить категорию. Возможно, она привязана к студентам.');
    }
  };

  const handleToggleOrgActive = async (id, name, newActive) => {
    try {
      await api.put(`/directories/organizations/${id}`, { name }, {
        params: { is_active: newActive }
      });
      setSuccessMsg(`Организация успешно ${newActive ? 'активирована' : 'деактивирована'}!`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось обновить статус организации.');
    }
  };

  const handleDeleteOrg = async (id) => {
    if (!window.confirm('Вы действительно хотите удалить эту организацию?')) return;
    try {
      await api.delete(`/directories/organizations/${id}`);
      setSuccessMsg('Организация успешно удалена!');
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось удалить организацию. Возможно, она привязана к студентам.');
    }
  };

  // Метод создания задачи с поддержкой массового назначения
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const body = {
        ...newTask,
        due_date: new Date(newTask.due_date).toISOString(),
        target_course: newTask.target_type === 'course' ? parseInt(newTask.target_course) : null,
        target_faculty: newTask.target_type === 'faculty' ? newTask.target_faculty : null,
        target_group_ids: newTask.target_type === 'group' ? newTask.target_group_ids : null
      };
      await api.post('/tasks/', body);
      setNewTask({ 
        title: '', description: '', category: 'mandatory', type: 'photo_proof', 
        due_date: '', points: 10, requirements: '', confirmation_requirements: '',
        target_type: 'all', target_course: 1, target_faculty: '', target_group_ids: []
      });
      setSuccessMsg('Задача успешно создана и отправлена выбранным кураторам!');
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

  // --- МЕТОДЫ ИНТЕРАКТИВНОЙ КАРТОЧКИ СТУДЕНТА ---

  const handleOpenStudentCard = (student) => {
    setSelectedStudent(student);
    setEditStudentForm({
      first_name: student.first_name,
      last_name: student.last_name,
      middle_name: student.middle_name || '',
      is_union_member: student.is_union_member,
      social_category_ids: student.social_categories.map(c => c.id),
      organization_ids: student.organizations.map(o => o.id),
      // Сведения социального паспорта (мокап-поля)
      phone: student.phone || '+7 (914) 456-11-22',
      address: student.address || 'г. Чита, ул. Бутина, д. 31',
      parent_info: student.parent_info || 'Иванова О.П. (мать) — +7 (914) 000-11-22'
    });
  };

  const handleCardCheckboxChange = (id, type) => {
    const listName = type === 'category' ? 'social_category_ids' : 'organization_ids';
    const currentList = editStudentForm[listName];
    if (currentList.includes(id)) {
      setEditStudentForm({ ...editStudentForm, [listName]: currentList.filter(item => item !== id) });
    } else {
      setEditStudentForm({ ...editStudentForm, [listName]: [...currentList, id] });
    }
  };

  const handleSaveStudentCard = async (e) => {
    e.preventDefault();
    try {
      const body = {
        first_name: editStudentForm.first_name,
        last_name: editStudentForm.last_name,
        middle_name: editStudentForm.middle_name,
        is_union_member: editStudentForm.is_union_member,
        social_category_ids: editStudentForm.social_category_ids,
        organization_ids: editStudentForm.organization_ids
      };
      
      await api.put(`/groups/${selectedGroupId}/students/${selectedStudent.id}`, body);
      setSuccessMsg('Данные студента успешно сохранены в социальный паспорт!');
      setSelectedStudent(null);
      loadGroupData(selectedGroupId);
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось обновить сведения студента.');
    }
  };

  // --- МЕТОДЫ ИНТЕРАКТИВНОЙ ЗАГРУЗКИ ПОДТВЕРЖДЕНИЙ ---

  const handleOpenTaskSubmit = (exe) => {
    if (exe.task?.type === 'no_proof') {
      submitTaskWithoutProof(exe.id);
    } else {
      setSubmittingTaskExe(exe);
      setUploadedPhotoUrl('');
      setConfirmedRequirements(false);
    }
  };

  const submitTaskWithoutProof = async (executionId) => {
    try {
      await api.post(`/tasks/my-tasks/${executionId}/submit`, { photo_url: null });
      setSuccessMsg('Отчет успешно отправлен на проверку!');
      loadData();
    } catch (err) {
      setError('Не удалось отправить отчет.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingFile(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setUploadedPhotoUrl(res.data.url);
      setSuccessMsg('Файл успешно загружен на сервер и обработан!');
    } catch (err) {
      setError('Не удалось загрузить файл. Попробуйте еще раз.');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleConfirmAndSubmitReport = async (e) => {
    e.preventDefault();
    if (!uploadedPhotoUrl) {
      alert('Пожалуйста, загрузите фотографию-подтверждение.');
      return;
    }
    if (!confirmedRequirements) {
      alert('Пожалуйста, подтвердите выполнение требований.');
      return;
    }
    try {
      await api.post(`/tasks/my-tasks/${submittingTaskExe.id}/submit`, { photo_url: uploadedPhotoUrl });
      setSuccessMsg('Отчет по задаче успешно отправлен на проверку!');
      setSubmittingTaskExe(null);
      setUploadedPhotoUrl('');
      loadData();
    } catch (err) {
      setError('Не удалось отправить отчет.');
    }
  };

  // Метод получения результатов анкетирования кураторов (только для Админа)
  const handleLoadSurveyResponses = async (surveyId) => {
    try {
      setError('');
      const res = await api.get(`/surveys/${surveyId}/responses`);
      setSurveyResponsesSummary(res.data);
    } catch (err) {
      setError('Не удалось загрузить сводку ответов кураторов.');
    }
  };

  // --- ЭКСПОРТ СВОДНЫХ ОТЧЕТОВ В EXCEL (Раздел 3.1 ТЗ) ---

  const handleExportRatingCSV = () => {
    try {
      let csvContent = "\uFEFF"; // UTF-8 BOM для совместимости с Excel (корректные русские символы)
      csvContent += "Место;Куратор;Прогресс программы (%);Доп. баллы;Суммарный балл;Активное взыскание\n";
      
      ratingList.forEach(r => {
        csvContent += `${r.place};${r.username};${r.completion_percentage}%;${r.additional_points};${r.points};${r.has_violation ? 'Да' : 'Нет'}\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Рейтинг_кураторов_ЗабГУ_${new Date().toLocaleDateString('ru-RU')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Не удалось сформировать отчет.");
    }
  };

  const handleExportSocialPassportCSV = () => {
    if (!students || students.length === 0) {
      alert("Нет данных студентов для формирования паспорта.");
      return;
    }
    try {
      let csvContent = "\uFEFF"; // UTF-8 BOM
      csvContent += "Студент (ФИО);Профсоюз;Категории социального учета;Участие в объединениях;Контакты (Телефон);Адрес проживания;Информация о родителях\n";
      
      students.forEach(s => {
        const fio = `${s.last_name} ${s.first_name} ${s.middle_name || ''}`.trim();
        const union = s.is_union_member ? "Да" : "Нет";
        const cats = s.social_categories.map(c => c.name).join(', ') || "—";
        const orgs = s.organizations.map(o => o.name).join(', ') || "—";
        const phone = s.phone || "—";
        const addr = s.address || "—";
        const parents = s.parent_info || "—";
        
        csvContent += `"${fio}";"${union}";"${cats}";"${orgs}";"${phone}";"${addr}";"${parents}"\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Социальный_паспорт_группы_${groupDetails?.name || 'ЗабГУ'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Не удалось выгрузить сведения социального паспорта.");
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
      setSuccessMsg('Новая анкету успешно опубликована!');
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

  // --- Вспомогательные методы генерации сетки календаря ---
  const handlePrevMonth = () => {
    setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 1));
  };

  const getCalendarGridDays = () => {
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    const firstDay = new Date(year, month, 1);
    let startDayOfWeek = firstDay.getDay() - 1; // Mon = 0, ..., Sun = 6
    if (startDayOfWeek < 0) startDayOfWeek = 6;

    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Пустые ячейки для выравнивания
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    // Дни месяца
    for (let d = 1; d <= totalDays; d++) {
      days.push(d);
    }
    return days;
  };

  const getEventsForDay = (day) => {
    if (!day) return [];
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    return calendar.filter(item => {
      const itemDate = new Date(item.date_time);
      return itemDate.getFullYear() === year && 
             itemDate.getMonth() === month && 
             itemDate.getDate() === day;
    });
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <RefreshCw className="animate-spin h-8 w-8 text-[#2daabd] mr-2" /> Загрузка...
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

  // Фильтруем только АКТИВНЫЕ категории и организации для вывода при создании студента
  const activeSocialCategories = socialCategories.filter(c => c.is_active);
  const activeOrganizations = organizations.filter(o => o.is_active);

  // --- АГРЕГАЦИЯ ДАННЫХ ДЛЯ СТАТИСТИКИ ---
  
  // 1. Статистика куратора за ТЕКУЩИЙ МЕСЯЦ (Август 2026)
  const currentMonthTasks = myTasks.filter(exe => {
    if (!exe.task?.due_date) return false;
    const d = new Date(exe.task.due_date);
    return d.getMonth() === 7 && d.getFullYear() === 2026; // Август - индекс 7
  });
  const monthlyTotal = currentMonthTasks.length;
  const monthlyApproved = currentMonthTasks.filter(exe => exe.status === 'APPROVED').length;
  const monthlyPercentage = monthlyTotal > 0 ? Math.round((monthlyApproved / monthlyTotal) * 100) : 0;

  // 2. Статистика куратора по статусам
  const taskStatusCounts = { APPROVED: 0, PENDING: 0, REVISION: 0, NOT_STARTED: 0 };
  myTasks.forEach(exe => {
    if (taskStatusCounts[exe.status] !== undefined) {
      taskStatusCounts[exe.status] += 1;
    }
  });

  // 3. Статистика администратора по факультетам (количество зарегистрированных групп)
  const facultyGroupCounts = {};
  groups.forEach(g => {
    facultyGroupCounts[g.faculty] = (facultyGroupCounts[g.faculty] || 0) + 1;
  });
  const facultyStatsList = Object.keys(facultyGroupCounts).map(name => ({
    name,
    count: facultyGroupCounts[name]
  }));
  const maxFacultyCount = Math.max(...facultyStatsList.map(f => f.count), 1);

  // 4. Статистика администратора по задачам (глобальный % выполнения кураторами)
  const globalTaskStats = {};
  allExecutions.forEach(exe => {
    const tId = exe.task_id;
    const title = exe.task?.title || 'Без названия';
    if (!globalTaskStats[tId]) {
      globalTaskStats[tId] = { title, total: 0, approved: 0 };
    }
    globalTaskStats[tId].total += 1;
    if (exe.status === 'APPROVED') {
      globalTaskStats[tId].approved += 1;
    }
  });
  const globalTaskStatsList = Object.values(globalTaskStats).map(item => ({
    ...item,
    percentage: Math.round((item.approved / item.total) * 100)
  }));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      
      {/* Шапка (Включает векторный герб ЗабГУ и темно-синий фон #051d2f) */}
      <nav className="bg-[#051d2f] sticky top-0 z-10 px-6 py-4 flex items-center justify-between shadow-md text-white">
        <div className="flex items-center space-x-3.5">
          {/* Официальный Герб ЗабГУ в векторе (Щит с вертикальным посохом и соболем) */}
          <svg viewBox="0 0 100 100" className="h-10 w-10 text-[#2daabd]" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M20,20 L80,20 L80,55 C80,75 50,92 50,92 C50,92 20,75 20,55 Z" strokeWidth="3" />
            <line x1="50" y1="5" x2="50" y2="92" strokeWidth="3" strokeLinecap="round" />
            <path d="M50,15 C38,15 33,5 44,5 C55,5 60,15 50,25 C45,28 42,22 46,18" strokeLinecap="round" />
            <path d="M50,82 C62,82 67,92 56,92 C45,92 40,82 50,72" strokeLinecap="round" />
            <path d="M42,48 C42,40 48,34 52,36 C55,38 54,46 48,50 C45,53 46,60 50,63 C54,66 55,73 52,76" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <div>
            <h1 className="text-lg font-extrabold tracking-wider leading-none">ЗАБГУ</h1>
            <span className="text-[10px] text-slate-300 font-semibold tracking-widest uppercase">Электронная Книжка Куратора</span>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* Интерактивный колокольчик */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-300 hover:text-white focus:outline-none transition-colors cursor-pointer"
            >
              <Bell className="h-6 w-6" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white font-black text-[10px] h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {/* Выпадающий поп-ап */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 py-2 animate-fadeIn max-h-96 overflow-y-auto">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">Уведомления</span>
                  {unreadNotifsCount > 0 && (
                    <button 
                      onClick={handleReadAllNotifications}
                      className="text-xs text-[#2daabd] hover:text-[#208a9a] font-semibold cursor-pointer"
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
                        className={`p-4 text-xs transition-colors cursor-pointer hover:bg-slate-50 ${!notif.is_read ? 'bg-[#2daabd]/10 font-semibold border-l-2 border-[#2daabd]' : ''}`}
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

          <span className="text-sm bg-[#072740] px-3 py-1.5 rounded-lg text-slate-100 font-medium flex items-center border border-slate-700">
            <Shield className="h-4 w-4 mr-1.5 text-[#2daabd]" />
            Логин: <strong className="text-white ml-1">{user?.username}</strong> 
            <span className="ml-1 text-slate-300">({user?.system_role})</span>
          </span>
          <button onClick={onLogout} className="flex items-center text-red-400 hover:text-red-300 font-semibold text-sm transition-colors cursor-pointer">
            <LogOut className="h-4 w-4 mr-1.5" /> Выйти
          </button>
        </div>
      </nav>

      {/* Выбор группы (Синий фон #072740) */}
      {groups.length > 0 && (
        <div className="bg-[#072740] text-white px-6 py-3 flex items-center justify-between shadow-inner border-t border-slate-800">
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold text-slate-200">Выбранная группа:</span>
            <select 
              value={selectedGroupId} 
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="bg-[#051d2f] text-white font-bold px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:ring-1 focus:ring-[#2daabd] cursor-pointer"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name} ({g.faculty})</option>
              ))}
            </select>
          </div>
          <span className="text-xs text-slate-300 font-mono">ID Группы: {selectedGroupId}</span>
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

      {/* Вкладки (Подчеркивание бирюзовым цветом #2daabd) */}
      <div className="max-w-7xl mx-auto w-full px-6 mt-4 flex border-b border-slate-200 space-x-8">
        <button onClick={() => setActiveTab('overview')} className={`pb-4 text-sm font-semibold transition-all border-b-2 cursor-pointer ${activeTab === 'overview' ? 'border-[#2daabd] text-[#2daabd]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Дашборд
        </button>
        <button onClick={() => setActiveTab('students')} className={`pb-4 text-sm font-semibold transition-all border-b-2 cursor-pointer ${activeTab === 'students' ? 'border-[#2daabd] text-[#2daabd]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Социальный паспорт группы
        </button>
        <button onClick={() => setActiveTab('tasks')} className={`pb-4 text-sm font-semibold transition-all border-b-2 cursor-pointer ${activeTab === 'tasks' ? 'border-[#2daabd] text-[#2daabd]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Задачи и отчеты {user?.system_role === 'ADMIN' && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full ml-1 font-bold">Контроль</span>}
        </button>
        <button onClick={() => setActiveTab('rating')} className={`pb-4 text-sm font-semibold transition-all border-b-2 cursor-pointer ${activeTab === 'rating' ? 'border-[#2daabd] text-[#2daabd]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Рейтинг кураторов
        </button>
        <button onClick={() => setActiveTab('surveys')} className={`pb-4 text-sm font-semibold transition-all border-b-2 cursor-pointer ${activeTab === 'surveys' ? 'border-[#2daabd] text-[#2daabd]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Анкеты / Опросы {activeSurveys.length > 0 && <span className="bg-[#2daabd]/10 text-[#2daabd] text-[10px] px-2 py-0.5 rounded-full ml-1">{activeSurveys.length}</span>}
        </button>
        <button onClick={() => setActiveTab('statistics')} className={`pb-4 text-sm font-semibold transition-all border-b-2 cursor-pointer ${activeTab === 'statistics' ? 'border-[#2daabd] text-[#2daabd]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Статистика
        </button>
        {user?.system_role === 'ADMIN' && (
          <button onClick={() => setActiveTab('admin')} className={`pb-4 text-sm font-semibold transition-all border-b-2 cursor-pointer ${activeTab === 'admin' ? 'border-[#2daabd] text-[#2daabd]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            Панель управления (Админ)
          </button>
        )}
      </div>

      {/* Контент */}
      <main className="max-w-7xl mx-auto w-full p-6 flex-grow">
        
        {/* ================= Вкладка 1: ДАШБОРД ================= */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            
            {/* Карточка 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-[#2daabd] flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-[#2daabd]/10 p-2.5 rounded-xl text-[#2daabd]"><Users className="h-6 w-6" /></div>
                  <h2 className="text-lg font-bold text-slate-800">Моя группа</h2>
                </div>
                {groupDetails ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-slate-500 font-semibold">Название</div>
                      <div className="text-xl font-bold text-slate-900">{groupDetails.name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 font-semibold">Факультет</div>
                      <div className="font-semibold text-slate-800">{groupDetails.faculty}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 font-semibold">Количество студентов</div>
                      <div className="text-lg font-bold text-[#2daabd]">{groupDetails.students_count} чел.</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500 text-sm py-8 text-center">Группа не выбрана.</div>
                )}
              </div>
              {groupDetails && (
                <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                  
                  {/* Список кураторов с кнопкой Снять */}
                  <div className="space-y-1.5">
                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider block">Активные кураторы:</span>
                    {groupDetails.curators && groupDetails.curators.length > 0 ? (
                      <div className="space-y-1">
                        {groupDetails.curators.map(c => (
                          <div key={c.id} className="flex items-center justify-between text-sm bg-slate-50 border border-slate-100 px-2.5 py-1 rounded">
                            <span className="font-semibold text-slate-800">{c.username}</span>
                            {user?.system_role === 'ADMIN' && (
                              <button 
                                onClick={() => handleUnassignRole(c.user_id, 'CURATOR')} 
                                className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                                title="Снять куратора с группы"
                              >
                                Снять
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Кураторы не назначены</span>
                    )}
                  </div>

                  {/* Староста */}
                  <div className="flex items-center justify-between text-sm bg-slate-50 border border-slate-100 px-2.5 py-1 rounded">
                    <span className="text-slate-500 font-semibold">Староста:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-800">{groupDetails.starosta?.username || 'Не назначен'}</span>
                      {groupDetails.starosta && user?.system_role === 'ADMIN' && (
                        <button 
                          onClick={() => handleUnassignRole(groupDetails.starosta.user_id, 'STAROSTA')} 
                          className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                        >
                          Снять
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Профорг */}
                  <div className="flex items-center justify-between text-sm bg-slate-50 border border-slate-100 px-2.5 py-1 rounded">
                    <span className="text-slate-500 font-semibold">Профорг:</span>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-800">{groupDetails.proforg?.username || 'Не назначен'}</span>
                      {groupDetails.proforg && user?.system_role === 'ADMIN' && (
                        <button 
                          onClick={() => handleUnassignRole(groupDetails.proforg.user_id, 'PROFORG')} 
                          className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer"
                        >
                          Снять
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              )}
            </div>

            {/* Карточка 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-[#072740] flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600"><Award className="h-6 w-6" /></div>
                  <h2 className="text-lg font-bold text-slate-800">Мой прогресс</h2>
                </div>
                {user?.system_role === 'ADMIN' ? (
                  <div className="text-center py-12 text-slate-500 text-sm bg-slate-50 rounded-xl p-4">
                    Администраторы контролируют и проверяют отчеты во вкладке «Задачи и отчеты».
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
                        <div className="bg-[#2daabd] h-3 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {user?.system_role !== 'ADMIN' && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <span className="text-slate-500 text-sm font-semibold">Текущие баллы:</span>
                  <span className="text-2xl font-black text-emerald-600">{myPointsCalculated} б.</span>
                </div>
              )}
            </div>

            {/* Карточка 3 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-[#2daabd] flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-purple-50 p-2.5 rounded-xl text-purple-600"><Calendar className="h-6 w-6" /></div>
                  <h2 className="text-lg font-bold text-slate-800">Ближайшие события</h2>
                </div>
                <div className="space-y-4 max-h-[300px] overflow-y-auto">
                  {calendar.length > 0 ? (
                    calendar.slice(0, 4).map((item) => (
                      <div 
                        key={item.id} 
                        onClick={() => setSelectedCalItem(item)}
                        className={`p-3 rounded-xl border flex items-start space-x-3 cursor-pointer hover:shadow-sm transition-all ${item.type === 'event' ? 'bg-purple-50/50 border-purple-100' : 'bg-amber-50/50 border-amber-100'}`}
                      >
                        <div className="mt-0.5">
                          {item.type === 'event' ? <Calendar className="h-4 w-4 text-purple-600" /> : <CheckSquare className="h-4 w-4 text-amber-600" />}
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-slate-800 leading-tight">{item.title}</h4>
                          <p className="text-[10px] text-slate-500 mt-1 font-semibold">
                            {new Date(item.date_time).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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

            {/* ИНТЕРАКТИВНАЯ СЕТКА КАЛЕНДАРЯ НА МЕСЯЦ */}
            <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-[#2daabd]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="bg-[#2daabd]/10 p-2.5 rounded-xl text-[#2daabd]"><Calendar className="h-6 w-6" /></div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Интерактивный календарь ЗабГУ</h2>
                    <p className="text-xs text-slate-400">Объединяет мероприятия, собрания и ключевые дедлайны</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button onClick={handlePrevMonth} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"><ChevronLeft className="h-5 w-5 text-slate-600" /></button>
                  <span className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                    {currentCalDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={handleNextMonth} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"><ChevronRight className="h-5 w-5 text-slate-600" /></button>
                </div>
              </div>

              {/* Сетка календаря */}
              <div className="grid grid-cols-7 gap-2">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
                  <div key={day} className="text-center font-bold text-xs text-slate-400 py-1">{day}</div>
                ))}

                {getCalendarGridDays().map((day, idx) => {
                  const dayEvents = getEventsForDay(day);
                  return (
                    <div 
                      key={idx} 
                      className={`min-h-[90px] border border-slate-100 p-2 rounded-xl flex flex-col justify-between transition-all ${
                        day ? 'bg-slate-50/50 hover:bg-slate-50' : 'bg-transparent border-none'
                      }`}
                    >
                      {day ? (
                        <>
                          <span className="text-xs font-bold text-slate-400">{day}</span>
                          <div className="space-y-1 mt-1 flex-grow overflow-hidden">
                            {dayEvents.slice(0, 2).map(evt => (
                              <div 
                                key={evt.id} 
                                onClick={() => setSelectedCalItem(evt)}
                                className={`text-[10px] px-1.5 py-0.5 rounded truncate font-bold cursor-pointer ${
                                  evt.type === 'event' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
                                }`}
                                title={evt.title}
                              >
                                {evt.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <span className="text-[9px] text-slate-400 block text-center font-semibold">+{dayEvents.length - 2} еще</span>
                            )}
                          </div>
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Блок архивной истории */}
            {groupDetails && (
              <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-[#072740] animate-fadeIn">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-[#072740]/10 p-2.5 rounded-xl text-[#072740]"><Clock className="h-6 w-6" /></div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">История назначений ответственных лиц группы</h2>
                    <p className="text-xs text-slate-400">Архив изменений кураторов, старост и профоргов</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3 pl-2">Пользователь</th>
                        <th className="pb-3">Роль в группе</th>
                        <th className="pb-3 text-center">Период работы</th>
                        <th className="pb-3 text-center">Протокол избрания (для профоргов)</th>
                        <th className="pb-3 text-right">Статус полномочий</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignmentHistory.length > 0 ? (
                        assignmentHistory.map(item => {
                          const dateAssigned = new Date(item.assigned_at).toLocaleDateString('ru-RU');
                          const dateUnassigned = item.unassigned_at 
                            ? new Date(item.unassigned_at).toLocaleDateString('ru-RU') 
                            : 'по наст. время';
                          const isActive = !item.unassigned_at;

                          return (
                            <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                              <td className="py-3 font-bold text-slate-800 pl-2">{item.username}</td>
                              <td className="py-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.role_code === 'CURATOR' ? 'bg-[#2daabd]/10 text-[#2daabd]' :
                                  item.role_code === 'STAROSTA' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                                }`}>
                                  {item.role_code === 'CURATOR' ? 'Куратор' :
                                   item.role_code === 'STAROSTA' ? 'Староста' : 'Профорг'}
                                </span>
                              </td>
                              <td className="py-3 text-center font-semibold text-slate-700">
                                {dateAssigned} — {dateUnassigned}
                              </td>
                              <td className="py-3 text-center text-slate-500 font-semibold">
                                {item.role_code === 'PROFORG' && item.protocol_number ? (
                                  <span>Протокол № {item.protocol_number} от {item.protocol_date ? new Date(item.protocol_date).toLocaleDateString('ru-RU') : '—'}</span>
                                ) : (
                                  <span className="text-slate-300">—</span>
                                )}
                              </td>
                              <td className="py-3 text-right pr-2">
                                {isActive ? (
                                  <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-full">Действует ✓</span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full">Завершены</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-slate-400 font-medium">История назначений этой группы пуста.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

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
                  <input type="text" placeholder="Быстрый поиск по ФИО..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#2daabd] text-slate-800" />
                </div>
              </div>

              {/* Автоматическая сводная статистика профсоюзного учета (Раздел 12 ТЗ) */}
              {students.length > 0 && (
                <div className="bg-cyan-50/50 p-4 rounded-2xl border border-cyan-100 flex items-center justify-between text-xs font-bold text-slate-700 animate-fadeIn">
                  <span className="flex items-center"><Briefcase className="h-4 w-4 mr-2 text-zab-teal" /> Профсоюзный учет группы</span>
                  <span className="text-zab-teal text-sm">
                    Членов профсоюза: {students.filter(s => s.is_union_member).length} из {students.length} студентов ({Math.round((students.filter(s => s.is_union_member).length / students.length) * 100)}%)
                  </span>
                </div>
              )}

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
                        <tr 
                          key={s.id} 
                          onClick={() => handleOpenStudentCard(s)}
                          className="border-b border-slate-100 hover:bg-slate-50/50 transition-all cursor-pointer"
                        >
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
                                <span key={o.id} className="bg-cyan-50 text-[#2daabd] text-[10px] font-bold px-2 py-0.5 rounded flex items-center"><Briefcase className="h-2.5 w-2.5 mr-0.5" /> {o.name}</span>
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

            {/* Карточка добавления студента */}
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 h-fit">
              <div className="flex items-center space-x-2.5 mb-6">
                <UserPlus className="h-5 w-5 text-[#2daabd]" />
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
                  <input type="checkbox" id="is_union" checked={newStudent.is_union_member} onChange={(e) => setNewStudent({...newStudent, is_union_member: e.target.checked})} className="rounded text-[#2daabd] h-4 w-4" />
                  <label htmlFor="is_union" className="text-sm font-semibold text-slate-700">Состоит в профсоюзе</label>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Социальные категории</label>
                  <div className="max-h-24 overflow-y-auto border border-slate-200 bg-white p-2.5 rounded-lg space-y-1.5">
                    {activeSocialCategories.length > 0 ? activeSocialCategories.map(cat => (
                      <div key={cat.id} className="flex items-center space-x-2 text-xs">
                        <input type="checkbox" checked={newStudent.social_category_ids.includes(cat.id)} onChange={() => handleCheckboxChange(cat.id, 'category')} className="rounded h-3 w-3" />
                        <span className="text-slate-700 font-semibold">{cat.name}</span>
                      </div>
                    )) : <span className="text-xs text-slate-400">Нет доступных категорий</span>}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-2">Студенческие организации</label>
                  <div className="max-h-24 overflow-y-auto border border-slate-200 bg-white p-2.5 rounded-lg space-y-1.5">
                    {activeOrganizations.length > 0 ? activeOrganizations.map(org => (
                      <div key={org.id} className="flex items-center space-x-2 text-xs">
                        <input type="checkbox" checked={newStudent.organization_ids.includes(org.id)} onChange={() => handleCheckboxChange(org.id, 'org')} className="rounded h-3 w-3 text-[#2daabd] focus:ring-[#2daabd]" />
                        <span className="text-slate-700 font-semibold">{org.name}</span>
                      </div>
                    )) : <span className="text-xs text-slate-400">Нет доступных организаций</span>}
                  </div>
                </div>
                <button type="submit" className="w-full py-2.5 bg-[#2daabd] hover:bg-[#208a9a] text-white font-semibold rounded-lg text-sm transition-all shadow-md mt-4 cursor-pointer">
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
                            <div className="mt-3 text-xs bg-cyan-50 border border-cyan-100 p-2 rounded-lg text-[#2daabd] inline-block">
                              Фотоподтверждение: <a href={exe.photo_url} target="_blank" rel="noreferrer" className="underline font-bold">{exe.photo_url}</a>
                            </div>
                          )}
                          {exe.admin_comment && (
                            <p className="text-xs text-red-500 font-semibold mt-2">Комментарий: {exe.admin_comment}</p>
                          )}
                        </div>
                        {exe.status === 'PENDING' && (
                          <div className="border-t md:border-t-0 pt-4 md:pt-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            <input type="text" placeholder="Замечание..." value={reviewComment[exe.id] || ''} onChange={(e) => setReviewComment({...reviewComment, [exe.id]: e.target.value})} className="px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#2daabd] bg-white text-slate-800" />
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
                            {exe.task?.requirements && <span className="bg-cyan-50 text-[#2daabd] px-2 py-1 rounded font-semibold">Требования: {exe.task.requirements}</span>}
                            {exe.task?.confirmation_requirements && <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded font-semibold">Проверка: {exe.task.confirmation_requirements}</span>}
                          </div>
                          {exe.admin_comment && <p className="text-sm text-red-500 font-bold mt-2">Замечание: {exe.admin_comment}</p>}
                        </div>
                        {(exe.status === 'NOT_STARTED' || exe.status === 'REVISION') && (
                          <button onClick={() => handleOpenTaskSubmit(exe)} className="px-5 py-2.5 bg-[#2daabd] hover:bg-[#208a9a] text-white text-sm font-semibold rounded-lg shadow cursor-pointer">
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
                      <tr key={r.curator_id} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-all ${user?.id === r.curator_id ? 'bg-cyan-50/30 font-semibold' : ''}`}>
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
                              <div className="bg-[#2daabd] h-1.5 rounded-full" style={{ width: `${r.completion_percentage}%` }}></div>
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
                <button onClick={() => setSelectedSurvey(null)} className="mb-4 text-sm font-bold text-[#2daabd] hover:underline flex items-center cursor-pointer">
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
                        <input required type="text" onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2daabd] text-slate-800" />
                      )}
                      {q.type === 'long_text' && (
                        <textarea required rows="3" onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#2daabd] text-slate-800" />
                      )}
                      {q.type === 'single_choice' && (
                        <div className="space-y-2.5">
                          {q.options?.split(';').map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center space-x-3 text-sm font-semibold">
                              <input required name={`q_${q.id}`} type="radio" value={opt.trim()} onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="h-4 w-4 text-[#2daabd] focus:ring-[#2daabd]" />
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
                                }} className="rounded h-4 w-4 text-[#2daabd] focus:ring-[#2daabd]" />
                                <span className="text-slate-700">{trimmedOpt}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {q.type === 'dropdown' && (
                        <select required onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-[#2daabd]">
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
                              <input required type="radio" name={`scale_${q.id}`} value={num} onChange={(e) => handleAnswerChange(q.id, e.target.value)} className="h-4 w-4 text-[#2daabd] focus:ring-[#2daabd]" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <button type="submit" className="px-6 py-3 bg-[#2daabd] hover:bg-[#208a9a] text-white font-bold rounded-xl shadow cursor-pointer">
                    Отправить ответы на проверку
                  </button>
                </form>
              </div>
            ) : surveyResponsesSummary ? (
              // Сводка результатов анкетирования кураторов для Администратора (Раздел 28 ТЗ)
              <div className="space-y-6">
                <button 
                  onClick={() => setSurveyResponsesSummary(null)} 
                  className="text-sm font-bold text-[#2daabd] hover:underline flex items-center cursor-pointer"
                >
                  ← Назад к списку опросов
                </button>
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-bold text-slate-800">Результаты анкетирования кураторов</h2>
                  <p className="text-sm text-[#2daabd] font-bold mt-1">Опрос: {surveyResponsesSummary.survey_title}</p>
                  <p className="text-xs text-slate-400 mt-1">Всего вопросов: {surveyResponsesSummary.total_questions} • Сдано анкет: {surveyResponsesSummary.submissions_count}</p>
                </div>

                <div className="space-y-4">
                  {surveyResponsesSummary.submissions.length > 0 ? (
                    surveyResponsesSummary.submissions.map((sub, sIdx) => (
                      <div key={sIdx} className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-3">
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                          <span className="font-extrabold text-sm text-[#051d2f]">Куратор: {sub.curator_username}</span>
                          <span className="text-[10px] text-slate-400 font-semibold">Дата заполнения: {new Date(sub.submitted_at).toLocaleString('ru-RU')}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {sub.answers.map((ans, aIdx) => (
                            <div key={aIdx} className="bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                              <span className="text-[10px] font-bold text-slate-400 block">{ans.question_text}</span>
                              <p className="text-xs font-bold text-slate-800 leading-relaxed">{ans.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-12">Ни один куратор еще не прошел эту анкету.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center space-x-3 mb-6">
                  <FileText className="h-6 w-6 text-[#2daabd]" />
                  <h2 className="text-lg font-bold text-slate-800">Активные анкеты и опросы кураторов</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeSurveys.length > 0 ? (
                    activeSurveys.map(survey => (
                      <div key={survey.id} className="p-6 border border-slate-150 rounded-2xl bg-white shadow-sm flex flex-col justify-between border-t-4 border-t-[#2daabd]">
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
                          
                          <div className="flex space-x-2">
                            {user?.system_role === 'ADMIN' && (
                              <button 
                                onClick={() => handleLoadSurveyResponses(survey.id)}
                                className="px-3 py-2 bg-[#072740] hover:bg-[#051d2f] text-slate-100 font-bold text-xs rounded-lg cursor-pointer"
                              >
                                Результаты ответов
                              </button>
                            )}
                            <button onClick={() => setSelectedSurvey(survey)} className="px-4 py-2 bg-[#2daabd] hover:bg-[#208a9a] text-white font-semibold text-xs rounded-lg cursor-pointer">
                              Пройти опрос
                            </button>
                          </div>
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

        {/* ================= Вкладка 5.1: СТАТИСТИКА (С КНОПКАМИ ЭКСПОРТА ОТЧЕТОВ - Разделы 3.1 и 36 ТЗ) ================= */}
        {activeTab === 'statistics' && (
          <div className="space-y-6 animate-fadeIn">
            
            {user?.system_role === 'ADMIN' && (
              // Панель формирования сводных отчетов в CSV / Excel
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-extrabold text-slate-800 text-sm flex items-center">
                    <FileText className="h-4.5 w-4.5 text-zab-teal mr-2" /> Сводные отчеты и выгрузки (Раздел 3.1)
                  </h3>
                  <p className="text-xs text-slate-400">Формирование официальных отчетных документов для деканата и учебной части в формате CSV / Excel</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={handleExportRatingCSV}
                    className="px-4 py-2.5 bg-[#2daabd] hover:bg-[#208a9a] text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
                  >
                    Выгрузить рейтинг кураторов
                  </button>
                  {students.length > 0 && (
                    <button 
                      onClick={handleExportSocialPassportCSV}
                      className="px-4 py-2.5 bg-[#072740] hover:bg-[#051d2f] text-slate-100 font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
                    >
                      Выгрузить социальный паспорт ({groupDetails?.name})
                    </button>
                  )}
                </div>
              </div>
            )}

            {user?.system_role === 'ADMIN' ? (
              // Сводная статистика для Администратора
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Факультеты */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-[#072740] space-y-4">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center">
                    <Users className="h-5 w-5 mr-2 text-zab-teal" /> Группы по факультетам
                  </h3>
                  <div className="space-y-4">
                    {facultyStatsList.length > 0 ? (
                      facultyStatsList.map(item => (
                        <div key={item.name} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-slate-600">
                            <span>{item.name}</span>
                            <span>{item.count} групп</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5">
                            <div 
                              className="bg-[#2daabd] h-2.5 rounded-full transition-all duration-500" 
                              style={{ width: `${(item.count / maxFacultyCount) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 py-6 text-center">Группы не созданы.</p>
                    )}
                  </div>
                </div>

                {/* 2. Общая успеваемость задач кураторов */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-[#2daabd] lg:col-span-2 space-y-4">
                  <h3 className="font-bold text-slate-800 text-lg flex items-center">
                    <CheckSquare className="h-5 w-5 mr-2 text-emerald-600" /> Выполнение плановых задач в системе
                  </h3>
                  <div className="space-y-4 overflow-y-auto max-h-[350px] pr-2">
                    {globalTaskStatsList.length > 0 ? (
                      globalTaskStatsList.map(task => (
                        <div key={task.title} className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                            <span className="truncate max-w-md">{task.title}</span>
                            <span className="text-[#2daabd]">{task.percentage}% ({task.approved} из {task.total} вып.)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div 
                              className="bg-[#2daabd] h-2 rounded-full transition-all duration-500" 
                              style={{ width: `${task.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 py-12 text-center">Нет назначенных кураторам задач.</p>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              // Персональная статистика для Куратора
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Месячный план */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-[#2daabd] flex flex-col justify-between">
                  <div>
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wider block mb-2">План на месяц (Август)</span>
                    <h4 className="text-3xl font-black text-slate-800">{monthlyApproved} / {monthlyTotal}</h4>
                    <p className="text-xs text-slate-500 mt-2 font-semibold">задач успешно выполнено в текущем месяце</p>
                  </div>
                  <div className="mt-6">
                    <div className="flex justify-between text-xs font-bold mb-1 text-slate-700">
                      <span>Успеваемость</span>
                      <span>{monthlyPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-[#2daabd] h-2 rounded-full" style={{ width: `${monthlyPercentage}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Семестровый план */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-[#072740] flex flex-col justify-between">
                  <div>
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wider block mb-2">Семестровый план</span>
                    <h4 className="text-3xl font-black text-slate-800">{approvedMyTasksCount} / {totalMyTasksCount}</h4>
                    <p className="text-xs text-slate-500 mt-2 font-semibold">всех плановых задач за текущий семестр</p>
                  </div>
                  <div className="mt-6">
                    <div className="flex justify-between text-xs font-bold mb-1 text-slate-700">
                      <span>Выполнение планов</span>
                      <span>{completionPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-[#072740] h-2 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Распределение статусов задач */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-[#2daabd] space-y-3">
                  <span className="text-slate-400 font-bold text-xs uppercase tracking-wider block mb-1">Статусы планов</span>
                  <div className="space-y-1.5 text-xs font-bold text-slate-700">
                    <div className="flex justify-between bg-emerald-50 text-emerald-800 p-2 rounded-lg">
                      <span>Утверждено:</span>
                      <span>{taskStatusCounts.APPROVED}</span>
                    </div>
                    <div className="flex justify-between bg-amber-50 text-amber-800 p-2 rounded-lg">
                      <span>На проверке:</span>
                      <span>{taskStatusCounts.PENDING}</span>
                    </div>
                    <div className="flex justify-between bg-red-50 text-red-800 p-2 rounded-lg">
                      <span>На доработке:</span>
                      <span>{taskStatusCounts.REVISION}</span>
                    </div>
                    <div className="flex justify-between bg-slate-100 text-slate-600 p-2 rounded-lg">
                      <span>Не начато:</span>
                      <span>{taskStatusCounts.NOT_STARTED}</span>
                    </div>
                  </div>
                </div>

                {/* Лидерство в рейтинге */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-[#072740] flex flex-col justify-between">
                  <div>
                    <span className="text-slate-400 font-bold text-xs uppercase tracking-wider block mb-2">Позиция в рейтинге</span>
                    <h4 className="text-3xl font-black text-slate-800">
                      {currentCuratorRating ? `# ${currentCuratorRating.place}` : '—'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-2 font-semibold">место среди всех кураторов университета</p>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-500">Доп. баллы / Премии:</span>
                    <span className={currentCuratorRating?.additional_points >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                      {currentCuratorRating?.additional_points || 0} б.
                    </span>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* ================= Вкладка 6: ПАНЕЛЬ УПРАВЛЕНИЯ (ТОЛЬКО АДМИН) ================= */}
        {activeTab === 'admin' && user?.system_role === 'ADMIN' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* ИНТЕРАКТИВНЫЙ КОНСТРУКТОР АНКЕТ */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-[#2daabd]">
              <div className="flex items-center space-x-2.5 mb-6 border-b border-slate-100 pb-4">
                <FileText className="h-5 w-5 text-purple-600" />
                <h3 className="font-bold text-slate-800">Конструктор опросов (Собрать анкету)</h3>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Название анкеты</label>
                      <input required type="text" placeholder="например, Качество работы с первокурсниками" value={newSurveyForm.title} onChange={(e) => setNewSurveyForm({...newSurveyForm, title: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:ring-[#2daabd]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Описание опроса</label>
                      <input type="text" placeholder="краткое описание для кураторов" value={newSurveyForm.description} onChange={(e) => setNewSurveyForm({...newSurveyForm, description: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:ring-[#2daabd]" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Период прохождения (Дедлайн)</label>
                      <input required type="datetime-local" value={newSurveyForm.expires_at} onChange={(e) => setNewSurveyForm({...newSurveyForm, expires_at: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:ring-[#2daabd]" />
                    </div>
                    <div className="flex items-center space-x-3 pt-4">
                      <input type="checkbox" id="survey_mandatory" checked={newSurveyForm.is_mandatory} onChange={(e) => setNewSurveyForm({...newSurveyForm, is_mandatory: e.target.checked})} className="rounded h-4 w-4 text-[#2daabd] focus:ring-[#2daabd]" />
                      <label htmlFor="survey_mandatory" className="text-sm font-semibold text-slate-700">Обязательное прохождение</label>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    <h4 className="font-bold text-slate-700 mb-4 flex items-center">
                      <HelpCircle className="h-4.5 w-4.5 text-[#2daabd] mr-2" /> Вопросы в анкету ({surveyQuestions.length})
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
                            <button onClick={() => handleRemoveQuestionFromDraft(idx)} className="text-red-500 hover:text-red-700 font-bold text-lg cursor-pointer">×</button>
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
                      <label className="block text-xs font-bold text-slate-600 mb-1">Тип ответа</label>
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

                    <button type="submit" className="w-full py-2 bg-[#2daabd] text-white font-bold rounded-lg text-xs cursor-pointer">
                      + Записать вопрос в черновик
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* БЛОК САНКЦИЙ И ДИСЦИПЛИНАРНЫХ МЕР */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-red-500">
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

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-red-600">
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
                      <button type="button" onClick={() => handleRemoveViolation(disciplinaryMark.curator_id)} className="px-4 py-2.5 bg-[#051d2f] text-white text-sm font-semibold rounded-lg cursor-pointer">Снять</button>
                    )}
                  </div>
                </form>
              </div>

              {/* УПРАВЛЕНИЕ СПРАВОЧНИКАМИ С КНОПКАМИ И ИЗМЕНЕНИЕМ СТАТУСА */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6 border-t-4 border-t-[#2daabd]">
                
                {/* Социальные категории */}
                <div>
                  <div className="flex items-center space-x-2.5 mb-4">
                    <Tag className="h-5 w-5 text-amber-500" />
                    <h3 className="font-bold text-slate-800 text-sm">Соц. категории</h3>
                  </div>
                  <form onSubmit={handleCreateCategory} className="flex gap-2 mb-4">
                    <input required type="text" placeholder="Новая категория..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="flex-grow px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white focus:ring-[#2daabd]" />
                    <button type="submit" className="px-3 py-1.5 bg-[#2daabd] hover:bg-[#208a9a] text-white text-xs font-bold rounded-lg cursor-pointer">Создать</button>
                  </form>

                  {/* Список категорий с управлением */}
                  <div className="space-y-1.5 max-h-32 overflow-y-auto border border-slate-100 p-2 rounded-lg bg-slate-50/50">
                    {socialCategories.map(cat => (
                      <div key={cat.id} className="flex items-center justify-between text-xs bg-white border border-slate-100 p-1.5 rounded">
                        <span className={`font-semibold ${cat.is_active ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{cat.name}</span>
                        <div className="flex items-center space-x-2">
                          <button 
                            type="button"
                            onClick={() => handleToggleCategoryActive(cat.id, cat.name, !cat.is_active)}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${cat.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                          >
                            {cat.is_active ? 'Выкл' : 'Вкл'}
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteCategory(cat.id)}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Студенческие организации */}
                <div className="border-t border-slate-100 pt-6">
                  <div className="flex items-center space-x-2.5 mb-4">
                    <Briefcase className="h-5 w-5 text-[#2daabd]" />
                    <h3 className="font-bold text-slate-800 text-sm">Студ. организации</h3>
                  </div>
                  <form onSubmit={handleCreateOrganization} className="flex gap-2 mb-4">
                    <input required type="text" placeholder="Новая организация..." value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} className="flex-grow px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white focus:ring-[#2daabd]" />
                    <button type="submit" className="px-3 py-1.5 bg-[#2daabd] hover:bg-[#208a9a] text-white text-xs font-bold rounded-lg cursor-pointer">Создать</button>
                  </form>

                  {/* Список организаций с управлением */}
                  <div className="space-y-1.5 max-h-32 overflow-y-auto border border-slate-100 p-2 rounded-lg bg-slate-50/50">
                    {organizations.map(org => (
                      <div key={org.id} className="flex items-center justify-between text-xs bg-white border border-slate-100 p-1.5 rounded">
                        <span className={`font-semibold ${org.is_active ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{org.name}</span>
                        <div className="flex items-center space-x-2">
                          <button 
                            type="button"
                            onClick={() => handleToggleOrgActive(org.id, org.name, !org.is_active)}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${org.is_active ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
                          >
                            {org.is_active ? 'Выкл' : 'Вкл'}
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteOrg(org.id)}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Форма 4: Новая задача */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-purple-600">
              <div className="flex items-center space-x-2.5 mb-6">
                <CheckSquare className="h-5 w-5 text-purple-600" />
                <h3 className="font-bold text-slate-800">Создать новую задачу для кураторов</h3>
              </div>
              <form onSubmit={handleCreateTask} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Колонка 1: Основное */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">1. Параметры задачи</h4>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Заголовок</label>
                    <input required type="text" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:ring-[#2daabd]" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Описание</label>
                    <textarea rows="3" value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:ring-[#2daabd]" />
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

                {/* Колонка 2: Требования и сроки */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">2. Условия выполнения</h4>
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
                </div>

                {/* Колонка 3: Настройки таргетинга */}
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-2">3. Таргетинг и запуск</h4>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">Кому назначить?</label>
                    <select 
                      value={newTask.target_type} 
                      onChange={(e) => setNewTask({...newTask, target_type: e.target.value})} 
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:ring-[#2daabd]"
                    >
                      <option value="all">Всем кураторам (общее)</option>
                      <option value="course">Кураторам конкретного курса</option>
                      <option value="faculty">Определенному факультету</option>
                      <option value="group">Выбранным группам (вручную)</option>
                    </select>
                  </div>

                  {newTask.target_type === 'course' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Выберите курс</label>
                      <select 
                        value={newTask.target_course} 
                        onChange={(e) => setNewTask({...newTask, target_course: parseInt(e.target.value)})} 
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white"
                      >
                        {[1, 2, 3, 4, 5, 6].map(num => (
                          <option key={num} value={num}>{num} курс</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {newTask.target_type === 'faculty' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Выберите или введите факультет</label>
                      <select 
                        value={newTask.target_faculty} 
                        onChange={(e) => setNewTask({...newTask, target_faculty: e.target.value})} 
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white mb-2"
                      >
                        <option value="">-- Выберите факультет --</option>
                        {[...new Set(groups.map(g => g.faculty))].map(fac => (
                          <option key={fac} value={fac}>{fac}</option>
                        ))}
                      </select>
                      <input 
                        type="text" 
                        placeholder="Или напишите факультет вручную" 
                        value={newTask.target_faculty} 
                        onChange={(e) => setNewTask({...newTask, target_faculty: e.target.value})} 
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-800 focus:ring-[#2daabd]"
                      />
                    </div>
                  )}

                  {newTask.target_type === 'group' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Выберите целевые группы</label>
                      <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2.5 bg-white space-y-1.5">
                        {groups.map(g => {
                          const isSelected = newTask.target_group_ids.includes(g.id);
                          return (
                            <label key={g.id} className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50 p-1 rounded">
                              <input 
                                type="checkbox" 
                                checked={isSelected} 
                                onChange={() => {
                                  if (isSelected) {
                                    setNewTask({...newTask, target_group_ids: newTask.target_group_ids.filter(id => id !== g.id)});
                                  } else {
                                    setNewTask({...newTask, target_group_ids: [...newTask.target_group_ids, g.id]});
                                  }
                                }} 
                                className="rounded h-3 w-3 text-[#2daabd] focus:ring-[#2daabd]"
                              />
                              <span>{g.name} ({g.faculty})</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <button type="submit" className="w-full py-3 bg-[#2daabd] hover:bg-[#208a9a] text-white font-bold rounded-lg text-sm transition-all shadow-lg mt-4 cursor-pointer">
                    Опубликовать задачу
                  </button>
                </div>

              </form>
            </div>

            {/* Панель создания групп и ролей */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-[#2daabd]">
                <div className="flex items-center space-x-2.5 mb-6">
                  <PlusCircle className="h-5 w-5 text-[#2daabd]" />
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
                  <button type="submit" className="w-full py-2.5 bg-[#2daabd] text-white font-semibold rounded-lg text-sm transition-all cursor-pointer">Создать группу</button>
                </form>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-emerald-600">
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

            </div>

          </div>
        )}

      </main>

      {/* МОДАЛЬНОЕ ОКНО ДЕТАЛЕЙ СОБЫТИЯ */}
      {selectedCalItem && (
        <div className="fixed inset-0 z-50 bg-[#051d2f]/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-100 shadow-xl border-t-8 border-t-[#2daabd] animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                selectedCalItem.type === 'event' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {selectedCalItem.type === 'event' ? 'Событие / Мероприятие' : 'Дедлайн задачи'}
              </span>
              <button onClick={() => setSelectedCalItem(null)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">×</button>
            </div>
            
            <div className="py-4 space-y-4">
              <h3 className="text-xl font-bold text-slate-800 leading-tight">{selectedCalItem.title}</h3>
              {selectedCalItem.location && (
                <p className="text-xs text-slate-500 font-semibold flex items-center">
                  <BookOpen className="h-4 w-4 mr-1 text-[#2daabd]" /> Место: <strong className="text-slate-700 ml-1">{selectedCalItem.location}</strong>
                </p>
              )}
              <p className="text-xs text-slate-500 font-semibold flex items-center">
                <Clock className="h-4 w-4 mr-1 text-[#2daabd]" /> Время: <strong className="text-slate-700 ml-1">
                  {new Date(selectedCalItem.date_time).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </strong>
              </p>
              {selectedCalItem.is_mandatory && (
                <div className="bg-red-50 text-red-600 text-xs font-bold p-2.5 rounded-lg flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" /> Обязательно к посещению куратором
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
              {/* Связь события и задачи */}
              {selectedCalItem.type === 'task_deadline' && (
                <button 
                  onClick={() => {
                    setSelectedCalItem(null);
                    setActiveTab('tasks');
                  }}
                  className="px-4 py-2 bg-[#2daabd] hover:bg-[#208a9a] text-white font-bold text-xs rounded-lg flex items-center shadow cursor-pointer"
                >
                  <CheckSquare className="h-3.5 w-3.5 mr-1" /> Перейти к выполнению задачи
                </button>
              )}
              <button 
                onClick={() => setSelectedCalItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО: ИНТЕРАКТИВНАЯ КАРТОЧКА СТУДЕНТА (Социальный паспорт) */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-[#051d2f]/70 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <form 
            onSubmit={handleSaveStudentCard}
            className="bg-white rounded-3xl p-6 max-w-4xl w-full border border-slate-100 shadow-2xl border-t-8 border-t-[#2daabd] animate-fadeIn grid grid-cols-1 md:grid-cols-3 gap-6 my-8"
          >
            
            {/* Левая колонка: Профиль и Цифровой QR-паспорт */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 flex flex-col items-center justify-between text-center space-y-4">
              <div className="space-y-2">
                <div className="h-16 w-16 bg-[#2daabd]/10 text-[#2daabd] rounded-full flex items-center justify-center mx-auto text-xl font-black">
                  {editStudentForm.last_name[0] || ''}{editStudentForm.first_name[0] || ''}
                </div>
                <h3 className="text-lg font-black text-slate-800 leading-tight">
                  {editStudentForm.last_name} <br /> {editStudentForm.first_name} {editStudentForm.middle_name}
                </h3>
                <span className="inline-block bg-[#072740] text-slate-100 text-[10px] font-bold px-2.5 py-1 rounded-full">
                  Группа {groupDetails?.name} • {groupDetails?.course} курс
                </span>
              </div>

              {/* QR-код верификации */}
              <div className="space-y-2 w-full">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 inline-block shadow-inner">
                  <svg viewBox="0 0 100 100" className="h-28 w-28 text-[#051d2f]" fill="none" stroke="currentColor" strokeWidth="3">
                    <rect x="5" y="5" width="25" height="25" rx="3" strokeWidth="5" />
                    <rect x="11" y="11" width="13" height="13" rx="1" fill="currentColor" />
                    <rect x="70" y="5" width="25" height="25" rx="3" strokeWidth="5" />
                    <rect x="76" y="11" width="13" height="13" rx="1" fill="currentColor" />
                    <rect x="5" y="70" width="25" height="25" rx="3" strokeWidth="5" />
                    <rect x="11" y="76" width="13" height="13" rx="1" fill="currentColor" />
                    <path d="M42,45 C42,39 48,35 52,37 C54,39 53,44 48,47 C45,49 46,54 50,56 C53,58 54,63 52,65" strokeWidth="3" strokeLinecap="round" />
                    <line x1="45" y1="10" x2="55" y2="10" strokeWidth="4" />
                    <line x1="45" y1="20" x2="45" y2="30" strokeWidth="4" />
                    <line x1="15" y1="45" x2="25" y2="45" strokeWidth="4" />
                    <line x1="30" y1="55" x2="30" y2="65" strokeWidth="4" />
                    <line x1="75" y1="45" x2="85" y2="45" strokeWidth="4" />
                    <line x1="75" y1="55" x2="75" y2="65" strokeWidth="4" />
                    <line x1="45" y1="80" x2="55" y2="80" strokeWidth="4" />
                    <line x1="60" y1="75" x2="60" y2="85" strokeWidth="4" />
                  </svg>
                </div>
                <span className="text-[9px] font-mono text-slate-400 block tracking-wider uppercase">
                  Токен: {selectedStudent.qr_token.substring(0, 13)}...
                </span>
              </div>
            </div>

            {/* Средняя колонка: Редактирование ФИО и сведения социального паспорта */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Основные сведения</h4>
              
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Фамилия</label>
                  <input required type="text" value={editStudentForm.last_name} onChange={(e) => setEditStudentForm({...editStudentForm, last_name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 focus:ring-1 focus:ring-[#2daabd]" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Имя</label>
                  <input required type="text" value={editStudentForm.first_name} onChange={(e) => setEditStudentForm({...editStudentForm, first_name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 focus:ring-1 focus:ring-[#2daabd]" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Отчество</label>
                  <input type="text" value={editStudentForm.middle_name} onChange={(e) => setEditStudentForm({...editStudentForm, middle_name: e.target.value})} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 focus:ring-1 focus:ring-[#2daabd]" />
                </div>

                <div className="flex items-center space-x-2.5 py-1.5 border-t border-b border-slate-100">
                  <input type="checkbox" id="edit_is_union" checked={editStudentForm.is_union_member} onChange={(e) => setEditStudentForm({...editStudentForm, is_union_member: e.target.checked})} className="rounded h-4 w-4 text-[#2daabd] focus:ring-[#2daabd]" />
                  <label htmlFor="edit_is_union" className="font-bold text-slate-700 cursor-pointer">Состоит в профсоюзе</label>
                </div>

                {/* Дополнительные поля социального паспорта */}
                <div className="space-y-2 pt-2">
                  <h5 className="font-bold text-slate-500 text-[10px] uppercase">Дополнительно</h5>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-0.5">Телефон</label>
                    <input type="text" value={editStudentForm.phone} onChange={(e) => setEditStudentForm({...editStudentForm, phone: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-0.5">Адрес проживания</label>
                    <input type="text" value={editStudentForm.address} onChange={(e) => setEditStudentForm({...editStudentForm, address: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white" />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-600 mb-0.5">Сведения о родителях</label>
                    <input type="text" value={editStudentForm.parent_info} onChange={(e) => setEditStudentForm({...editStudentForm, parent_info: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 bg-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Правая колонка: Выбор категорий, организаций и действия */}
            <div className="flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">Категории и Участие</h4>
                
                {/* Social Categories */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">Социальные категории</label>
                  <div className="max-h-24 overflow-y-auto border border-slate-200 bg-slate-50 p-2 rounded-lg space-y-1">
                    {socialCategories.map(cat => (
                      <label key={cat.id} className="flex items-center space-x-2 text-[11px] font-semibold text-slate-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={editStudentForm.social_category_ids.includes(cat.id)} 
                          onChange={() => handleCardCheckboxChange(cat.id, 'category')} 
                          className="rounded h-3 w-3 text-[#2daabd] focus:ring-[#2daabd]" 
                        />
                        <span className={cat.is_active ? '' : 'text-slate-400 line-through'}>{cat.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Студенческие организации */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600">Студенческие организации</label>
                  <div className="max-h-24 overflow-y-auto border border-slate-200 bg-slate-50 p-2 rounded-lg space-y-1">
                    {organizations.map(org => (
                      <label key={org.id} className="flex items-center space-x-2 text-[11px] font-semibold text-slate-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={editStudentForm.organization_ids.includes(org.id)} 
                          onChange={() => handleCardCheckboxChange(org.id, 'org')} 
                          className="rounded h-3 w-3 text-[#2daabd] focus:ring-[#2daabd]" 
                        />
                        <span className={org.is_active ? '' : 'text-slate-400 line-through'}>{org.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Кнопки сохранения изменений */}
              <div className="pt-4 border-t border-slate-100 flex flex-col space-y-2">
                <button 
                  type="submit"
                  className="w-full py-2.5 bg-[#2daabd] hover:bg-[#208a9a] text-white font-bold text-xs rounded-xl shadow cursor-pointer text-center"
                >
                  Сохранить изменения
                </button>
                <button 
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer text-center"
                >
                  Закрыть без сохранения
                </button>
              </div>
            </div>

          </form>
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО: ЗАГРУЗКА И ОТПРАВКА ОТЧЕТА С ФОТОПОДТВЕРЖДЕНИЕМ */}
      {submittingTaskExe && (
        <div className="fixed inset-0 z-50 bg-[#051d2f]/70 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <form 
            onSubmit={handleConfirmAndSubmitReport}
            className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-100 shadow-2xl border-t-8 border-t-[#2daabd] animate-fadeIn space-y-5 my-8"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">Отправить фотоотчет по задаче</h3>
              <button 
                type="button" 
                onClick={() => setSubmittingTaskExe(null)} 
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Выбранная задача</span>
                <h4 className="font-bold text-slate-800 text-base">{submittingTaskExe.task?.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{submittingTaskExe.task?.description}</p>
              </div>

              {/* Спецификация требований к фотоподтверждению */}
              <div className="p-3 bg-cyan-50/50 rounded-xl border border-cyan-100/50 space-y-2 text-xs">
                <span className="font-bold text-[#2daabd] block">Требования к подтверждению:</span>
                <p className="text-slate-600 font-medium">{submittingTaskExe.task?.confirmation_requirements || 'Необходимо предоставить четкую отчетную фотографию.'}</p>
              </div>

              {/* Интерактивное поле загрузки файла */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-600">Загрузить фото</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors relative cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                  />
                  {isUploadingFile ? (
                    <div className="flex flex-col items-center justify-center space-y-2 py-4">
                      <RefreshCw className="animate-spin h-8 w-8 text-[#2daabd]" />
                      <span className="text-xs font-semibold text-slate-500">Загрузка файла на сервер...</span>
                    </div>
                  ) : uploadedPhotoUrl ? (
                    <div className="space-y-3">
                      <img 
                        src={uploadedPhotoUrl} 
                        alt="Превью отчета" 
                        className="max-h-40 rounded-xl mx-auto border shadow-sm"
                      />
                      <span className="text-xs text-emerald-600 font-bold block flex items-center justify-center">
                        <Check className="h-4 w-4 mr-1" /> Файл успешно прикреплен!
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-2 py-4">
                      <Upload className="h-8 w-8 text-slate-400" />
                      <span className="text-xs font-bold text-slate-600">Перетащите сюда фото или кликните для выбора</span>
                      <span className="text-[10px] text-slate-400">Форматы: JPG, PNG, GIF. Размер до 10 МБ.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Чекбокс верификации требований отчета куратором */}
              <div className="flex items-start space-x-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <input 
                  type="checkbox" 
                  id="confirm_reqs" 
                  checked={confirmedRequirements} 
                  onChange={(e) => setConfirmedRequirements(e.target.checked)} 
                  className="rounded mt-0.5 h-4 w-4 text-[#2daabd] focus:ring-[#2daabd]"
                />
                <label htmlFor="confirm_reqs" className="text-xs text-slate-600 font-semibold cursor-pointer">
                  Я подтверждаю, что загруженное фото полностью соответствует всем указанным выше требованиям, включая присутствие куратора и студентов.
                </label>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
              <button 
                type="submit"
                className="px-5 py-2.5 bg-[#2daabd] hover:bg-[#208a9a] text-white font-bold text-xs rounded-xl shadow cursor-pointer"
              >
                Отправить отчет
              </button>
              <button 
                type="button" 
                onClick={() => setSubmittingTaskExe(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Отменить
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

export default Dashboard;