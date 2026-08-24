import React from 'react';
import { 
  Calendar, UserCog, Building2, UserCheck, Sliders, Tag, ShieldAlert,
  Trash2, ToggleLeft, ToggleRight, UserPlus, CheckSquare, FileCheck
} from 'lucide-react';

function AdminTab({
  adminSubTab,
  setAdminSubTab,
  // Мероприятия
  newEventPlan,
  setNewEventPlan,
  onCreateEventPlan,
  // Пользователи
  newUserForm,
  setNewUserForm,
  allUsersList,
  currentUserId,
  onCreateUser,
  onDeleteUser,
  // Группы
  newGroup,
  setNewGroup,
  groups,
  groupDetails,
  onCreateGroup,
  onDeleteGroup,
  // Назначения
  newAssignment,
  setNewAssignment,
  assignableUsers,
  userAssignSearchQuery,
  setUserAssignSearchQuery,
  isUploadingProtocol,
  onProtocolFileUpload,
  onAssignRole,
  onUnassignRole,
  // Динамические поля
  dynamicFields,
  newFieldForm,
  setNewFieldForm,
  onCreateDynamicField,
  onToggleDynamicField,
  onDeleteDynamicField,
  // Справочники
  socialCategories,
  organizations,
  newCategoryName,
  setNewCategoryName,
  newOrgName,
  setNewOrgName,
  onCreateCategory,
  onCreateOrganization,
  // Санкции
  pointsAdjustment,
  setPointsAdjustment,
  disciplinaryMark,
  setDisciplinaryMark,
  onAdjustPoints,
  onIssueViolation
}) {
  return (
    <div className="space-y-5">
      {/* Навигация подвкладок админки */}
      <div className="flex border-b border-slate-200 space-x-4 text-xs font-bold overflow-x-auto scrollbar-none">
        <button onClick={() => setAdminSubTab('events')} className={`pb-2.5 border-b-2 cursor-pointer flex items-center ${adminSubTab === 'events' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-400'}`}><Calendar className="h-4 w-4 mr-1" /> План мероприятий</button>
        <button onClick={() => setAdminSubTab('users')} className={`pb-2.5 border-b-2 cursor-pointer flex items-center ${adminSubTab === 'users' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-400'}`}><UserCog className="h-4 w-4 mr-1" /> Кураторы и пользователи</button>
        <button onClick={() => setAdminSubTab('groups')} className={`pb-2.5 border-b-2 cursor-pointer flex items-center ${adminSubTab === 'groups' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-400'}`}><Building2 className="h-4 w-4 mr-1" /> Академические группы</button>
        <button onClick={() => setAdminSubTab('assignments')} className={`pb-2.5 border-b-2 cursor-pointer flex items-center ${adminSubTab === 'assignments' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-400'}`}><UserCheck className="h-4 w-4 mr-1" /> Назначение в группы</button>
        <button onClick={() => setAdminSubTab('fields')} className={`pb-2.5 border-b-2 cursor-pointer flex items-center ${adminSubTab === 'fields' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-400'}`}><Sliders className="h-4 w-4 mr-1" /> Поля паспорта</button>
        <button onClick={() => setAdminSubTab('directories')} className={`pb-2.5 border-b-2 cursor-pointer flex items-center ${adminSubTab === 'directories' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-400'}`}><Tag className="h-4 w-4 mr-1" /> Справочники</button>
        <button onClick={() => setAdminSubTab('sanctions')} className={`pb-2.5 border-b-2 cursor-pointer flex items-center ${adminSubTab === 'sanctions' ? 'border-zab-teal text-zab-teal' : 'border-transparent text-slate-400'}`}><ShieldAlert className="h-4 w-4 mr-1" /> Санкции и Баллы</button>
      </div>

      {/* 1. ПЛАН МЕРОПРИЯТИЙ */}
      {adminSubTab === 'events' && (
        <form onSubmit={onCreateEventPlan} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-zab-teal space-y-4 text-xs">
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

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <span className="font-bold text-zab-navy text-xs flex items-center"><CheckSquare className="h-4 w-4 mr-1 text-zab-teal" /> Форма отчетности куратора:</span>
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

          <button type="submit" className="px-6 py-2.5 bg-zab-teal hover:bg-zab-teal-hover text-white font-bold rounded-xl shadow cursor-pointer">
            Внести в университетский план
          </button>
        </form>
      )}

      {/* 2. КУРАТОРЫ И ПОЛЬЗОВАТЕЛИ */}
      {adminSubTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
          <form onSubmit={onCreateUser} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3 h-fit">
            <div className="flex items-center space-x-2 border-b pb-2">
              <UserPlus className="h-4 w-4 text-zab-teal" />
              <h4 className="font-bold text-sm text-slate-800">Создать пользователя</h4>
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Логин</label>
              <input required type="text" placeholder="напр. curator_morozov" value={newUserForm.username} onChange={(e) => setNewUserForm({...newUserForm, username: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Пароль</label>
              <input required type="password" placeholder="Минимум 6 символов" value={newUserForm.password} onChange={(e) => setNewUserForm({...newUserForm, password: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Системная роль</label>
              <select value={newUserForm.system_role} onChange={(e) => setNewUserForm({...newUserForm, system_role: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border bg-white font-semibold">
                <option value="USER">Куратор академической группы</option>
                <option value="ADMIN">Администратор системы</option>
              </select>
            </div>
            <button type="submit" className="w-full py-2 bg-zab-teal hover:bg-zab-teal-hover text-white font-bold rounded-lg shadow cursor-pointer">
              Зарегистрировать пользователя
            </button>
          </form>

          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-sm text-slate-800">Пользователи системы ({allUsersList.length})</h4>
              <span className="text-slate-400 text-[11px]">Кураторы и администраторы ЗабГУ</span>
            </div>

            <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
              {allUsersList.map(u => (
                <div key={u.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800">{u.username}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.system_role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-zab-teal/10 text-zab-teal'}`}>
                      {u.system_role === 'ADMIN' ? 'Администратор' : 'Куратор'}
                    </span>
                  </div>

                  {u.id !== currentUserId && (
                    <button 
                      onClick={() => onDeleteUser(u.id, u.username)}
                      className="text-red-500 hover:text-red-700 font-bold text-xs flex items-center cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" /> Удалить
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. АКАДЕМИЧЕСКИЕ ГРУППЫ */}
      {adminSubTab === 'groups' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
          <form onSubmit={onCreateGroup} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3 h-fit">
            <div className="flex items-center space-x-2 border-b pb-2">
              <Building2 className="h-4 w-4 text-zab-teal" />
              <h4 className="font-bold text-sm text-slate-800">Создать группу</h4>
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Номер / Название</label>
              <input required type="text" placeholder="напр. ПИ-23-1" value={newGroup.name} onChange={(e) => setNewGroup({...newGroup, name: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Факультет / Институт</label>
              <input required type="text" placeholder="напр. Факультет цифровых технологий" value={newGroup.faculty} onChange={(e) => setNewGroup({...newGroup, faculty: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Направление подготовки</label>
              <input type="text" placeholder="напр. 09.03.04 Программная инженерия" value={newGroup.training_direction} onChange={(e) => setNewGroup({...newGroup, training_direction: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
            </div>
            <div>
              <label className="block font-bold text-slate-600 mb-1">Курс (1-6)</label>
              <input required type="number" min="1" max="6" value={newGroup.course} onChange={(e) => setNewGroup({...newGroup, course: parseInt(e.target.value)})} className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
            </div>
            <button type="submit" className="w-full py-2 bg-zab-teal hover:bg-zab-teal-hover text-white font-bold rounded-lg shadow cursor-pointer">
              Создать группу
            </button>
          </form>

          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h4 className="font-bold text-sm text-slate-800">Все группы университета ({groups.length})</h4>
              <span className="text-slate-400 text-[11px]">База академических групп</span>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {groups.map(g => (
                <div key={g.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center">
                  <div>
                    <span className="font-black text-sm text-slate-900 block">{g.name}</span>
                    <span className="text-slate-500 text-[11px]">{g.faculty} • {g.course} курс</span>
                  </div>

                  <button 
                    onClick={() => onDeleteGroup(g.id, g.name)}
                    className="text-red-500 hover:text-red-700 font-bold text-xs flex items-center cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Удалить группу
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. НАЗНАЧЕНИЕ В ГРУППЫ */}
      {adminSubTab === 'assignments' && (
        <div className="space-y-4 text-xs">
          <form onSubmit={onAssignRole} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <h4 className="font-bold text-sm text-slate-800">
              Назначить ответственное лицо в группу <span className="text-zab-teal">{groupDetails?.name}</span>
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block font-bold text-slate-600">Пользователь</label>
                <input 
                  type="text" 
                  placeholder="Поиск по логину..." 
                  value={userAssignSearchQuery} 
                  onChange={(e) => setUserAssignSearchQuery(e.target.value)} 
                  className="w-full px-2 py-1 rounded border bg-slate-50 text-[11px] mb-1"
                />
                <select 
                  required 
                  value={newAssignment.user_id} 
                  onChange={(e) => setNewAssignment({...newAssignment, user_id: e.target.value})} 
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                >
                  <option value="">-- Выберите пользователя ({assignableUsers.length}) --</option>
                  {assignableUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.username} ({u.system_role === 'ADMIN' ? 'Админ' : 'Куратор/Студент'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-600 mb-1">Роль в группе</label>
                <select 
                  value={newAssignment.role_code} 
                  onChange={(e) => setNewAssignment({...newAssignment, role_code: e.target.value})} 
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                >
                  <option value="CURATOR">Куратор академической группы (до 3-х)</option>
                  <option value="STAROSTA">Староста группы (1 человек)</option>
                  <option value="PROFORG">Профорг группы (избирается собранием)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow cursor-pointer">
                  Назначить в группу
                </button>
              </div>
            </div>

            {newAssignment.role_code === 'PROFORG' && (
              <div className="p-3.5 bg-purple-50/50 border border-purple-100 rounded-xl space-y-2 mt-2">
                <span className="font-bold text-purple-900 text-xs flex items-center">
                  <FileCheck className="h-4 w-4 mr-1 text-purple-600" /> Реквизиты протокола избрания профорга:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Номер протокола</label>
                    <input required type="text" placeholder="напр. № 4-П" value={newAssignment.protocol_number} onChange={(e) => setNewAssignment({...newAssignment, protocol_number: e.target.value})} className="w-full px-2 py-1 rounded border bg-white" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Дата протокола</label>
                    <input required type="date" value={newAssignment.protocol_date} onChange={(e) => setNewAssignment({...newAssignment, protocol_date: e.target.value})} className="w-full px-2 py-1 rounded border bg-white" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-0.5">Скан протокола (файл)</label>
                    <input type="file" onChange={onProtocolFileUpload} className="text-[11px] w-full file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-purple-100 file:text-purple-700" />
                    {isUploadingProtocol && <span className="text-[10px] text-purple-600 font-bold block mt-0.5">Загрузка файла...</span>}
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Текущий состав группы */}
          {groupDetails && (
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-2">
              <h4 className="font-bold text-slate-800">Текущий состав группы {groupDetails.name}</h4>
              <div className="space-y-1">
                {groupDetails.curators?.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                    <span className="font-semibold text-slate-800">{c.username} (Куратор)</span>
                    <button onClick={() => onUnassignRole(c.user_id, 'CURATOR')} className="text-red-500 font-bold hover:underline">Снять</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. ПОЛЯ ПАСПОРТА */}
      {adminSubTab === 'fields' && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-zab-teal space-y-4 text-xs">
          <div className="flex items-center space-x-2 border-b pb-3">
            <Sliders className="h-5 w-5 text-zab-teal" />
            <h3 className="font-bold text-sm text-slate-800">Конструктор динамических полей паспорта</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-2">
              {dynamicFields.map(f => (
                <div key={f.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className={`font-bold ${f.is_active ? 'text-slate-800' : 'text-slate-400 line-through'}`}>{f.label}</span>
                    <span className="text-slate-400 ml-2 font-mono text-[10px]">({f.name} • {f.type})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => onToggleDynamicField(f)} className="cursor-pointer">
                      {f.is_active ? <ToggleRight className="h-5 w-5 text-zab-teal" /> : <ToggleLeft className="h-5 w-5 text-slate-400" />}
                    </button>
                    <button onClick={() => onDeleteDynamicField(f.id)} className="text-red-500 hover:text-red-700 cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={onCreateDynamicField} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 h-fit">
              <h4 className="font-bold text-slate-800">Создать поле</h4>
              <input required type="text" placeholder="Название (label)" value={newFieldForm.label} onChange={(e) => setNewFieldForm({...newFieldForm, label: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
              <input required type="text" placeholder="Ключ (name)" value={newFieldForm.name} onChange={(e) => setNewFieldForm({...newFieldForm, name: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
              <select value={newFieldForm.type} onChange={(e) => setNewFieldForm({...newFieldForm, type: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border bg-white">
                <option value="text">Текст</option>
                <option value="number">Число</option>
                <option value="date">Дата</option>
                <option value="boolean">Да/Нет (чекбокс)</option>
              </select>
              <button type="submit" className="w-full py-2 bg-zab-teal hover:bg-zab-teal-hover text-white font-bold rounded-lg shadow cursor-pointer">Создать поле</button>
            </form>
          </div>
        </div>
      )}

      {/* 6. СПРАВОЧНИКИ */}
      {adminSubTab === 'directories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-800">Социальные категории</h4>
            <form onSubmit={onCreateCategory} className="flex gap-2">
              <input required type="text" placeholder="Новая категория..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} className="flex-grow px-2.5 py-1.5 rounded-lg border" />
              <button type="submit" className="px-3 py-1.5 bg-zab-teal text-white font-bold rounded-lg cursor-pointer">Создать</button>
            </form>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {socialCategories.map(c => <div key={c.id} className="p-2 bg-slate-50 rounded-lg">{c.name}</div>)}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-800">Студенческие организации</h4>
            <form onSubmit={onCreateOrganization} className="flex gap-2">
              <input required type="text" placeholder="Новая организация..." value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} className="flex-grow px-2.5 py-1.5 rounded-lg border" />
              <button type="submit" className="px-3 py-1.5 bg-zab-teal text-white font-bold rounded-lg cursor-pointer">Создать</button>
            </form>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {organizations.map(o => <div key={o.id} className="p-2 bg-slate-50 rounded-lg">{o.name}</div>)}
            </div>
          </div>
        </div>
      )}

      {/* 7. САНКЦИИ И БАЛЛЫ */}
      {adminSubTab === 'sanctions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <form onSubmit={onAdjustPoints} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2.5">
            <h4 className="font-bold text-slate-800">Корректировка баллов куратора</h4>
            <select required value={pointsAdjustment.curator_id} onChange={(e) => setPointsAdjustment({...pointsAdjustment, curator_id: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border bg-white">
              <option value="">-- Выберите куратора --</option>
              {allUsersList.filter(u => u.system_role === 'USER' || u.system_role === 'CURATOR').map(c => <option key={c.id} value={c.id}>{c.username}</option>)}
            </select>
            <input required type="number" placeholder="Баллы (+/-)" value={pointsAdjustment.points} onChange={(e) => setPointsAdjustment({...pointsAdjustment, points: parseInt(e.target.value)})} className="w-full px-2.5 py-1.5 rounded-lg border" />
            <input required type="text" placeholder="Причина" value={pointsAdjustment.reason} onChange={(e) => setPointsAdjustment({...pointsAdjustment, reason: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border" />
            <button type="submit" className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg cursor-pointer">Применить баллы</button>
          </form>

          <form onSubmit={onIssueViolation} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2.5">
            <h4 className="font-bold text-slate-800">Вынесение дисциплинарной отметки (⚠)</h4>
            <select required value={disciplinaryMark.curator_id} onChange={(e) => setDisciplinaryMark({...disciplinaryMark, curator_id: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border bg-white">
              <option value="">-- Выберите куратора --</option>
              {allUsersList.filter(u => u.system_role === 'USER' || u.system_role === 'CURATOR').map(c => <option key={c.id} value={c.id}>{c.username}</option>)}
            </select>
            <textarea required rows="2" placeholder="Суть нарушения..." value={disciplinaryMark.reason} onChange={(e) => setDisciplinaryMark({...disciplinaryMark, reason: e.target.value})} className="w-full px-2.5 py-1.5 rounded-lg border" />
            <button type="submit" className="w-full py-2 bg-red-700 hover:bg-red-800 text-white font-bold rounded-lg cursor-pointer">Установить отметку (⚠)</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminTab;