import React from 'react';
import { Search, UserPlus, Briefcase, Star } from 'lucide-react';
import { formatChitaTime } from '../../utils/dateUtils';

function StudentsTab({ 
  groupDetails, 
  students, 
  searchQuery, 
  setSearchQuery, 
  activeDynamicFields, 
  newStudent, 
  setNewStudent, 
  onAddStudent, 
  onOpenStudentCard, 
  onOpenSelectStarosta, 
  onUnassignRole 
}) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
      
      {/* Плашка старосты группы */}
      {groupDetails && (
        groupDetails.starosta ? (
          <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 bg-amber-500 text-white rounded-xl flex items-center justify-center font-bold shadow-sm shrink-0">
                ★
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-xs text-amber-950">Староста группы:</span>
                  <span className="font-black text-sm text-amber-900">{groupDetails.starosta.username}</span>
                </div>
                <span className="text-[10px] text-amber-700">
                  Полномочия действуют с {formatChitaTime(groupDetails.starosta.assigned_at, { hour: undefined, minute: undefined })}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 self-end sm:self-auto">
              <button 
                onClick={onOpenSelectStarosta}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-colors"
              >
                Сменить старосту
              </button>
              <button 
                onClick={() => onUnassignRole(groupDetails.starosta.user_id, 'STAROSTA')}
                className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-300 cursor-pointer transition-colors"
              >
                Снять
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
            <span className="font-bold text-slate-500">В этой группе еще не назначен староста</span>
            <button 
              onClick={onOpenSelectStarosta}
              className="px-4 py-2 bg-zab-teal hover:bg-zab-teal-hover text-white font-bold rounded-xl shadow cursor-pointer flex items-center"
            >
              <Star className="h-4 w-4 mr-1.5 fill-current" /> Назначить старосту из списка группы
            </button>
          </div>
        )
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        
        {/* Список студентов */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-800">Список студентов ({students.length} чел.)</h2>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Поиск по ФИО..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-zab-teal" 
              />
            </div>
          </div>

          {students.length > 0 && (
            <div className="bg-cyan-50/50 p-3 rounded-xl border border-cyan-100 flex justify-between items-center text-xs font-bold text-slate-700">
              <span className="flex items-center"><Briefcase className="h-4 w-4 mr-1.5 text-zab-teal" /> Профсоюзный учет</span>
              <span className="text-zab-teal">Членов: {students.filter(s => s.is_union_member).length} из {students.length} ({Math.round((students.filter(s => s.is_union_member).length / students.length) * 100)}%)</span>
            </div>
          )}

          {/* Таблица на десктопе */}
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
                {students.map(s => {
                  const isStudentStarosta = groupDetails?.starosta && (
                    groupDetails.starosta.user_id === s.user_id || 
                    groupDetails.starosta.username.includes(s.last_name)
                  );

                  return (
                    <tr key={s.id} onClick={() => onOpenStudentCard(s)} className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer">
                      <td className="py-2.5 font-bold text-slate-800 flex items-center space-x-2">
                        <span>{s.last_name} {s.first_name} {s.middle_name || ''}</span>
                        {isStudentStarosta && (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center">
                            ★ Староста
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-center">{s.is_union_member ? <span className="bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">Да ✓</span> : <span className="text-slate-300">-</span>}</td>
                      <td className="py-2.5"><div className="flex flex-wrap gap-1">{s.social_categories?.map(c => <span key={c.id} className="bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded">{c.name}</span>)}</div></td>
                      <td className="py-2.5"><div className="flex flex-wrap gap-1">{s.organizations?.map(o => <span key={o.id} className="bg-zab-teal/10 text-zab-teal text-[10px] font-bold px-1.5 py-0.5 rounded">{o.name}</span>)}</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Карточки на смартфонах */}
          <div className="md:hidden space-y-2">
            {students.map(s => {
              const isStudentStarosta = groupDetails?.starosta && (
                groupDetails.starosta.user_id === s.user_id || 
                groupDetails.starosta.username.includes(s.last_name)
              );

              return (
                <div key={s.id} onClick={() => onOpenStudentCard(s)} className="p-3 bg-slate-50 border rounded-xl space-y-1 cursor-pointer">
                  <div className="flex justify-between font-bold text-xs items-center">
                    <span className="flex items-center space-x-1.5">
                      <span>{s.last_name} {s.first_name}</span>
                      {isStudentStarosta && <span className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0.2 rounded font-black">★ Староста</span>}
                    </span>
                    {s.is_union_member && <span className="text-emerald-600 text-[10px]">Профсоюз ✓</span>}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {s.social_categories?.map(c => <span key={c.id} className="bg-amber-50 text-amber-700 text-[9px] px-1 rounded">{c.name}</span>)}
                    {s.organizations?.map(o => <span key={o.id} className="bg-zab-teal/10 text-zab-teal text-[9px] px-1 rounded">{o.name}</span>)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Форма добавления студента */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 h-fit space-y-3 text-xs">
          <div className="flex items-center space-x-2 border-b pb-2">
            <UserPlus className="h-4 w-4 text-zab-teal" />
            <h3 className="font-bold text-slate-800">Добавить студента</h3>
          </div>

          <form onSubmit={onAddStudent} className="space-y-2.5">
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
    </div>
  );
}

export default StudentsTab;