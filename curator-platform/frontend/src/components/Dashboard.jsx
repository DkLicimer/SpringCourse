import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { Html5Qrcode } from 'html5-qrcode';

import logoHorizontal from '../assets/logo_horizontal.png';
import logoCrest from '../assets/logo_crest.png';

import { 
  Users, Award, Calendar, CheckSquare, LogOut, RefreshCw, 
  Search, UserPlus, PlusCircle, Check, X, Shield, BookOpen, Clock, Tag, Briefcase, 
  AlertTriangle, ShieldAlert, ArrowUpCircle, ArrowDownCircle, FileText, HelpCircle, 
  Save, Bell, ChevronLeft, ChevronRight, Upload, Sliders, ToggleLeft, ToggleRight, Trash2,
  QrCode, Camera, CheckCircle2, XCircle, UserCheck, ExternalLink, MapPin, Layers
} from 'lucide-react';

const formatChitaTime = (dateStr, options = {}) => {
  if (!dateStr) return '—';
  const defaultOptions = {
    timeZone: 'Asia/Chita',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  return new Date(dateStr).toLocaleString('ru-RU', defaultOptions);
};

function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [adminSubTab, setAdminSubTab] = useState('events'); // events, fields, assignments, tasks, surveys, directories, sanctions
  const [user, setUser] = useState(null);
  const [allUsersList, setAllUsersList] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupDetails, setGroupDetails] = useState(null);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  
  // Справочники
  const [socialCategories, setSocialCategories] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [dynamicFields, setDynamicFields] = useState([]);
  const [activeSurveys, setActiveSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null); 
  const [surveyResponsesSummary, setSurveyResponsesSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Задачи, календарь и рейтинг
  const [myTasks, setMyTasks] = useState([]);
  const [allExecutions, setAllExecutions] = useState([]); 
  const [calendar, setCalendar] = useState([]);
  const [ratingList, setRatingList] = useState([]);
  const [ratingPeriod, setRatingPeriod] = useState('all');
  const [currentCalDate, setCurrentCalDate] = useState(new Date());
  const [selectedCalItem, setSelectedCalItem] = useState(null);

  // Модальные окна и карточки
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editStudentForm, setEditStudentForm] = useState({
    first_name: '', last_name: '', middle_name: '', is_union_member: false,
    social_category_ids: [], organization_ids: [], dynamic_values: {}
  });

  const [submittingTaskExe, setSubmittingTaskExe] = useState(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [confirmedRequirements, setConfirmedRequirements] = useState(false);
  
  // Посещаемость и QR
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionRecords, setSessionRecords] = useState([]);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [newSessionForm, setNewSessionForm] = useState({ title: 'Кураторский час', date: new Date().toISOString().substring(0, 10) });
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerMessage, setScannerMessage] = useState(null);
  const [manualQrInput, setManualQrInput] = useState('');
  const html5QrCodeRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Формы админки
  const [newStudent, setNewStudent] = useState({ 
    first_name: '', last_name: '', middle_name: '', is_union_member: false,
    social_category_ids: [], organization_ids: [], dynamic_values: {}
  });
  const [newGroup, setNewGroup] = useState({ name: '', faculty: '', training_direction: '', course: 1 });
  const [newAssignment, setNewAssignment] = useState({ 
    user_id: '', role_code: 'CURATOR', protocol_number: '', protocol_date: '', protocol_file_url: '' 
  });
  
  // ФОРМА СОЗДАНИЯ ПЛАНОВОГО МЕРОПРИЯТИЯ АДМИНИСТРАТОРОМ
  const [newEventPlan, setNewEventPlan] = useState({
    title: '',
    description: '',
    date_time: '',
    location: '',
    category: 'Воспитательное',
    is_mandatory: true,
    target_type: 'all', // all, course, group
    target_course: 1,
    target_group_ids: [],
    // Настройки отчета, которые жестко задает админ:
    report_type: 'photo_proof', // photo_proof, no_proof, info_only
    points: 15,
    confirmation_requirements: 'Общее фото куратора с группой на мероприятии'
  });

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [newFieldForm, setNewFieldForm] = useState({ name: '', label: '', type: 'text', is_required: false });
  const [pointsAdjustment, setPointsAdjustment] = useState({ curator_id: '', points: 0, reason: '' });
  const [disciplinaryMark, setDisciplinaryMark] = useState({ curator_id: '', reason: '' });

  // Конструктор анкет
  const [newSurveyForm, setNewSurveyForm] = useState({ title: '', description: '', is_mandatory: false, expires_at: '' });
  const [surveyQuestions, setSurveyQuestions] = useState([]); 
  const [tempQuestion, setTempQuestion] = useState({ text: '', type: 'text', options: '' });
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

      const fieldsRes = await api.get('/directories/dynamic-fields');
      setDynamicFields(fieldsRes.data);

      const ratingRes = await api.get('/rating/');
      setRatingList(ratingRes.data);

      const surveysRes = await api.get('/surveys/');
      setActiveSurveys(surveysRes.data);

      const notifsRes = await api.get('/notifications/');
      setNotifications(notifsRes.data);

      if (userRes.data.system_role === 'ADMIN') {
        const usersListRes = await api.get('/auth/users');
        setAllUsersList(usersListRes.data);
      }

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

      const sessionsRes = await api.get(`/groups/${groupId}/attendance/sessions`);
      setAttendanceSessions(sessionsRes.data);
      if (sessionsRes.data.length > 0) {
        setSelectedSession(sessionsRes.data[0]);
        setSessionRecords(sessionsRes.data[0].records || []);
      } else {
        setSelectedSession(null);
        setSessionRecords([]);
      }

    } catch (err) {
      setError('Ошибка при загрузке сведений о группе.');
    }
  };

  useEffect(() => { loadData(); }, [selectedGroupId]);

  useEffect(() => {
    if (selectedGroupId) {
      const delayDebounce = setTimeout(() => { loadGroupData(selectedGroupId); }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [searchQuery]);

  // --- СОЗДАНИЕ ПЛАНОВОГО МЕРОПРИЯТИЯ АДМИНИСТРАТОРОМ ---
  const handleCreateEventPlan = async (e) => {
    e.preventDefault();
    try {
      // 1. Если мероприятие предполагает отчет куратора — создаем задачу с требованиями
      let linkedTaskId = null;
      if (newEventPlan.report_type !== 'info_only') {
        const taskRes = await api.post('/tasks/', {
          title: `Участие в мероприятии: ${newEventPlan.title}`,
          description: newEventPlan.description,
          category: newEventPlan.is_mandatory ? 'mandatory' : 'optional',
          type: newEventPlan.report_type, // photo_proof или no_proof
          due_date: new Date(newEventPlan.date_time).toISOString(),
          points: parseInt(newEventPlan.points) || 10,
          confirmation_requirements: newEventPlan.report_type === 'photo_proof' ? newEventPlan.confirmation_requirements : 'Отметка о посещении',
          target_type: newEventPlan.target_type,
          target_course: newEventPlan.target_type === 'course' ? parseInt(newEventPlan.target_course) : null,
          target_group_ids: newEventPlan.target_type === 'group' ? newEventPlan.target_group_ids : null
        });
        linkedTaskId = taskRes.data.id;
      }

      // 2. Определяем группы для события в календаре
      let targetGroupIds = [];
      if (newEventPlan.target_type === 'all') {
        targetGroupIds = groups.map(g => g.id);
      } else if (newEventPlan.target_type === 'course') {
        targetGroupIds = groups.filter(g => g.course === parseInt(newEventPlan.target_course)).map(g => g.id);
      } else {
        targetGroupIds = newEventPlan.target_group_ids;
      }

      // 3. Создаем мероприятие и связываем с задачей
      await api.post('/tasks/events', {
        title: newEventPlan.title,
        description: newEventPlan.description,
        date_time: new Date(newEventPlan.date_time).toISOString(),
        location: newEventPlan.location,
        category: newEventPlan.category,
        is_mandatory: newEventPlan.is_mandatory,
        associated_task_id: linkedTaskId,
        group_ids: targetGroupIds
      });

      setSuccessMsg('Мероприятие успешно внесено в университетский план и разослано кураторам!');
      setNewEventPlan({
        title: '', description: '', date_time: '', location: '', category: 'Воспитательное',
        is_mandatory: true, target_type: 'all', target_course: 1, target_group_ids: [],
        report_type: 'photo_proof', points: 15, confirmation_requirements: 'Общее фото куратора с группой'
      });
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось сохранить мероприятие в план.');
    }
  };

  // Выполнение задачи без фото (если админ установил no_proof)
  const handleSubmitTaskWithoutPhoto = async (executionId) => {
    try {
      await api.post(`/tasks/my-tasks/${executionId}/submit`, { photo_url: null });
      setSuccessMsg('Отметка об участии зафиксирована и отправлена администратору!');
      loadData();
    } catch (err) {
      setError('Не удалось отправить отметку.');
    }
  };

  // --- ОБРАБОТЧИКИ СТУДЕНТОВ ---
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      const dynamicPayload = Object.keys(newStudent.dynamic_values).map(fieldId => ({
        field_id: fieldId,
        value: String(newStudent.dynamic_values[fieldId])
      }));

      await api.post(`/groups/${selectedGroupId}/students`, {
        ...newStudent,
        dynamic_values: dynamicPayload
      });

      setNewStudent({ 
        first_name: '', last_name: '', middle_name: '', is_union_member: false,
        social_category_ids: [], organization_ids: [], dynamic_values: {}
      });
      setSuccessMsg('Студент успешно внесен в социальный паспорт!');
      loadGroupData(selectedGroupId);
    } catch (err) { setError('Не удалось добавить студента.'); }
  };

  const handleOpenStudentCard = (student) => {
    setSelectedStudent(student);
    const dynValuesMap = {};
    if (student.dynamic_values) {
      student.dynamic_values.forEach(item => { dynValuesMap[item.field_id] = item.value; });
    }

    setEditStudentForm({
      first_name: student.first_name,
      last_name: student.last_name,
      middle_name: student.middle_name || '',
      is_union_member: student.is_union_member,
      social_category_ids: student.social_categories?.map(c => c.id) || [],
      organization_ids: student.organizations?.map(o => o.id) || [],
      dynamic_values: dynValuesMap
    });
  };

  const handleSaveStudentCard = async (e) => {
    e.preventDefault();
    try {
      const dynamicPayload = Object.keys(editStudentForm.dynamic_values).map(fieldId => ({
        field_id: fieldId,
        value: String(editStudentForm.dynamic_values[fieldId])
      }));

      await api.put(`/groups/${selectedGroupId}/students/${selectedStudent.id}`, {
        first_name: editStudentForm.first_name,
        last_name: editStudentForm.last_name,
        middle_name: editStudentForm.middle_name,
        is_union_member: editStudentForm.is_union_member,
        social_category_ids: editStudentForm.social_category_ids,
        organization_ids: editStudentForm.organization_ids,
        dynamic_values: dynamicPayload
      });

      setSuccessMsg('Карточка студента сохранена!');
      setSelectedStudent(null);
      loadGroupData(selectedGroupId);
    } catch (err) { setError('Ошибка сохранения карточки.'); }
  };

  // --- ПОСЕЩАЕМОСТЬ И QR ---
  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/groups/${selectedGroupId}/attendance/sessions`, {
        title: newSessionForm.title,
        date: new Date(newSessionForm.date).toISOString()
      });
      setSuccessMsg('Занятие создано!');
      setIsCreatingSession(false);
      await loadGroupData(selectedGroupId);
      setSelectedSession(res.data);
      setSessionRecords(res.data.records);
    } catch (err) { setError('Ошибка создания занятия.'); }
  };

  const handleToggleStudentRecord = (studentId) => {
    setSessionRecords(prev => prev.map(rec => rec.student_id === studentId ? { ...rec, is_present: !rec.is_present, method: 'manual' } : rec));
  };

  const handleSaveAttendance = async () => {
    if (!selectedSession) return;
    try {
      const payload = sessionRecords.map(r => ({ student_id: r.student_id, is_present: r.is_present, method: r.method }));
      await api.post(`/groups/${selectedGroupId}/attendance/sessions/${selectedSession.id}/records-bulk`, payload);
      setSuccessMsg('Ведомость посещаемости сохранена!');
      loadGroupData(selectedGroupId);
    } catch (err) { setError('Ошибка сохранения ведомости.'); }
  };

  // Камера QR
  useEffect(() => {
    if (isScannerOpen && selectedSession) {
      const html5QrCode = new Html5Qrcode('qr-reader-container');
      html5QrCodeRef.current = html5QrCode;

      const qrCodeSuccessCallback = async (decodedText) => {
        try {
          const res = await api.post(`/groups/${selectedGroupId}/attendance/sessions/${selectedSession.id}/scan`, { qr_token: decodedText });
          setScannerMessage({ type: 'success', text: `✓ ${res.data.student_name} отмечен(а)!` });
          setSessionRecords(prev => prev.map(rec => rec.student_id === res.data.student_id ? { ...rec, is_present: true, method: 'qr' } : rec));
          if (navigator.vibrate) navigator.vibrate(100);
          setTimeout(() => setScannerMessage(null), 3000);
        } catch (err) {
          setScannerMessage({ type: 'error', text: err.response?.data?.detail || 'Ошибка считывания QR' });
          setTimeout(() => setScannerMessage(null), 3500);
        }
      };

      html5QrCode.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 220, height: 220 } }, qrCodeSuccessCallback, () => {})
        .catch(() => setScannerMessage({ type: 'error', text: 'Камера заблокирована или недоступна.' }));

      return () => { if (html5QrCodeRef.current?.isScanning) html5QrCodeRef.current.stop().catch(() => {}); };
    }
  }, [isScannerOpen, selectedSession]);

  // --- ФОТООТЧЕТЫ И ПРОВЕРКА ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingFile(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadedPhotoUrl(res.data.url);
      setSuccessMsg('Фотоотчет загружен на сервер!');
    } catch (err) { setError('Ошибка загрузки файла.'); } 
    finally { setIsUploadingFile(false); }
  };

  const handleConfirmAndSubmitReport = async (e) => {
    e.preventDefault();
    if (!uploadedPhotoUrl) { alert('Прикрепите фотографию-подтверждение.'); return; }
    if (!confirmedRequirements) { alert('Подтвердите соответствие требованиям админа.'); return; }
    try {
      await api.post(`/tasks/my-tasks/${submittingTaskExe.id}/submit`, { photo_url: uploadedPhotoUrl });
      setSuccessMsg('Фотоотчет отправлен на проверку администратору!');
      setSubmittingTaskExe(null);
      setUploadedPhotoUrl('');
      loadData();
    } catch (err) { setError('Не удалось отправить отчет.'); }
  };

  const handleReviewTask = async (executionId, approve) => {
    try {
      const comment = reviewComment[executionId] || '';
      if (!approve && !comment) { alert('Укажите причину возврата на доработку.'); return; }
      await api.post(`/tasks/executions/${executionId}/review`, { approve, comment });
      setSuccessMsg(approve ? 'Отчет одобрен, баллы начислены куратору!' : 'Отчет возвращен на доработку.');
      loadData();
    } catch (err) { setError('Ошибка проверки отчета.'); }
  };

  // --- АДМИНИСТРАТИВНЫЕ МЕТОДЫ ---
  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post('/groups/', newGroup);
      setNewGroup({ name: '', faculty: '', training_direction: '', course: 1 });
      setSuccessMsg('Группа создана!');
      loadData();
    } catch (err) { setError('Ошибка создания группы.'); }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    try {
      const body = { ...newAssignment };
      if (body.role_code !== 'PROFORG') { delete body.protocol_number; delete body.protocol_date; delete body.protocol_file_url; }
      await api.post(`/groups/${selectedGroupId}/assign`, body);
      setNewAssignment({ user_id: '', role_code: 'CURATOR', protocol_number: '', protocol_date: '', protocol_file_url: '' });
      setSuccessMsg('Куратор успешно назначен в группу!');
      loadGroupData(selectedGroupId);
    } catch (err) { setError(err.response?.data?.detail || 'Ошибка назначения роли.'); }
  };

  const handleUnassignRole = async (userId, roleCode) => {
    if (!window.confirm(`Снять куратора с роли ${roleCode}?`)) return;
    try {
      await api.post(`/groups/${selectedGroupId}/unassign`, null, { params: { user_id: userId, role_code: roleCode } });
      setSuccessMsg('Куратор снят с группы.');
      loadGroupData(selectedGroupId);
    } catch (err) { setError('Ошибка снятия с роли.'); }
  };

  const handleCreateDynamicField = async (e) => {
    e.preventDefault();
    try {
      await api.post('/directories/dynamic-fields', newFieldForm);
      setNewFieldForm({ name: '', label: '', type: 'text', is_required: false });
      setSuccessMsg('Поле добавлено в социальный паспорт!');
      loadData();
    } catch (err) { setError('Ошибка создания поля.'); }
  };

  const handleToggleDynamicField = async (field) => {
    try {
      await api.put(`/directories/dynamic-fields/${field.id}`, {
        name: field.name, label: field.label, type: field.type, is_required: field.is_required
      }, { params: { is_active: !field.is_active } });
      loadData();
    } catch (err) { setError('Ошибка смены статуса.'); }
  };

  const handleDeleteDynamicField = async (fieldId) => {
    if (!window.confirm('Удалить поле?')) return;
    try {
      await api.delete(`/directories/dynamic-fields/${fieldId}`);
      loadData();
    } catch (err) { setError('Поле заполнено у студентов.'); }
  };

  const handleAdjustPoints = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rating/sanctions/adjust-points', pointsAdjustment);
      setPointsAdjustment({ curator_id: '', points: 0, reason: '' });
      setSuccessMsg('Баллы куратора скорректированы!');
      loadData();
    } catch (err) { setError('Ошибка изменения баллов.'); }
  };

  const handleIssueViolation = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rating/sanctions/disciplinary-mark', disciplinaryMark);
      setDisciplinaryMark({ curator_id: '', reason: '' });
      setSuccessMsg('Дисциплинарная отметка установлена!');
      loadData();
    } catch (err) { setError('Ошибка вынесения отметки.'); }
  };

  const handleExportRatingCSV = () => {
    try {
      let csvContent = "\uFEFFМесто;Куратор;Прогресс программы (%);Доп. баллы;Суммарный балл;Взыскание\n";
      ratingList.forEach(r => {
        csvContent += `${r.place};${r.username};${r.completion_percentage}%;${r.additional_points};${r.points};${r.has_violation ? 'Да' : 'Нет'}\n`;
      });
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Рейтинг_кураторов_ЗабГУ.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) { alert("Ошибка выгрузки."); }
  };

  const getCalendarGridDays = () => {
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    const firstDay = new Date(year, month, 1);
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek < 0) startDayOfWeek = 6;
    const totalDays = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= totalDays; d++) days.push(d);
    return days;
  };

  const getEventsForDay = (day) => {
    if (!day) return [];
    const year = currentCalDate.getFullYear();
    const month = currentCalDate.getMonth();
    return calendar.filter(item => {
      const itemDate = new Date(item.date_time);
      return itemDate.getFullYear() === year && itemDate.getMonth() === month && itemDate.getDate() === day;
    });
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(groupSearchQuery.toLowerCase()) || 
    g.faculty.toLowerCase().includes(groupSearchQuery.toLowerCase())
  );

  const totalMyTasksCount = myTasks.length;
  const approvedMyTasksCount = myTasks.filter(t => t.status === 'APPROVED').length;
  const completionPercentage = totalMyTasksCount > 0 ? Math.round((approvedMyTasksCount / totalMyTasksCount) * 100) : 0;
  const currentCuratorRating = ratingList.find(r => r.curator_id === user?.id);
  const myPointsCalculated = currentCuratorRating ? currentCuratorRating.points : 0;
  const isMyViolation = currentCuratorRating ? currentCuratorRating.has_violation : false;
  const unreadNotifsCount = notifications.filter(n => !n.is_read).length;

  const presentCount = sessionRecords.filter(r => r.is_present).length;
  const totalStudentsCount = sessionRecords.length;
  const attendanceRate = totalStudentsCount > 0 ? Math.round((presentCount / totalStudentsCount) * 100) : 0;
  const activeDynamicFields = dynamicFields.filter(f => f.is_active);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <RefreshCw className="animate-spin h-8 w-8 text-zab-teal mr-2" /> Загрузка системы ЗабГУ...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans pb-16 sm:pb-0">
      
      {/* 1. ШАПКА (#051d2f) */}
      <nav className="bg-zab-navy sticky top-0 z-30 px-4 md:px-6 py-3 flex items-center justify-between shadow-lg text-white">
        <div className="flex items-center space-x-3">
          <img src={logoHorizontal} alt="ЗабГУ" className="hidden md:block h-10 w-auto object-contain" />
          <img src={logoCrest} alt="ЗабГУ" className="block md:hidden h-8 w-auto object-contain" />
          <div className="border-l border-slate-700 pl-3 hidden sm:block">
            <span className="text-xs uppercase tracking-widest text-slate-300 font-bold block">Электронная книжка куратора</span>
            <span className="text-[10px] text-zab-teal font-semibold flex items-center">
              <Clock className="h-3 w-3 mr-1" /> Чита (UTC+9): {formatChitaTime(new Date(), { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3 md:space-x-4">
          <div className="relative">
            <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-slate-300 hover:text-white transition-colors cursor-pointer">
              <Bell className="h-5 w-5" />
              {unreadNotifsCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white font-black text-[9px] h-4 w-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadNotifsCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-2 max-h-96 overflow-y-auto">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs uppercase">Уведомления</span>
                  {unreadNotifsCount > 0 && (
                    <button onClick={() => api.post('/notifications/read-all').then(loadData)} className="text-xs text-zab-teal hover:underline font-bold">Прочитать все</button>
                  )}
                </div>
                <div className="divide-y divide-slate-100">
                  {notifications.map(notif => (
                    <div key={notif.id} onClick={() => !notif.is_read && api.post(`/notifications/${notif.id}/read`).then(loadData)} className={`p-3 text-xs cursor-pointer hover:bg-slate-50 ${!notif.is_read ? 'bg-zab-teal/10 font-bold border-l-4 border-zab-teal' : ''}`}>
                      <p className="text-slate-700">{notif.text}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">{formatChitaTime(notif.created_at)}</span>
                    </div>
                  ))}
                  {notifications.length === 0 && <div className="p-4 text-center text-slate-400 text-xs">Нет уведомлений.</div>}
                </div>
              </div>
            )}
          </div>

          <span className="text-xs bg-zab-blue px-2.5 py-1.5 rounded-lg text-slate-200 font-semibold hidden md:flex items-center border border-slate-700">
            <Shield className="h-3.5 w-3.5 mr-1.5 text-zab-teal" />
            <span className="text-white mr-1">{user?.username}</span> 
            <span className="text-slate-400">({user?.system_role})</span>
          </span>

          <button onClick={onLogout} className="flex items-center text-red-400 hover:text-red-300 font-bold text-xs p-1.5 cursor-pointer">
            <LogOut className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </nav>

      {/* 2. СЕЛЕКТОР ГРУППЫ */}
      {groups.length > 0 && (
        <div className="bg-zab-blue text-white px-4 md:px-6 py-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between shadow-inner border-t border-slate-800 text-xs gap-2">
          <div className="flex items-center space-x-2 flex-grow max-w-md">
            <span className="font-bold text-slate-300 shrink-0">Группа:</span>
            <select 
              value={selectedGroupId} 
              onChange={(e) => setSelectedGroupId(e.target.value)} 
              className="bg-zab-navy text-white font-bold px-3 py-1.5 rounded-lg border border-slate-700 focus:ring-1 focus:ring-zab-teal cursor-pointer w-full text-xs"
            >
              {filteredGroups.map(g => (
                <option key={g.id} value={g.id}>{g.name} ({g.faculty})</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between sm:justify-end space-x-3">
            <input 
              type="text" 
              placeholder="Фильтр групп..." 
              value={groupSearchQuery} 
              onChange={(e) => setGroupSearchQuery(e.target.value)} 
              className="bg-zab-navy/60 border border-slate-700 px-2.5 py-1 rounded-lg text-white text-[11px] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-zab-teal w-32 sm:w-40"
            />
            <span className="text-slate-400 font-mono shrink-0">Курс {groupDetails?.course || 1}</span>
          </div>
        </div>
      )}

      {/* 3. ОПОВЕЩЕНИЯ */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 mt-3">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold shadow-sm flex items-center justify-between border border-red-100"><span>{error}</span><button onClick={() => setError('')} className="font-black text-sm">×</button></div>}
        {successMsg && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs font-semibold shadow-sm flex items-center justify-between border border-emerald-100"><span>{successMsg}</span><button onClick={() => setSuccessMsg('')} className="font-black text-sm">×</button></div>}
      </div>

      {/* 4. НАВИГАЦИОННЫЕ ВКЛАДКИ */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 mt-3 hidden sm:flex border-b border-slate-200 space-x-6 overflow-x-auto text-xs font-bold scrollbar-none">
        <button onClick={() => setActiveTab('overview')} className={`pb-3 transition-all border-b-2 cursor-pointer ${activeTab === 'overview' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Дашборд</button>
        <button onClick={() => setActiveTab('students')} className={`pb-3 transition-all border-b-2 cursor-pointer ${activeTab === 'students' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Социальный паспорт</button>
        <button onClick={() => setActiveTab('attendance')} className={`pb-3 transition-all border-b-2 cursor-pointer flex items-center ${activeTab === 'attendance' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><QrCode className="h-3.5 w-3.5 mr-1" /> Посещаемость</button>
        <button onClick={() => setActiveTab('tasks')} className={`pb-3 transition-all border-b-2 cursor-pointer ${activeTab === 'tasks' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Задачи и отчеты</button>
        <button onClick={() => setActiveTab('rating')} className={`pb-3 transition-all border-b-2 cursor-pointer ${activeTab === 'rating' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Рейтинг</button>
        <button onClick={() => setActiveTab('surveys')} className={`pb-3 transition-all border-b-2 cursor-pointer ${activeTab === 'surveys' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Анкеты</button>
        <button onClick={() => setActiveTab('statistics')} className={`pb-3 transition-all border-b-2 cursor-pointer ${activeTab === 'statistics' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Статистика</button>
        {user?.system_role === 'ADMIN' && (
          <button onClick={() => setActiveTab('admin')} className={`pb-3 transition-all border-b-2 cursor-pointer ${activeTab === 'admin' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Админ-панель</button>
        )}
      </div>

      {/* 5. ОСНОВНОЙ КОНТЕНТ */}
      <main className="max-w-7xl mx-auto w-full p-4 md:p-6 flex-grow">
        
        {/* ================= ВКЛАДКА 1: ДАШБОРД ================= */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-zab-teal flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 mb-3">
                  <div className="bg-zab-teal/10 p-2 rounded-xl text-zab-teal"><Users className="h-5 w-5" /></div>
                  <h2 className="text-sm font-bold text-slate-800">Моя группа</h2>
                </div>
                {groupDetails && (
                  <div className="space-y-2 text-xs">
                    <div><span className="text-slate-400 font-bold block">Группа</span><span className="text-base font-black text-slate-900">{groupDetails.name}</span></div>
                    <div><span className="text-slate-400 font-bold block">Факультет</span><span className="font-semibold text-slate-800">{groupDetails.faculty}</span></div>
                    <div><span className="text-slate-400 font-bold block">Студентов</span><span className="text-sm font-black text-zab-teal">{groupDetails.students_count} чел.</span></div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-zab-navy flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2.5 mb-3">
                  <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600"><Award className="h-5 w-5" /></div>
                  <h2 className="text-sm font-bold text-slate-800">Мой прогресс</h2>
                </div>
                <div className="text-center py-3 bg-slate-50 rounded-xl relative">
                  {isMyViolation && <div className="absolute top-2 right-2 text-red-500"><AlertTriangle className="h-4 w-4 animate-bounce" /></div>}
                  <div className="text-2xl font-black text-slate-800">{approvedMyTasksCount} / {totalMyTasksCount}</div>
                  <div className="text-[11px] text-slate-400">Выполнено задач программы</div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-600">Выполнение</span>
                    <span className="text-slate-900">{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-zab-teal h-2 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-500 font-bold">Баллы:</span>
                <span className="text-lg font-black text-emerald-600">{myPointsCalculated} б.</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-zab-teal">
              <div className="flex items-center space-x-2.5 mb-3">
                <div className="bg-purple-50 p-2 rounded-xl text-purple-600"><Calendar className="h-5 w-5" /></div>
                <h2 className="text-sm font-bold text-slate-800">Ближайшие события плана</h2>
              </div>
              <div className="space-y-2 max-h-[190px] overflow-y-auto">
                {calendar.slice(0, 3).map((item) => (
                  <div key={item.id} onClick={() => setSelectedCalItem(item)} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start space-x-2 cursor-pointer hover:bg-slate-100">
                    <div className="mt-0.5">{item.type === 'event' ? <Calendar className="h-3.5 w-3.5 text-purple-600" /> : <CheckSquare className="h-3.5 w-3.5 text-amber-600" />}</div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 leading-tight">{item.title}</h4>
                      <span className="text-[10px] text-slate-400 block mt-0.5">{formatChitaTime(item.date_time)}</span>
                    </div>
                  </div>
                ))}
                {calendar.length === 0 && <div className="text-center text-slate-400 text-xs py-6">Событий нет.</div>}
              </div>
            </div>

            {/* Календарная сетка */}
            <div className="lg:col-span-3 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-zab-teal">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-zab-teal" />
                  <h2 className="text-sm font-bold text-slate-800">Календарь плана ЗабГУ (время Читы)</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() - 1, 1))} className="p-1 rounded border hover:bg-slate-50"><ChevronLeft className="h-4 w-4" /></button>
                  <span className="font-bold text-xs uppercase text-slate-700">{currentCalDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}</span>
                  <button onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 1))} className="p-1 rounded border hover:bg-slate-50"><ChevronRight className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(d => <div key={d} className="font-bold text-[10px] text-slate-400 py-1">{d}</div>)}
                {getCalendarGridDays().map((day, idx) => {
                  const dayEvents = getEventsForDay(day);
                  return (
                    <div key={idx} className={`min-h-[70px] border border-slate-100 p-1 rounded-xl flex flex-col justify-between text-left ${day ? 'bg-slate-50/50' : 'bg-transparent border-none'}`}>
                      {day && (
                        <>
                          <span className="text-[10px] font-bold text-slate-400">{day}</span>
                          <div className="space-y-1 mt-0.5">
                            {dayEvents.slice(0, 2).map(evt => (
                              <div key={evt.id} onClick={() => setSelectedCalItem(evt)} className={`text-[9px] px-1 py-0.5 rounded font-bold truncate cursor-pointer ${evt.type === 'event' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'}`} title={evt.title}>
                                {evt.title}
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= ВКЛАДКА 2: СОЦИАЛЬНЫЙ ПАСПОРТ ================= */}
        {activeTab === 'students' && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-slate-800">Социальный паспорт ({groupDetails?.name})</h2>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input type="text" placeholder="Поиск по ФИО..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-zab-teal" />
                </div>
              </div>

              {students.length > 0 && (
                <div className="bg-cyan-50/50 p-3 rounded-xl border border-cyan-100 flex justify-between items-center text-xs font-bold text-slate-700">
                  <span className="flex items-center"><Briefcase className="h-4 w-4 mr-1.5 text-zab-teal" /> Профсоюзный учет группы</span>
                  <span className="text-zab-teal">Членов: {students.filter(s => s.is_union_member).length} из {students.length} ({Math.round((students.filter(s => s.is_union_member).length / students.length) * 100)}%)</span>
                </div>
              )}

              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold">
                      <th className="pb-2.5">ФИО студента</th>
                      <th className="pb-2.5 text-center">Профсоюз</th>
                      <th className="pb-2.5">Категории</th>
                      <th className="pb-2.5">Студ. организации</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id} onClick={() => handleOpenStudentCard(s)} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
                        <td className="py-2.5 font-bold text-slate-800">{s.last_name} {s.first_name} {s.middle_name || ''}</td>
                        <td className="py-2.5 text-center">{s.is_union_member ? <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">Да ✓</span> : <span className="text-slate-300">-</span>}</td>
                        <td className="py-2.5"><div className="flex flex-wrap gap-1">{s.social_categories?.map(c => <span key={c.id} className="bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded">{c.name}</span>)}</div></td>
                        <td className="py-2.5"><div className="flex flex-wrap gap-1">{s.organizations?.map(o => <span key={o.id} className="bg-zab-teal/10 text-zab-teal text-[10px] font-bold px-1.5 py-0.5 rounded">{o.name}</span>)}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-2">
                {students.map(s => (
                  <div key={s.id} onClick={() => handleOpenStudentCard(s)} className="p-3 bg-slate-50 border rounded-xl space-y-1 cursor-pointer">
                    <div className="flex justify-between font-bold text-xs">
                      <span>{s.last_name} {s.first_name}</span>
                      {s.is_union_member && <span className="text-emerald-600 text-[10px]">Профсоюз ✓</span>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {s.social_categories?.map(c => <span key={c.id} className="bg-amber-50 text-amber-700 text-[9px] px-1 rounded">{c.name}</span>)}
                      {s.organizations?.map(o => <span key={o.id} className="bg-zab-teal/10 text-zab-teal text-[9px] px-1 rounded">{o.name}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Форма добавления студента */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 h-fit space-y-3 text-xs">
              <div className="flex items-center space-x-2 border-b pb-2">
                <UserPlus className="h-4 w-4 text-zab-teal" />
                <h3 className="font-bold text-slate-800">Добавить студента</h3>
              </div>

              <form onSubmit={handleAddStudent} className="space-y-2.5">
                <div>
                  <label className="block font-bold text-slate-600 mb-0.5">Фамилия</label>
                  <input required type="text" value={newStudent.last_name} onChange={(e) => setNewStudent({...newStudent, last_name: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-0.5">Имя</label>
                  <input required type="text" value={newStudent.first_name} onChange={(e) => setNewStudent({...newStudent, first_name: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-0.5">Отчество</label>
                  <input type="text" value={newStudent.middle_name} onChange={(e) => setNewStudent({...newStudent, middle_name: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
                </div>

                <div className="flex items-center space-x-2 py-1">
                  <input type="checkbox" id="is_union" checked={newStudent.is_union_member} onChange={(e) => setNewStudent({...newStudent, is_union_member: e.target.checked})} className="rounded text-zab-teal" />
                  <label htmlFor="is_union" className="font-semibold text-slate-700">Член профсоюза</label>
                </div>

                {activeDynamicFields.map(field => (
                  <div key={field.id}>
                    <label className="block font-bold text-slate-600 mb-0.5">{field.label}</label>
                    {field.type === 'boolean' ? (
                      <input type="checkbox" checked={!!newStudent.dynamic_values[field.id]} onChange={(e) => setNewStudent({...newStudent, dynamic_values: { ...newStudent.dynamic_values, [field.id]: e.target.checked }})} className="rounded text-zab-teal h-4 w-4" />
                    ) : (
                      <input type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} value={newStudent.dynamic_values[field.id] || ''} onChange={(e) => setNewStudent({...newStudent, dynamic_values: { ...newStudent.dynamic_values, [field.id]: e.target.value }})} className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
                    )}
                  </div>
                ))}

                <button type="submit" className="w-full py-2 bg-zab-teal hover:bg-zab-teal-hover text-white font-bold rounded-lg shadow mt-2 cursor-pointer">
                  Сохранить в паспорт
                </button>
              </form>
            </div>

          </div>
        )}

        {/* ================= ВКЛАДКА 3: ПОСЕЩАЕМОСТЬ И QR ================= */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center">
                  <UserCheck className="h-4 w-4 text-zab-teal mr-2" /> Учет посещаемости кураторского часа
                </h3>
                <p className="text-xs text-slate-400">Явка: {presentCount} из {totalStudentsCount} ({attendanceRate}%)</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setIsCreatingSession(true)} className="flex-1 sm:flex-none px-3.5 py-2 bg-zab-teal text-white font-bold text-xs rounded-xl shadow cursor-pointer">
                  + Начать занятие
                </button>
                {selectedSession && (
                  <button onClick={() => setIsScannerOpen(true)} className="flex-1 sm:flex-none px-3.5 py-2 bg-zab-navy text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center justify-center">
                    <Camera className="h-4 w-4 mr-1 text-zab-teal" /> Сканер QR
                  </button>
                )}
              </div>
            </div>

            {selectedSession && (
              <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="font-bold text-xs text-slate-800">{selectedSession.title}</span>
                  <button onClick={handleSaveAttendance} className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg shadow">Сохранить ведомость</button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[450px] overflow-y-auto">
                  {sessionRecords.map(rec => (
                    <div 
                      key={rec.student_id} 
                      onClick={() => handleToggleStudentRecord(rec.student_id)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer select-none transition-all ${
                        rec.is_present ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        {rec.is_present ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-slate-400" />}
                        <span className="font-bold text-xs">{rec.student_name}</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${rec.is_present ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        {rec.is_present ? 'Был ✓' : 'Нет'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= ВКЛАДКА 4: ЗАДАЧИ И ПРОВЕРКА ОТЧЕТОВ ================= */}
        {activeTab === 'tasks' && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-sm font-bold text-slate-800">
              {user?.system_role === 'ADMIN' ? 'Контроль отчетов кураторов (Все группы ЗабГУ)' : 'Мои поручения и план мероприятий'}
            </h2>

            {user?.system_role === 'ADMIN' ? (
              <div className="space-y-3 text-xs">
                {allExecutions.map(exe => (
                  <div key={exe.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/70 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b pb-2">
                      <div>
                        <span className="font-black text-sm text-slate-900 block">{exe.task?.title}</span>
                        <span className="text-[11px] text-zab-teal font-bold">Куратор: {exe.curator_username} • Группа: {exe.group_name} • Награда: {exe.task?.points} б.</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] self-start sm:self-auto ${exe.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : exe.status === 'PENDING' ? 'bg-amber-100 text-amber-800 animate-pulse' : 'bg-red-100 text-red-800'}`}>
                        {exe.status === 'APPROVED' ? 'Одобрен' : exe.status === 'PENDING' ? 'На проверке' : 'Доработка'}
                      </span>
                    </div>

                    <p className="text-slate-600 text-xs">{exe.task?.description}</p>
                    
                    {exe.photo_url && (
                      <div className="pt-1">
                        <a href={exe.photo_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-zab-teal font-bold underline hover:text-zab-teal-hover">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> Посмотреть прикрепленный фотоотчет
                        </a>
                      </div>
                    )}

                    {exe.status === 'PENDING' && (
                      <div className="pt-2 border-t flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input type="text" placeholder="Замечание при возврате..." value={reviewComment[exe.id] || ''} onChange={(e) => setReviewComment({...reviewComment, [exe.id]: e.target.value})} className="flex-grow px-3 py-1.5 rounded-lg border border-slate-200 bg-white" />
                        <div className="flex gap-2">
                          <button onClick={() => handleReviewTask(exe.id, true)} className="flex-1 px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg cursor-pointer">Одобрить (+{exe.task?.points} б.)</button>
                          <button onClick={() => handleReviewTask(exe.id, false)} className="flex-1 px-4 py-1.5 bg-red-600 text-white font-bold rounded-lg cursor-pointer">Вернуть</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {myTasks.map(exe => (
                  <div key={exe.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-800">{exe.task?.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${exe.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                          {exe.status === 'APPROVED' ? 'Выполнено ✓' : 'К выполнению'}
                        </span>
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5">{exe.task?.description}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
                        <span className="bg-zab-teal/10 text-zab-teal font-bold px-1.5 py-0.5 rounded">Награда: {exe.task?.points} б.</span>
                        <span className="text-slate-400">Срок сдачи: {formatChitaTime(exe.task?.due_date)}</span>
                      </div>
                      {exe.admin_comment && <p className="text-red-500 font-bold mt-1">Замечание админа: {exe.admin_comment}</p>}
                    </div>

                    {exe.status !== 'APPROVED' && (
                      <div>
                        {exe.task?.type === 'photo_proof' ? (
                          <button onClick={() => { setSubmittingTaskExe(exe); setUploadedPhotoUrl(''); }} className="px-4 py-2 bg-zab-teal text-white font-bold rounded-xl shadow cursor-pointer shrink-0">
                            Загрузить фотоотчет
                          </button>
                        ) : (
                          <button onClick={() => handleSubmitTaskWithoutPhoto(exe.id)} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow cursor-pointer shrink-0">
                            Подтвердить участие
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= ВКЛАДКА 5: ТУРНИРНАЯ ТАБЛИЦА ================= */}
        {activeTab === 'rating' && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Турнирная таблица кураторов</h2>
                <span className="text-[11px] text-slate-400">Ранжирование по баллам и проценту выполнения</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <select value={ratingPeriod} onChange={(e) => setRatingPeriod(e.target.value)} className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white cursor-pointer">
                  <option value="all">За все время (Год)</option>
                  <option value="semester1">1 семестр</option>
                  <option value="semester2">2 семестр</option>
                  <option value="month">Текущий месяц</option>
                </select>
                <button onClick={handleExportRatingCSV} className="px-3 py-1.5 bg-zab-teal text-white font-bold text-xs rounded-lg shadow">CSV</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold">
                    <th className="pb-2 text-center">Место</th>
                    <th className="pb-2">Куратор</th>
                    <th className="pb-2 text-center">Прогресс</th>
                    <th className="pb-2 text-center">Доп. баллы</th>
                    <th className="pb-2 text-right">Баллы</th>
                  </tr>
                </thead>
                <tbody>
                  {ratingList.map(r => (
                    <tr key={r.curator_id} className={`border-b border-slate-100 ${user?.id === r.curator_id ? 'bg-zab-teal/10 font-bold' : ''}`}>
                      <td className="py-2.5 text-center font-bold">{r.place}</td>
                      <td className="py-2.5 font-bold text-slate-800 flex items-center space-x-1.5">
                        <span>{r.username}</span>
                        {r.has_violation && <AlertTriangle className="h-3.5 w-3.5 text-red-500" title="Взыскание" />}
                      </td>
                      <td className="py-2.5 text-center">{r.completion_percentage}%</td>
                      <td className="py-2.5 text-center">{r.additional_points > 0 ? `+${r.additional_points}` : r.additional_points} б.</td>
                      <td className="py-2.5 text-right font-black text-slate-900">{r.points} б.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= ВКЛАДКА 6: АНКЕТЫ ================= */}
        {activeTab === 'surveys' && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Анкеты и мониторинги ЗабГУ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {activeSurveys.map(survey => (
                <div key={survey.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/60 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">{survey.title}</h3>
                    <p className="text-slate-500 text-xs mt-1">{survey.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setSelectedSurvey(survey)} className="px-3 py-1.5 bg-zab-teal text-white font-bold rounded-lg shadow">Пройти опрос</button>
                    {user?.system_role === 'ADMIN' && (
                      <button onClick={() => handleLoadSurveyResponses(survey.id)} className="px-3 py-1.5 bg-zab-navy text-white font-bold rounded-lg shadow">Сводка ответов</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= ВКЛАДКА 7: СТАТИСТИКА ================= */}
        {activeTab === 'statistics' && (
          <div className="space-y-4 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
              <span className="font-bold text-sm text-slate-800">Экспорт данных в Excel (Деканат)</span>
              <button onClick={handleExportRatingCSV} className="px-3 py-1.5 bg-zab-teal text-white font-bold rounded-lg">Рейтинг CSV</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-100"><span className="text-slate-400 font-bold block">Студентов в группе</span><span className="text-2xl font-black text-slate-900 mt-1 block">{students.length} чел.</span></div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100"><span className="text-slate-400 font-bold block">Охват профсоюза</span><span className="text-2xl font-black text-zab-teal mt-1 block">{students.filter(s => s.is_union_member).length} из {students.length}</span></div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100"><span className="text-slate-400 font-bold block">Сессий посещаемости</span><span className="text-2xl font-black text-emerald-600 mt-1 block">{attendanceSessions.length}</span></div>
            </div>
          </div>
        )}

        {/* ================= ВКЛАДКА 8: АДМИН-ПАНЕЛЬ (УПРАВЛЕНИЕ ПЛАНОМ И СИСТЕМОЙ) ================= */}
        {activeTab === 'admin' && user?.system_role === 'ADMIN' && (
          <div className="space-y-5">
            
            <div className="flex border-b border-slate-200 space-x-4 text-xs font-bold overflow-x-auto scrollbar-none">
              <button onClick={() => setAdminSubTab('events')} className={`pb-2.5 border-b-2 cursor-pointer flex items-center ${adminSubTab === 'events' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-400'}`}><Calendar className="h-4 w-4 mr-1" /> План мероприятий</button>
              <button onClick={() => setAdminSubTab('fields')} className={`pb-2.5 border-b-2 cursor-pointer ${adminSubTab === 'fields' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-400'}`}>Поля паспорта</button>
              <button onClick={() => setAdminSubTab('assignments')} className={`pb-2.5 border-b-2 cursor-pointer ${adminSubTab === 'assignments' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-400'}`}>Группы и Кураторы</button>
              <button onClick={() => setAdminSubTab('surveys')} className={`pb-2.5 border-b-2 cursor-pointer ${adminSubTab === 'surveys' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-400'}`}>Анкеты</button>
              <button onClick={() => setAdminSubTab('directories')} className={`pb-2.5 border-b-2 cursor-pointer ${adminSubTab === 'directories' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-400'}`}>Справочники</button>
              <button onClick={() => setAdminSubTab('sanctions')} className={`pb-2.5 border-b-2 cursor-pointer ${adminSubTab === 'sanctions' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-400'}`}>Санкции и Баллы</button>
            </div>

            {/* 1. СОЗДАНИЕ ПЛАНОВОГО МЕРОПРИЯТИЯ С ПРАВИЛАМИ ОТЧЕТНОСТИ */}
            {adminSubTab === 'events' && (
              <form onSubmit={handleCreateEventPlan} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-zab-teal space-y-4 text-xs">
                <div className="flex items-center space-x-2 border-b pb-2">
                  <Calendar className="h-5 w-5 text-zab-teal" />
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">Формирование университетского плана мероприятий</h3>
                    <p className="text-slate-400 text-[11px]">Администратор задает график событий и определяет форму отчетности для кураторов</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Название мероприятия</label>
                    <input required type="text" placeholder="напр. Акция «Свеча Памяти»" value={newEventPlan.title} onChange={(e) => setNewEventPlan({...newEventPlan, title: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Дата и время (время Читы)</label>
                    <input required type="datetime-local" value={newEventPlan.date_time} onChange={(e) => setNewEventPlan({...newEventPlan, date_time: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Место проведения</label>
                    <input required type="text" placeholder="напр. Актовый зал / Мемориал" value={newEventPlan.location} onChange={(e) => setNewEventPlan({...newEventPlan, location: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Категория события</label>
                    <select value={newEventPlan.category} onChange={(e) => setNewEventPlan({...newEventPlan, category: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
                      <option value="Воспитательное">Воспитательное</option>
                      <option value="Патриотическое">Патриотическое</option>
                      <option value="Профилактическое">Профилактическое</option>
                      <option value="Торжественное">Торжественное</option>
                      <option value="Спортивное">Спортивное</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Целевая аудитория (Таргетинг)</label>
                    <select value={newEventPlan.target_type} onChange={(e) => setNewEventPlan({...newEventPlan, target_type: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
                      <option value="all">Все группы и кураторы университета</option>
                      <option value="course">Кураторы конкретного курса</option>
                      <option value="group">Выбранные группы</option>
                    </select>
                  </div>

                  {newEventPlan.target_type === 'course' && (
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Курс</label>
                      <select value={newEventPlan.target_course} onChange={(e) => setNewEventPlan({...newEventPlan, target_course: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
                        {[1, 2, 3, 4, 5, 6].map(c => <option key={c} value={c}>{c} курс</option>)}
                      </select>
                    </div>
                  )}
                </div>

                {/* БЛОК НАСТРОЙКИ ОТЧЕТНОСТИ (АДМИНИСТРАТОР РЕШАЕТ ФОРМАТ) */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <span className="font-bold text-zab-navy text-xs flex items-center"><CheckSquare className="h-4 w-4 mr-1 text-zab-teal" /> Форма отчетности куратора (Правила админа):</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Тип отчета</label>
                      <select value={newEventPlan.report_type} onChange={(e) => setNewEventPlan({...newEventPlan, report_type: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold">
                        <option value="photo_proof">📷 Обязательный фотоотчет</option>
                        <option value="no_proof">✓ Простая отметка куратора</option>
                        <option value="info_only">ℹ Без отчета (только календарь)</option>
                      </select>
                    </div>

                    {newEventPlan.report_type !== 'info_only' && (
                      <>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">Начисляемые баллы</label>
                          <input required type="number" value={newEventPlan.points} onChange={(e) => setNewEventPlan({...newEventPlan, points: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
                        </div>
                        <div>
                          <label className="block font-bold text-slate-600 mb-1">Требования к отчету/фото</label>
                          <input type="text" placeholder="напр. Присутствие куратора и студентов" value={newEventPlan.confirmation_requirements} onChange={(e) => setNewEventPlan({...newEventPlan, confirmation_requirements: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 mb-1">Описание и программа мероприятия</label>
                  <textarea rows="2" placeholder="Краткая информация для кураторов..." value={newEventPlan.description} onChange={(e) => setNewEventPlan({...newEventPlan, description: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200" />
                </div>

                <button type="submit" className="px-6 py-2.5 bg-zab-teal text-white font-bold rounded-xl shadow cursor-pointer">
                  Внести в университетский план
                </button>
              </form>
            )}

            {/* 2. ПОЛЯ ПАСПОРТА */}
            {adminSubTab === 'fields' && (
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-zab-teal space-y-4">
                <div className="flex items-center space-x-2 border-b pb-3">
                  <Sliders className="h-5 w-5 text-zab-teal" />
                  <h3 className="font-bold text-sm text-slate-800">Конструктор динамических полей паспорта</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
                  <div className="lg:col-span-2 space-y-2">
                    {dynamicFields.map(f => (
                      <div key={f.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <span className={`font-bold ${f.is_active ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{f.label}</span>
                          <span className="text-slate-400 ml-2 font-mono text-[10px]">({f.name} • {f.type})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button onClick={() => handleToggleDynamicField(f)} className="cursor-pointer">
                            {f.is_active ? <ToggleRight className="h-5 w-5 text-zab-teal" /> : <ToggleLeft className="h-5 w-5 text-slate-400" />}
                          </button>
                          <button onClick={() => handleDeleteDynamicField(f.id)} className="text-red-500 cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleCreateDynamicField} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 h-fit">
                    <h4 className="font-bold text-slate-800">Создать поле</h4>
                    <input required type="text" placeholder="Название (label)" value={newFieldForm.label} onChange={(e) => setNewFieldForm({...newFieldForm, label: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white" />
                    <input required type="text" placeholder="Ключ (name)" value={newFieldForm.name} onChange={(e) => setNewFieldForm({...newFieldForm, name: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white" />
                    <select value={newFieldForm.type} onChange={(e) => setNewFieldForm({...newFieldForm, type: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
                      <option value="text">Текст</option>
                      <option value="number">Число</option>
                      <option value="date">Дата</option>
                      <option value="boolean">Да/Нет (чекбокс)</option>
                    </select>
                    <button type="submit" className="w-full py-2 bg-zab-teal text-white font-bold rounded-lg shadow cursor-pointer">Создать поле</button>
                  </form>
                </div>
              </div>
            )}

            {/* 3. ГРУППЫ И КУРАТОРЫ */}
            {adminSubTab === 'assignments' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <form onSubmit={handleCreateGroup} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2.5">
                    <h4 className="font-bold text-sm text-slate-800">Создать академическую группу</h4>
                    <input required type="text" placeholder="Название (напр. ПИ-23-1)" value={newGroup.name} onChange={(e) => setNewGroup({...newGroup, name: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200" />
                    <input required type="text" placeholder="Факультет" value={newGroup.faculty} onChange={(e) => setNewGroup({...newGroup, faculty: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200" />
                    <input type="text" placeholder="Направление подготовки" value={newGroup.training_direction} onChange={(e) => setNewGroup({...newGroup, training_direction: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200" />
                    <input required type="number" min="1" max="6" placeholder="Курс" value={newGroup.course} onChange={(e) => setNewGroup({...newGroup, course: parseInt(e.target.value)})} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200" />
                    <button type="submit" className="w-full py-2 bg-zab-teal text-white font-bold rounded-lg shadow">Создать группу</button>
                  </form>

                  <form onSubmit={handleAssignRole} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2.5">
                    <h4 className="font-bold text-sm text-slate-800">Назначить куратора в группу {groupDetails?.name}</h4>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Пользователь</label>
                      <select required value={newAssignment.user_id} onChange={(e) => setNewAssignment({...newAssignment, user_id: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
                        <option value="">-- Выберите пользователя --</option>
                        {allUsersList.map(u => <option key={u.id} value={u.id}>{u.username} ({u.system_role})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Роль в группе</label>
                      <select value={newAssignment.role_code} onChange={(e) => setNewAssignment({...newAssignment, role_code: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white">
                        <option value="CURATOR">Куратор</option>
                        <option value="STAROSTA">Староста</option>
                        <option value="PROFORG">Профорг</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full py-2 bg-emerald-600 text-white font-bold rounded-lg shadow">Назначить роль</button>
                  </form>
                </div>

                {groupDetails && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-2">
                    <h4 className="font-bold text-slate-800">Активные кураторы группы {groupDetails.name}</h4>
                    <div className="space-y-1.5">
                      {groupDetails.curators?.map(c => (
                        <div key={c.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                          <span className="font-semibold text-slate-800">{c.username} (Куратор)</span>
                          <button onClick={() => handleUnassignRole(c.user_id, 'CURATOR')} className="text-red-500 font-bold hover:underline">Снять с роли</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 4. СПРАВОЧНИКИ */}
            {adminSubTab === 'directories' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-800">Социальные категории</h4>
                  <form onSubmit={handleCreateCategory} className="flex gap-2">
                    <input required type="text" placeholder="Новая категория..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="flex-grow px-2.5 py-1.5 rounded-lg border" />
                    <button type="submit" className="px-3 py-1.5 bg-zab-teal text-white font-bold rounded-lg">Создать</button>
                  </form>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {socialCategories.map(c => (
                      <div key={c.id} className="p-2 bg-slate-50 rounded-lg flex justify-between items-center">
                        <span className="font-semibold text-slate-800">{c.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                  <h4 className="font-bold text-slate-800">Студенческие организации</h4>
                  <form onSubmit={handleCreateOrganization} className="flex gap-2">
                    <input required type="text" placeholder="Новая организация..." value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} className="flex-grow px-2.5 py-1.5 rounded-lg border" />
                    <button type="submit" className="px-3 py-1.5 bg-zab-teal text-white font-bold rounded-lg">Создать</button>
                  </form>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {organizations.map(o => (
                      <div key={o.id} className="p-2 bg-slate-50 rounded-lg flex justify-between items-center">
                        <span className="font-semibold text-slate-800">{o.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. САНКЦИИ И БАЛЛЫ */}
            {adminSubTab === 'sanctions' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <form onSubmit={handleAdjustPoints} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-2.5">
                  <h4 className="font-bold text-slate-800">Корректировка баллов куратора</h4>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Куратор</label>
                    <select required value={pointsAdjustment.curator_id} onChange={(e) => setPointsAdjustment({...pointsAdjustment, curator_id: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border bg-white">
                      <option value="">-- Выберите куратора --</option>
                      {allUsersList.filter(u => u.system_role === 'USER' || u.system_role === 'CURATOR').map(c => <option key={c.id} value={c.id}>{c.username}</option>)}
                    </select>
                  </div>
                  <input required type="number" placeholder="Баллы (+/-)" value={pointsAdjustment.points} onChange={(e) => setPointsAdjustment({...pointsAdjustment, points: parseInt(e.target.value)})} className="w-full px-2.5 py-1.5 rounded-lg border" />
                  <input required type="text" placeholder="Причина" value={pointsAdjustment.reason} onChange={(e) => setPointsAdjustment({...pointsAdjustment, reason: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border" />
                  <button type="submit" className="w-full py-2 bg-red-600 text-white font-bold rounded-lg">Применить баллы</button>
                </form>

                <form onSubmit={handleIssueViolation} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-2.5">
                  <h4 className="font-bold text-slate-800">Вынесение дисциплинарной отметки (⚠)</h4>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Куратор-нарушитель</label>
                    <select required value={disciplinaryMark.curator_id} onChange={(e) => setDisciplinaryMark({...disciplinaryMark, curator_id: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border bg-white">
                      <option value="">-- Выберите куратора --</option>
                      {allUsersList.filter(u => u.system_role === 'USER' || u.system_role === 'CURATOR').map(c => <option key={c.id} value={c.id}>{c.username}</option>)}
                    </select>
                  </div>
                  <textarea required rows="2" placeholder="Суть нарушения..." value={disciplinaryMark.reason} onChange={(e) => setDisciplinaryMark({...disciplinaryMark, reason: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border" />
                  <button type="submit" className="w-full py-2 bg-red-700 text-white font-bold rounded-lg">Установить отметку (⚠)</button>
                </form>
              </div>
            )}

          </div>
        )}

      </main>

      {/* 6. МОБИЛЬНАЯ НИЖНЯЯ ПАНЕЛЬ */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-zab-navy border-t border-slate-700 px-2 py-1.5 flex justify-around items-center text-white text-[10px]">
        <button onClick={() => setActiveTab('overview')} className={`flex flex-col items-center p-1 ${activeTab === 'overview' ? 'text-zab-teal font-bold' : 'text-slate-400'}`}><BookOpen className="h-4 w-4 mb-0.5" /> Дашборд</button>
        <button onClick={() => setActiveTab('students')} className={`flex flex-col items-center p-1 ${activeTab === 'students' ? 'text-zab-teal font-bold' : 'text-slate-400'}`}><Users className="h-4 w-4 mb-0.5" /> Паспорт</button>
        <button onClick={() => setActiveTab('attendance')} className={`flex flex-col items-center p-1 ${activeTab === 'attendance' ? 'text-zab-teal font-bold' : 'text-slate-400'}`}><QrCode className="h-4 w-4 mb-0.5" /> Явка</button>
        <button onClick={() => setActiveTab('tasks')} className={`flex flex-col items-center p-1 ${activeTab === 'tasks' ? 'text-zab-teal font-bold' : 'text-slate-400'}`}><CheckSquare className="h-4 w-4 mb-0.5" /> Задачи</button>
        <button onClick={() => setActiveTab('rating')} className={`flex flex-col items-center p-1 ${activeTab === 'rating' ? 'text-zab-teal font-bold' : 'text-slate-400'}`}><Award className="h-4 w-4 mb-0.5" /> Рейтинг</button>
      </div>

      {/* МОДАЛЬНЫЕ ОКНА */}
      {selectedCalItem && (
        <div className="fixed inset-0 z-50 bg-zab-navy/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border-t-8 border-t-zab-teal text-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-800">{selectedCalItem.title}</h3>
            <p className="text-slate-500">Время проведения (Чита): {formatChitaTime(selectedCalItem.date_time)}</p>
            <div className="flex justify-end gap-2 pt-2 border-t">
              {selectedCalItem.type === 'task_deadline' && (
                <button onClick={() => { setSelectedCalItem(null); setActiveTab('tasks'); }} className="px-3 py-1.5 bg-zab-teal text-white font-bold rounded-lg shadow">К задаче</button>
              )}
              <button onClick={() => setSelectedCalItem(null)} className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-lg">Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-zab-navy/90 flex flex-col items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border-t-8 border-t-zab-teal text-center space-y-3 text-xs">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-bold text-slate-800">Сканирование QR-кода</span>
              <button onClick={() => setIsScannerOpen(false)} className="text-slate-400 font-bold text-lg">×</button>
            </div>
            <div id="qr-reader-container" className="w-full h-64 bg-slate-900 rounded-2xl overflow-hidden"></div>
            {scannerMessage && <div className={`p-2 rounded-lg font-bold ${scannerMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{scannerMessage.text}</div>}
            <button onClick={() => setIsScannerOpen(false)} className="w-full py-2 bg-slate-100 text-slate-700 font-bold rounded-lg">Закрыть</button>
          </div>
        </div>
      )}

      {/* Модальное окно сдачи фотоотчета куратором */}
      {submittingTaskExe && (
        <div className="fixed inset-0 z-50 bg-zab-navy/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleConfirmAndSubmitReport} className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border-t-8 border-t-zab-teal space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-800">Отправить фотоотчет по задаче</h3>
            <p className="font-bold text-zab-teal">{submittingTaskExe.task?.title}</p>
            
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center relative cursor-pointer hover:bg-slate-50">
              <input type="file" accept="image/*" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              {isUploadingFile ? (
                <div className="flex flex-col items-center"><RefreshCw className="animate-spin h-5 w-5 text-zab-teal mb-1" /> Загрузка...</div>
              ) : uploadedPhotoUrl ? (
                <span className="text-emerald-600 font-bold">✓ Фотография прикреплена</span>
              ) : (
                <span className="text-slate-500 font-bold">Нажмите для выбора фотоотчета</span>
              )}
            </div>

            <div className="flex items-start space-x-2 bg-slate-50 p-2.5 rounded-xl border">
              <input type="checkbox" id="confirm_box" checked={confirmedRequirements} onChange={(e) => setConfirmedRequirements(e.target.checked)} className="rounded text-zab-teal mt-0.5" />
              <label htmlFor="confirm_box" className="font-semibold text-slate-600 cursor-pointer">
                Подтверждаю выполнение требований задачи и присутствие на фото.
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="submit" className="px-4 py-1.5 bg-zab-teal text-white font-bold rounded-lg shadow">Отправить</button>
              <button type="button" onClick={() => setSubmittingTaskExe(null)} className="px-4 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-lg">Отмена</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

export default Dashboard;