import React, { useState, useEffect, useRef } from 'react';
import api from '../api';

// Лейаут
import Navbar from './layout/Navbar';
import GroupSelector from './layout/GroupSelector';
import MobileBottomNav from './layout/MobileBottomNav';

// Вкладки
import OverviewTab from './tabs/OverviewTab';
import StudentsTab from './tabs/StudentsTab';
import AttendanceTab from './tabs/AttendanceTab';
import TasksTab from './tabs/TasksTab';
import RatingTab from './tabs/RatingTab';
import SurveysTab from './tabs/SurveysTab';
import StatisticsTab from './tabs/StatisticsTab';
import AdminTab from './admin/AdminTab';

// Модальные окна
import CalendarEventModal from './modals/CalendarEventModal';
import CreateSessionModal from './modals/CreateSessionModal';
import QrScannerModal from './modals/QrScannerModal';
import SelectStarostaModal from './modals/SelectStarostaModal';
import StudentCardModal from './modals/StudentCardModal';
import SubmitTaskReportModal from './modals/SubmitTaskReportModal';

import { RefreshCw, QrCode } from 'lucide-react';

function Dashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [adminSubTab, setAdminSubTab] = useState('events');
  const [user, setUser] = useState(null);
  const [allUsersList, setAllUsersList] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupDetails, setGroupDetails] = useState(null);
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupSearchQuery, setGroupSearchQuery] = useState('');
  const [userAssignSearchQuery, setUserAssignSearchQuery] = useState('');
  
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

  // Модальные окна и формы
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isSelectStarostaOpen, setIsSelectStarostaOpen] = useState(false);
  const [starostaSearchQuery, setStarostaSearchQuery] = useState('');
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
  const [newUserForm, setNewUserForm] = useState({ username: '', password: '', system_role: 'USER' });
  const [newStudent, setNewStudent] = useState({ 
    first_name: '', last_name: '', middle_name: '', is_union_member: false,
    social_category_ids: [], organization_ids: [], dynamic_values: {}
  });
  const [newGroup, setNewGroup] = useState({ name: '', faculty: '', training_direction: '', course: 1 });
  const [newAssignment, setNewAssignment] = useState({ 
    user_id: '', role_code: 'CURATOR', protocol_number: '', protocol_date: '', protocol_file_url: '' 
  });
  const [isUploadingProtocol, setIsUploadingProtocol] = useState(false);
  
  const [newEventPlan, setNewEventPlan] = useState({
    title: '', description: '', date_time: '', location: '', category: 'Воспитательное',
    is_mandatory: true, target_type: 'all', target_course: 1, target_group_ids: [],
    report_type: 'photo_proof', points: 15, confirmation_requirements: 'Общее фото куратора с группой на мероприятии'
  });

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newOrgName, setNewOrgName] = useState('');
  const [newFieldForm, setNewFieldForm] = useState({ name: '', label: '', type: 'text', is_required: false });
  const [pointsAdjustment, setPointsAdjustment] = useState({ curator_id: '', points: 0, reason: '' });
  const [disciplinaryMark, setDisciplinaryMark] = useState({ curator_id: '', reason: '' });
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

  // --- ОБРАБОТЧИКИ НАЗНАЧЕНИЙ И СТУДЕНТОВ ---
  const handleAssignStarostaFromStudent = async (studentId, studentName) => {
    try {
      await api.post(`/groups/${selectedGroupId}/assign`, {
        student_id: studentId,
        role_code: 'STAROSTA'
      });
      setSuccessMsg(`Студент ${studentName} успешно назначен(а) старостой группы!`);
      setIsSelectStarostaOpen(false);
      loadGroupData(selectedGroupId);
    } catch (err) {
      setError(err.response?.data?.detail || 'Не удалось назначить старосту.');
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/users', newUserForm);
      setNewUserForm({ username: '', password: '', system_role: 'USER' });
      setSuccessMsg('Пользователь успешно зарегистрирован!');
      loadData();
    } catch (err) { setError(err.response?.data?.detail || 'Ошибка создания пользователя.'); }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Удалить пользователя "${username}"?`)) return;
    try {
      await api.delete(`/auth/users/${userId}`);
      setSuccessMsg(`Пользователь "${username}" удален!`);
      loadData();
    } catch (err) { setError(err.response?.data?.detail || 'Ошибка удаления.'); }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await api.post('/groups/', newGroup);
      setNewGroup({ name: '', faculty: '', training_direction: '', course: 1 });
      setSuccessMsg('Группа создана!');
      loadData();
    } catch (err) { setError('Ошибка создания группы.'); }
  };

  const handleDeleteGroup = async (groupId, groupName) => {
    if (!window.confirm(`Удалить группу "${groupName}"?`)) return;
    try {
      await api.delete(`/groups/${groupId}`);
      setSuccessMsg(`Группа "${groupName}" удалена!`);
      setSelectedGroupId('');
      loadData();
    } catch (err) { setError('Ошибка удаления группы.'); }
  };

  const handleProtocolFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingProtocol(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setNewAssignment({ ...newAssignment, protocol_file_url: res.data.url });
      setSuccessMsg('Скан протокола прикреплен!');
    } catch (err) { setError('Ошибка загрузки файла протокола.'); } 
    finally { setIsUploadingProtocol(false); }
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    try {
      const body = { ...newAssignment };
      if (body.role_code !== 'PROFORG') { delete body.protocol_number; delete body.protocol_date; delete body.protocol_file_url; }
      await api.post(`/groups/${selectedGroupId}/assign`, body);
      setNewAssignment({ user_id: '', role_code: 'CURATOR', protocol_number: '', protocol_date: '', protocol_file_url: '' });
      setSuccessMsg('Ответственное лицо назначено в группу!');
      loadGroupData(selectedGroupId);
    } catch (err) { setError(err.response?.data?.detail || 'Ошибка назначения роли.'); }
  };

  const handleUnassignRole = async (userId, roleCode) => {
    if (!window.confirm(`Снять с роли ${roleCode}?`)) return;
    try {
      await api.post(`/groups/${selectedGroupId}/unassign`, null, { params: { user_id: userId, role_code: roleCode } });
      setSuccessMsg('Роль снята.');
      loadGroupData(selectedGroupId);
    } catch (err) { setError('Ошибка снятия с роли.'); }
  };

  const handleCreateEventPlan = async (e) => {
    e.preventDefault();
    try {
      let linkedTaskId = null;
      if (newEventPlan.report_type !== 'info_only') {
        const taskRes = await api.post('/tasks/', {
          title: `Участие в мероприятии: ${newEventPlan.title}`,
          description: newEventPlan.description,
          category: newEventPlan.is_mandatory ? 'mandatory' : 'optional',
          type: newEventPlan.report_type,
          due_date: new Date(newEventPlan.date_time).toISOString(),
          points: parseInt(newEventPlan.points) || 10,
          confirmation_requirements: newEventPlan.report_type === 'photo_proof' ? newEventPlan.confirmation_requirements : 'Отметка о посещении',
          target_type: newEventPlan.target_type,
          target_course: newEventPlan.target_type === 'course' ? parseInt(newEventPlan.target_course) : null,
          target_group_ids: newEventPlan.target_type === 'group' ? newEventPlan.target_group_ids : null
        });
        linkedTaskId = taskRes.data.id;
      }

      let targetGroupIds = [];
      if (newEventPlan.target_type === 'all') targetGroupIds = groups.map(g => g.id);
      else if (newEventPlan.target_type === 'course') targetGroupIds = groups.filter(g => g.course === parseInt(newEventPlan.target_course)).map(g => g.id);
      else targetGroupIds = newEventPlan.target_group_ids;

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

      setSuccessMsg('Мероприятие внесено в план и направлено кураторам!');
      setNewEventPlan({
        title: '', description: '', date_time: '', location: '', category: 'Воспитательное',
        is_mandatory: true, target_type: 'all', target_course: 1, target_group_ids: [],
        report_type: 'photo_proof', points: 15, confirmation_requirements: 'Общее фото куратора с группой'
      });
      loadData();
    } catch (err) { setError(err.response?.data?.detail || 'Ошибка сохранения мероприятия.'); }
  };

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
      setSuccessMsg('Студент внесен в социальный паспорт!');
      loadGroupData(selectedGroupId);
    } catch (err) { setError('Ошибка добавления студента.'); }
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

  // Посещаемость
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

  const handleManualQrSubmit = async (e) => {
    e.preventDefault();
    if (!manualQrInput) return;
    try {
      const res = await api.post(`/groups/${selectedGroupId}/attendance/sessions/${selectedSession.id}/scan`, {
        qr_token: manualQrInput.trim()
      });
      setSuccessMsg(`✓ Студент ${res.data.student_name} отмечен!`);
      setManualQrInput('');
      setSessionRecords(prev => prev.map(rec => rec.student_id === res.data.student_id ? { ...rec, is_present: true, method: 'qr' } : rec));
    } catch (err) { setError(err.response?.data?.detail || 'Неверный токен студента.'); }
  };

  // Фотоотчеты
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadedPhotoUrl(res.data.url);
      setSuccessMsg('Фотоотчет загружен!');
    } catch (err) { setError('Ошибка загрузки файла.'); } 
    finally { setIsUploadingFile(false); }
  };

  const handleConfirmAndSubmitReport = async (e) => {
    e.preventDefault();
    if (!uploadedPhotoUrl) { alert('Прикрепите фото.'); return; }
    if (!confirmedRequirements) { alert('Подтвердите требования.'); return; }
    try {
      await api.post(`/tasks/my-tasks/${submittingTaskExe.id}/submit`, { photo_url: uploadedPhotoUrl });
      setSuccessMsg('Фотоотчет отправлен на проверку!');
      setSubmittingTaskExe(null);
      setUploadedPhotoUrl('');
      loadData();
    } catch (err) { setError('Ошибка отправки отчета.'); }
  };

  const handleSubmitTaskWithoutPhoto = async (executionId) => {
    try {
      await api.post(`/tasks/my-tasks/${executionId}/submit`, { photo_url: null });
      setSuccessMsg('Отметка зафиксирована!');
      loadData();
    } catch (err) { setError('Ошибка отправки отметки.'); }
  };

  const handleReviewTask = async (executionId, approve) => {
    try {
      const comment = reviewComment[executionId] || '';
      if (!approve && !comment) { alert('Укажите причину возврата.'); return; }
      await api.post(`/tasks/executions/${executionId}/review`, { approve, comment });
      setSuccessMsg(approve ? 'Отчет одобрен!' : 'Отчет возвращен на доработку.');
      loadData();
    } catch (err) { setError('Ошибка проверки отчета.'); }
  };

  // Динамические поля
  const handleCreateDynamicField = async (e) => {
    e.preventDefault();
    try {
      await api.post('/directories/dynamic-fields', newFieldForm);
      setNewFieldForm({ name: '', label: '', type: 'text', is_required: false });
      setSuccessMsg('Поле создано!');
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

  // Справочники
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/directories/social-categories', { name: newCategoryName });
      setNewCategoryName('');
      setSuccessMsg('Категория создана!');
      loadData();
    } catch (err) { setError('Ошибка создания категории.'); }
  };

  const handleCreateOrganization = async (e) => {
    e.preventDefault();
    try {
      await api.post('/directories/organizations', { name: newOrgName });
      setNewOrgName('');
      setSuccessMsg('Организация создана!');
      loadData();
    } catch (err) { setError('Ошибка создания организации.'); }
  };

  // Санкции
  const handleAdjustPoints = async (e) => {
    e.preventDefault();
    try {
      await api.post('/rating/sanctions/adjust-points', pointsAdjustment);
      setPointsAdjustment({ curator_id: '', points: 0, reason: '' });
      setSuccessMsg('Баллы скорректированы!');
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

  // Анкеты
  const handleSurveySubmit = async (e) => {
    e.preventDefault();
    try {
      const answersPayload = Object.keys(surveyAnswers).map(qId => ({
        question_id: qId,
        value: Array.isArray(surveyAnswers[qId]) ? surveyAnswers[qId].join('; ') : String(surveyAnswers[qId])
      }));
      await api.post('/surveys/submit', { survey_id: selectedSurvey.id, answers: answersPayload });
      setSuccessMsg('Анкета пройдена!');
      setSelectedSurvey(null);
      setSurveyAnswers({});
      loadData();
    } catch (err) { setError(err.response?.data?.detail || 'Ответьте на все вопросы.'); }
  };

  const handleLoadSurveyResponses = async (surveyId) => {
    try {
      const res = await api.get(`/surveys/${surveyId}/responses`);
      setSurveyResponsesSummary(res.data);
    } catch (err) { setError('Ошибка загрузки ответов.'); }
  };

  // Экспорт CSV
  const handleExportRatingCSV = () => {
    try {
      let csvContent = "\uFEFFМесто;Куратор;Прогресс (%);Доп. баллы;Суммарный балл;Взыскание\n";
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

  // Календарь
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

  const assignableUsers = allUsersList.filter(u => 
    u.username.toLowerCase().includes(userAssignSearchQuery.toLowerCase())
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
      
      {/* Шапка */}
      <Navbar 
        user={user}
        notifications={notifications}
        unreadNotifsCount={unreadNotifsCount}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        onReadAllNotifications={() => api.post('/notifications/read-all').then(loadData)}
        onReadNotification={(id) => api.post(`/notifications/${id}/read`).then(loadData)}
        onLogout={onLogout}
      />

      {/* Селектор группы */}
      <GroupSelector 
        groups={groups}
        filteredGroups={filteredGroups}
        selectedGroupId={selectedGroupId}
        setSelectedGroupId={setSelectedGroupId}
        groupSearchQuery={groupSearchQuery}
        setGroupSearchQuery={setGroupSearchQuery}
        course={groupDetails?.course}
      />

      {/* Оповещения */}
      <div className="max-w-7xl mx-auto w-full px-4 md:px-6 mt-3">
        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold shadow-sm flex items-center justify-between border border-red-100"><span>{error}</span><button onClick={() => setError('')} className="font-black text-sm">×</button></div>}
        {successMsg && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs font-semibold shadow-sm flex items-center justify-between border border-emerald-100"><span>{successMsg}</span><button onClick={() => setSuccessMsg('')} className="font-black text-sm">×</button></div>}
      </div>

      {/* Десктопная навигация */}
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

      {/* Основной контент */}
      <main className="max-w-7xl mx-auto w-full p-4 md:p-6 flex-grow">
        {activeTab === 'overview' && (
          <OverviewTab 
            groupDetails={groupDetails}
            approvedMyTasksCount={approvedMyTasksCount}
            totalMyTasksCount={totalMyTasksCount}
            completionPercentage={completionPercentage}
            myPointsCalculated={myPointsCalculated}
            isMyViolation={isMyViolation}
            calendar={calendar}
            currentCalDate={currentCalDate}
            setCurrentCalDate={setCurrentCalDate}
            getCalendarGridDays={getCalendarGridDays}
            getEventsForDay={getEventsForDay}
            onSelectCalItem={(item) => setSelectedCalItem(item)}
          />
        )}

        {activeTab === 'students' && (
          <StudentsTab 
            groupDetails={groupDetails}
            students={students}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeDynamicFields={activeDynamicFields}
            newStudent={newStudent}
            setNewStudent={setNewStudent}
            onAddStudent={handleAddStudent}
            onOpenStudentCard={handleOpenStudentCard}
            onOpenSelectStarosta={() => setIsSelectStarostaOpen(true)}
            onUnassignRole={handleUnassignRole}
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceTab 
            selectedSession={selectedSession}
            sessionRecords={sessionRecords}
            presentCount={presentCount}
            totalStudentsCount={totalStudentsCount}
            attendanceRate={attendanceRate}
            manualQrInput={manualQrInput}
            setManualQrInput={setManualQrInput}
            onOpenCreateSession={() => setIsCreatingSession(true)}
            onOpenScanner={() => setIsScannerOpen(true)}
            onSaveAttendance={handleSaveAttendance}
            onManualQrSubmit={handleManualQrSubmit}
            onToggleStudentRecord={handleToggleStudentRecord}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksTab 
            user={user}
            myTasks={myTasks}
            allExecutions={allExecutions}
            reviewComment={reviewComment}
            setReviewComment={setReviewComment}
            onReviewTask={handleReviewTask}
            onOpenSubmitReport={(exe) => { setSubmittingTaskExe(exe); setUploadedPhotoUrl(''); }}
            onSubmitTaskWithoutPhoto={handleSubmitTaskWithoutPhoto}
          />
        )}

        {activeTab === 'rating' && (
          <RatingTab 
            user={user}
            ratingList={ratingList}
            ratingPeriod={ratingPeriod}
            setRatingPeriod={setRatingPeriod}
            onExportRatingCSV={handleExportRatingCSV}
          />
        )}

        {activeTab === 'surveys' && (
          <SurveysTab 
            user={user}
            activeSurveys={activeSurveys}
            selectedSurvey={selectedSurvey}
            setSelectedSurvey={setSelectedSurvey}
            surveyAnswers={surveyAnswers}
            setSurveyAnswers={setSurveyAnswers}
            surveyResponsesSummary={surveyResponsesSummary}
            setSurveyResponsesSummary={setSurveyResponsesSummary}
            onSurveySubmit={handleSurveySubmit}
            onLoadSurveyResponses={handleLoadSurveyResponses}
          />
        )}

        {activeTab === 'statistics' && (
          <StatisticsTab 
            students={students}
            attendanceSessions={attendanceSessions}
            onExportRatingCSV={handleExportRatingCSV}
          />
        )}

        {activeTab === 'admin' && user?.system_role === 'ADMIN' && (
          <AdminTab 
            adminSubTab={adminSubTab}
            setAdminSubTab={setAdminSubTab}
            newEventPlan={newEventPlan}
            setNewEventPlan={setNewEventPlan}
            onCreateEventPlan={handleCreateEventPlan}
            newUserForm={newUserForm}
            setNewUserForm={setNewUserForm}
            allUsersList={allUsersList}
            currentUserId={user?.id}
            onCreateUser={handleCreateUser}
            onDeleteUser={handleDeleteUser}
            newGroup={newGroup}
            setNewGroup={setNewGroup}
            groups={groups}
            groupDetails={groupDetails}
            onCreateGroup={handleCreateGroup}
            onDeleteGroup={handleDeleteGroup}
            newAssignment={newAssignment}
            setNewAssignment={setNewAssignment}
            assignableUsers={assignableUsers}
            userAssignSearchQuery={userAssignSearchQuery}
            setUserAssignSearchQuery={setUserAssignSearchQuery}
            isUploadingProtocol={isUploadingProtocol}
            onProtocolFileUpload={handleProtocolFileUpload}
            onAssignRole={handleAssignRole}
            onUnassignRole={handleUnassignRole}
            dynamicFields={dynamicFields}
            newFieldForm={newFieldForm}
            setNewFieldForm={setNewFieldForm}
            onCreateDynamicField={handleCreateDynamicField}
            onToggleDynamicField={handleToggleDynamicField}
            onDeleteDynamicField={handleDeleteDynamicField}
            socialCategories={socialCategories}
            organizations={organizations}
            newCategoryName={newCategoryName}
            setNewCategoryName={setNewCategoryName}
            newOrgName={newOrgName}
            setNewOrgName={setNewOrgName}
            onCreateCategory={handleCreateCategory}
            onCreateOrganization={handleCreateOrganization}
            pointsAdjustment={pointsAdjustment}
            setPointsAdjustment={setPointsAdjustment}
            disciplinaryMark={disciplinaryMark}
            setDisciplinaryMark={setDisciplinaryMark}
            onAdjustPoints={handleAdjustPoints}
            onIssueViolation={handleIssueViolation}
          />
        )}
      </main>

      {/* Мобильная панель навигации */}
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Модальные окна */}
      <CalendarEventModal 
        item={selectedCalItem} 
        onClose={() => setSelectedCalItem(null)} 
        onGoToTasks={() => setActiveTab('tasks')} 
      />

      <CreateSessionModal 
        isOpen={isCreatingSession}
        onClose={() => setIsCreatingSession(false)}
        form={newSessionForm}
        setForm={setNewSessionForm}
        onSubmit={handleCreateSession}
      />

      <QrScannerModal 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        scannerMessage={scannerMessage}
      />

      <SelectStarostaModal 
        isOpen={isSelectStarostaOpen}
        onClose={() => setIsSelectStarostaOpen(false)}
        groupName={groupDetails?.name}
        students={students}
        searchQuery={starostaSearchQuery}
        onSearchChange={setStarostaSearchQuery}
        onAssign={handleAssignStarostaFromStudent}
      />

      <StudentCardModal 
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        form={editStudentForm}
        setForm={setEditStudentForm}
        activeDynamicFields={activeDynamicFields}
        onSave={handleSaveStudentCard}
        onAssignStarosta={handleAssignStarostaFromStudent}
      />

      <SubmitTaskReportModal 
        execution={submittingTaskExe}
        onClose={() => setSubmittingTaskExe(null)}
        onFileUpload={handleFileUpload}
        isUploadingFile={isUploadingFile}
        uploadedPhotoUrl={uploadedPhotoUrl}
        confirmedRequirements={confirmedRequirements}
        setConfirmedRequirements={setConfirmedRequirements}
        onSubmit={handleConfirmAndSubmitReport}
      />

    </div>
  );
}

export default Dashboard;