import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, QrCode, CheckSquare, Search, Plus, 
  CheckCircle2, XCircle, AlertCircle, Star, Camera, FileText
} from 'lucide-react';

export default function CuratorsView() {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState('students'); // 'students' | 'attendance' | 'tasks'
  
  // Группы
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupDetails, setGroupDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Студенты
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    first_name: '',
    last_name: '',
    middle_name: '',
    is_union_member: false
  });

  // Посещаемость
  const [attendanceTitle, setAttendanceTitle] = useState('Кураторский час');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [manualQrToken, setManualQrToken] = useState('');
  const [qrMessage, setQrMessage] = useState('');

  // Задачи и отчеты
  const [tasks, setTasks] = useState([]);
  const [submittingTaskId, setSubmittingTaskId] = useState(null);
  const [reportFile, setReportFile] = useState(null);
  const [uploadingReport, setUploadingReport] = useState(false);

  const isAdmin = user && ['ADMIN', 'HEAD_CURATOR'].includes(user.role);

  // Загрузка групп
  const loadGroups = () => {
    api.get('/curators/groups')
      .then(res => {
        setGroups(res.data);
        if (res.data.length > 0 && !selectedGroupId) {
          setSelectedGroupId(res.data[0].id);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  // Загрузка данных выбранной группы
  const loadGroupData = (groupId) => {
    if (!groupId) return;
    
    api.get(`/curators/groups/${groupId}`)
      .then(res => setGroupDetails(res.data))
      .catch(err => console.error(err));

    api.get(`/curators/groups/${groupId}/students?search=${encodeURIComponent(searchQuery)}`)
      .then(res => {
        setStudents(res.data);
        // Синхронизируем список для явки
        setAttendanceRecords(res.data.map(s => ({
          student_id: s.id,
          student_name: `${s.last_name} ${s.first_name}`,
          is_present: false,
          method: 'manual'
        })));
      })
      .catch(err => console.error(err));
  };

  // Загрузка поручений куратора
  const loadTasks = () => {
    api.get('/curators/tasks/my-tasks')
      .then(res => setTasks(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadGroups();
    loadTasks();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadGroupData(selectedGroupId);
    }
  }, [selectedGroupId, searchQuery]);

  // Добавление студента
  const handleAddStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/curators/groups/${selectedGroupId}/students`, newStudent);
      setIsAddStudentOpen(false);
      setNewStudent({ first_name: '', last_name: '', middle_name: '', is_union_member: false });
      loadGroupData(selectedGroupId);
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка добавления студента');
    }
  };

  // Назначение старосты кликом по студенту
  const handleAssignStarosta = async (studentId) => {
    if (!window.confirm('Назначить этого студента старостой академической группы?')) return;
    try {
      await api.post(`/curators/groups/${selectedGroupId}/assign`, {
        student_id: studentId,
        role_code: 'STAROSTA'
      });
      loadGroupData(selectedGroupId);
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка назначения');
    }
  };

  // Старт сессии посещаемости
  const handleStartAttendanceSession = async () => {
    try {
      const res = await api.post(`/curators/groups/${selectedGroupId}/attendance/sessions`, {
        title: attendanceTitle,
        date: new Date().toISOString()
      });
      setActiveSessionId(res.data.id);
      setAttendanceRecords(res.data.records);
      alert('Сессия занятия открыта! Вы можете сканировать QR-коды или отмечать студентов вручную.');
    } catch (err) {
      alert('Ошибка создания занятия');
    }
  };

  // Переключение присутствия вручную
  const handleTogglePresent = (studentId) => {
    setAttendanceRecords(prev => prev.map(r => 
      r.student_id === studentId ? { ...r, is_present: !r.is_present, method: 'manual' } : r
    ));
  };

  // Сохранение ведомости
  const handleSaveAttendance = async () => {
    if (!activeSessionId) {
      alert('Сначала начните сессию занятия кнопкой "+ Начать занятие"');
      return;
    }
    try {
      await api.post(`/curators/groups/${selectedGroupId}/attendance/sessions/${activeSessionId}/records-bulk`, attendanceRecords);
      alert('Ведомость посещаемости успешно сохранена в журнале!');
    } catch (err) {
      alert('Ошибка сохранения');
    }
  };

  // Сканирование токена QR (или ввод с клавиатуры для теста)
  const handleScanQr = async (e) => {
    e.preventDefault();
    if (!activeSessionId || !manualQrToken) return;

    try {
      const res = await api.post(`/curators/groups/${selectedGroupId}/attendance/sessions/${activeSessionId}/scan`, {
        qr_token: manualQrToken.trim()
      });
      setQrMessage(`✓ Студент ${res.data.student_name} успешно отмечен!`);
      setManualQrToken('');
      setAttendanceRecords(prev => prev.map(r => 
        r.student_id === res.data.student_id ? { ...r, is_present: true, method: 'qr' } : r
      ));
    } catch (err) {
      setQrMessage(err.response?.data?.detail || 'Неверный QR-токен');
    }
  };

  // Отправка фотоотчета куратором
  const handleSubmitTaskReport = async (executionId) => {
    if (!reportFile) return;
    setUploadingReport(true);
    try {
      const formData = new FormData();
      formData.append('file', reportFile);
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await api.post(`/curators/tasks/my-tasks/${executionId}/submit`, {
        photo_url: uploadRes.data.url
      });

      alert('Отчет успешно отправлен на проверку администратору!');
      setSubmittingTaskId(null);
      setReportFile(null);
      loadTasks();
    } catch (err) {
      alert('Ошибка загрузки отчета');
    } finally {
      setUploadingReport(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Шапка и переключатель групп */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center">
            <Users className="w-6 h-6 mr-2 text-blue-600" />
            Электронная книжка куратора
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Социальный паспорт группы, посещаемость по QR и отчетность кураторов
          </p>
        </div>

        {groups.length > 0 && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500">Группа:</span>
            <select
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(e.target.value)}
              className="px-4 py-2 border rounded-xl bg-slate-50 text-slate-900 font-bold text-xs focus:ring-2 focus:ring-blue-600"
            >
              {groups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.faculty})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Информационная карточка группы */}
      {groupDetails && (
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 font-bold block">Факультет / Институт</span>
            <span className="font-extrabold text-slate-800 text-sm">{groupDetails.faculty}</span>
            <span className="text-[11px] text-slate-500 block">{groupDetails.training_direction}</span>
          </div>

          <div>
            <span className="text-slate-400 font-bold block">Староста группы</span>
            <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-current" />
              {groupDetails.starosta ? groupDetails.starosta.username : 'Не назначен'}
            </span>
            <span className="text-[11px] text-slate-500 block">Численность: {groupDetails.students_count} чел.</span>
          </div>

          <div>
            <span className="text-slate-400 font-bold block">Куратор(ы)</span>
            <span className="font-extrabold text-blue-600 text-sm">
              {groupDetails.curators.map(c => c.username).join(', ') || 'Не закреплены'}
            </span>
            <span className="text-[11px] text-slate-500 block">Курс: {groupDetails.course}</span>
          </div>
        </div>
      )}

      {/* Подвкладки */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('students')}
          className={`pb-3 border-b-2 cursor-pointer transition ${
            activeSubTab === 'students' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          Социальный паспорт ({students.length})
        </button>

        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`pb-3 border-b-2 cursor-pointer transition flex items-center gap-1.5 ${
            activeSubTab === 'attendance' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <QrCode className="w-4 h-4" /> Учет посещаемости
        </button>

        <button
          onClick={() => setActiveSubTab('tasks')}
          className={`pb-3 border-b-2 cursor-pointer transition flex items-center gap-1.5 ${
            activeSubTab === 'tasks' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <CheckSquare className="w-4 h-4" /> Поручения и Фотоотчеты ({tasks.length})
        </button>
      </div>

      {/* 1. СОЦИАЛЬНЫЙ ПАСПОРТ */}
      {activeSubTab === 'students' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
            <div className="relative flex-grow max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Поиск по фамилии..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-xl bg-slate-50 text-xs"
              />
            </div>

            <button
              onClick={() => setIsAddStudentOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow cursor-pointer transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Добавить студента
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b text-slate-400 font-bold">
                  <th className="py-2.5">ФИО студента</th>
                  <th className="py-2.5 text-center">Профсоюз</th>
                  <th className="py-2.5">QR-токен явки</th>
                  <th className="py-2.5 text-right">Действия</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                    <td className="py-3 font-bold text-slate-900">
                      {s.last_name} {s.first_name} {s.middle_name || ''}
                    </td>
                    <td className="py-3 text-center">
                      {s.is_union_member ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                          Член профсоюза ✓
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="py-3 font-mono text-[11px] text-slate-400">
                      {s.qr_token.substring(0, 16)}...
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => handleAssignStarosta(s.id)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[11px] rounded-lg transition"
                      >
                        ★ Назначить старостой
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. ПОСЕЩАЕМОСТЬ И QR */}
      {activeSubTab === 'attendance' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={attendanceTitle}
                onChange={e => setAttendanceTitle(e.target.value)}
                className="px-3 py-1.5 border rounded-xl font-bold text-slate-800 text-xs w-64"
                placeholder="Тема кураторского часа"
              />
              <button
                onClick={handleStartAttendanceSession}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow cursor-pointer transition"
              >
                + Начать занятие
              </button>
            </div>

            <button
              onClick={handleSaveAttendance}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer transition"
            >
              Сохранить ведомость явки
            </button>
          </div>

          {/* Панель сканирования токена */}
          <form onSubmit={handleScanQr} className="bg-slate-50 p-4 rounded-2xl border flex gap-3 items-center">
            <Camera className="w-5 h-5 text-blue-600 shrink-0" />
            <input
              type="text"
              placeholder="Сканируйте QR или вставьте токен студента..."
              value={manualQrToken}
              onChange={e => setManualQrToken(e.target.value)}
              className="flex-grow px-3 py-2 border rounded-xl bg-white text-xs"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow cursor-pointer transition"
            >
              Отметить присутствие
            </button>
          </form>

          {qrMessage && (
            <div className="p-3 bg-blue-50 text-blue-800 font-bold rounded-xl text-xs">
              {qrMessage}
            </div>
          )}

          {/* Список студентов для ручной отметки */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {attendanceRecords.map(rec => (
              <div
                key={rec.student_id}
                onClick={() => handleTogglePresent(rec.student_id)}
                className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer select-none transition ${
                  rec.is_present
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <span className="font-bold">{rec.student_name}</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                  rec.is_present ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {rec.is_present ? (rec.method === 'qr' ? 'QR ✓' : 'Был ✓') : 'Н/Я'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. ЗАДАЧИ И ФОТООТЧЕТЫ */}
      {activeSubTab === 'tasks' && (
        <div className="space-y-4 text-xs">
          {tasks.map(exe => (
            <div
              key={exe.id}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900">{exe.task?.title}</h3>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    exe.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                    exe.status === 'PENDING' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {exe.status === 'APPROVED' ? 'Одобрено ✓' : exe.status === 'PENDING' ? 'На проверке' : 'К исполнению'}
                  </span>
                </div>
                <p className="text-slate-500">{exe.task?.description}</p>
                <div className="text-[11px] text-blue-600 font-bold">
                  Баллы: +{exe.task?.points} б. | Требование: {exe.task?.confirmation_requirements || 'Фотоотчет'}
                </div>
                {exe.admin_comment && (
                  <p className="text-red-600 font-bold">Замечание администратора: {exe.admin_comment}</p>
                )}
              </div>

              {exe.status !== 'APPROVED' && (
                <div className="shrink-0 w-full sm:w-auto">
                  {submittingTaskId === exe.id ? (
                    <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={e => setReportFile(e.target.files[0])}
                        className="text-[11px] text-slate-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSubmitTaskReport(exe.id)}
                          disabled={uploadingReport || !reportFile}
                          className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg shadow"
                        >
                          {uploadingReport ? 'Отправка...' : 'Отправить'}
                        </button>
                        <button
                          onClick={() => setSubmittingTaskId(null)}
                          className="px-3 py-1.5 bg-slate-200 text-slate-700 font-bold rounded-lg"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSubmittingTaskId(exe.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow cursor-pointer transition"
                    >
                      Прикрепить фотоотчет
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно добавления студента */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <form
            onSubmit={handleAddStudent}
            className="bg-white p-6 rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-slate-900">Новый студент группы</h3>
              <button
                type="button"
                onClick={() => setIsAddStudentOpen(false)}
                className="text-slate-400 hover:text-slate-700 font-bold text-lg"
              >
                ×
              </button>
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Фамилия</label>
              <input
                type="text"
                required
                value={newStudent.last_name}
                onChange={e => setNewStudent({ ...newStudent, last_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Имя</label>
              <input
                type="text"
                required
                value={newStudent.first_name}
                onChange={e => setNewStudent({ ...newStudent, first_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-600 mb-1">Отчество</label>
              <input
                type="text"
                value={newStudent.middle_name}
                onChange={e => setNewStudent({ ...newStudent, middle_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="union_ch"
                checked={newStudent.is_union_member}
                onChange={e => setNewStudent({ ...newStudent, is_union_member: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600"
              />
              <label htmlFor="union_ch" className="font-semibold text-slate-700 cursor-pointer">
                Состоит в Первичной профсоюзной организации студентов
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setIsAddStudentOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow"
              >
                Сохранить в паспорт
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}