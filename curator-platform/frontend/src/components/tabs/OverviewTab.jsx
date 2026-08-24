import React from 'react';
import { Users, Award, Calendar, CheckSquare, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { formatChitaTime } from '../../utils/dateUtils';

function OverviewTab({ 
  groupDetails, 
  approvedMyTasksCount, 
  totalMyTasksCount, 
  completionPercentage, 
  myPointsCalculated, 
  isMyViolation, 
  calendar, 
  currentCalDate, 
  setCurrentCalDate, 
  getCalendarGridDays, 
  getEventsForDay, 
  onSelectCalItem 
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Карточка 1: Моя группа */}
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

      {/* Карточка 2: Мой прогресс */}
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
              <div className="bg-zab-teal h-2 rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-500 font-bold">Баллы:</span>
          <span className="text-lg font-black text-emerald-600">{myPointsCalculated} б.</span>
        </div>
      </div>

      {/* Карточка 3: Ближайшие события */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-zab-teal">
        <div className="flex items-center space-x-2.5 mb-3">
          <div className="bg-purple-50 p-2 rounded-xl text-purple-600"><Calendar className="h-5 w-5" /></div>
          <h2 className="text-sm font-bold text-slate-800">Ближайшие события плана</h2>
        </div>
        <div className="space-y-2 max-h-[190px] overflow-y-auto">
          {calendar.slice(0, 3).map((item) => (
            <div key={item.id} onClick={() => onSelectCalItem(item)} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 flex items-start space-x-2 cursor-pointer hover:bg-slate-100 transition-colors">
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

      {/* Интерактивная сетка календаря */}
      <div className="lg:col-span-3 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 border-t-4 border-t-zab-teal">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-zab-teal" />
            <h2 className="text-sm font-bold text-slate-800">Календарь плана ЗабГУ (время Читы)</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() - 1, 1))} className="p-1 rounded border hover:bg-slate-50 cursor-pointer"><ChevronLeft className="h-4 w-4" /></button>
            <span className="font-bold text-xs uppercase text-slate-700">{currentCalDate.toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => setCurrentCalDate(new Date(currentCalDate.getFullYear(), currentCalDate.getMonth() + 1, 1))} className="p-1 rounded border hover:bg-slate-50 cursor-pointer"><ChevronRight className="h-4 w-4" /></button>
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
                        <div key={evt.id} onClick={() => onSelectCalItem(evt)} className={`text-[9px] px-1 py-0.5 rounded font-bold truncate cursor-pointer ${evt.type === 'event' ? 'bg-purple-100 text-purple-800' : 'bg-amber-100 text-amber-800'}`} title={evt.title}>
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
  );
}

export default OverviewTab;