import React from 'react';
import { ExternalLink, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatChitaTime } from '../../utils/dateUtils';

function TasksTab({ 
  user, 
  myTasks, 
  allExecutions, 
  reviewComment, 
  setReviewComment, 
  onReviewTask, 
  onOpenSubmitReport, 
  onSubmitTaskWithoutPhoto 
}) {
  const isAdmin = user?.system_role === 'ADMIN';

  // Преобразование URL файла к корректному виду (без хардкода localhost)
  const getSafeFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://localhost:8000')) {
      return url.replace('http://localhost:8000', '');
    }
    return url;
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
      <h2 className="text-sm font-bold text-slate-800">
        {isAdmin ? 'Контроль отчетов кураторов (Все группы ЗабГУ)' : 'Мои поручения и план мероприятий'}
      </h2>

      {isAdmin ? (
        <div className="space-y-3 text-xs">
          {allExecutions.map(exe => {
            const isMandatory = exe.task?.category === 'mandatory';

            return (
              <div key={exe.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/70 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b pb-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-sm text-slate-900 block">{exe.task?.title}</span>
                      {/* Метка Обязательное / На выбор */}
                      {isMandatory ? (
                        <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-red-100 text-red-700 border border-red-200">
                          Обязательное
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-orange-100 text-orange-700 border border-orange-200">
                          На выбор
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-zab-teal font-bold">
                      Куратор: {exe.curator_username} • Группа: {exe.group_name} • Награда: {exe.task?.points} б.
                    </span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] self-start sm:self-auto ${
                    exe.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 
                    exe.status === 'PENDING' ? 'bg-amber-100 text-amber-800 animate-pulse' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {exe.status === 'APPROVED' ? 'Одобрен ✓' : exe.status === 'PENDING' ? 'На проверке' : 'Доработка'}
                  </span>
                </div>

                <p className="text-slate-600 text-xs">{exe.task?.description}</p>
                
                {exe.photo_url && (
                  <div className="pt-1">
                    <a 
                      href={getSafeFileUrl(exe.photo_url)} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center text-zab-teal font-bold underline hover:text-zab-teal-hover"
                    >
                      <FileText className="h-4 w-4 mr-1" /> Открыть прикрепленный файл / фотоотчет
                    </a>
                  </div>
                )}

                {exe.status === 'PENDING' && (
                  <div className="pt-2 border-t flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input 
                      type="text" 
                      placeholder="Замечание при возврате..." 
                      value={reviewComment[exe.id] || ''} 
                      onChange={(e) => setReviewComment({ ...reviewComment, [exe.id]: e.target.value })} 
                      className="flex-grow px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs" 
                    />
                    <div className="flex gap-2">
                      <button onClick={() => onReviewTask(exe.id, true)} className="flex-1 px-4 py-1.5 bg-emerald-600 text-white font-bold rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors">
                        Одобрить (+{exe.task?.points} б.)
                      </button>
                      <button onClick={() => onReviewTask(exe.id, false)} className="flex-1 px-4 py-1.5 bg-red-600 text-white font-bold rounded-lg cursor-pointer hover:bg-red-700 transition-colors">
                        Вернуть
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {allExecutions.length === 0 && (
            <div className="text-center text-slate-400 py-8 text-xs">Нет отчетов на проверке.</div>
          )}
        </div>
      ) : (
        <div className="space-y-3 text-xs">
          {myTasks.map(exe => {
            const isMandatory = exe.task?.category === 'mandatory';

            return (
              <div key={exe.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center flex-wrap gap-2">
                    <span className="font-bold text-sm text-slate-800">{exe.task?.title}</span>
                    
                    {/* Требование заказчика: Обязательное (красным), На выбор (оранжевым) */}
                    {isMandatory ? (
                      <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-red-100 text-red-700 border border-red-200">
                        Обязательное
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-orange-100 text-orange-700 border border-orange-200">
                        На выбор
                      </span>
                    )}

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      exe.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {exe.status === 'APPROVED' ? 'Выполнено ✓' : exe.status === 'PENDING' ? 'На проверке' : 'К выполнению'}
                    </span>
                  </div>

                  <p className="text-slate-500 text-xs mt-0.5">{exe.task?.description}</p>
                  
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
                    <span className="bg-zab-teal/10 text-zab-teal font-bold px-1.5 py-0.5 rounded">
                      Награда: {exe.task?.points} б.
                    </span>
                    <span className="text-slate-400">
                      Срок сдачи: {formatChitaTime(exe.task?.due_date)}
                    </span>
                  </div>

                  {exe.admin_comment && (
                    <p className="text-red-600 font-bold mt-1 text-xs">
                      Замечание администратора: {exe.admin_comment}
                    </p>
                  )}
                </div>

                {exe.status !== 'APPROVED' && (
                  <div className="shrink-0 self-end sm:self-auto">
                    {exe.task?.type === 'photo_proof' ? (
                      <button 
                        onClick={() => onOpenSubmitReport(exe)} 
                        className="px-4 py-2 bg-zab-teal hover:bg-zab-teal-hover text-white font-bold rounded-xl shadow cursor-pointer transition-colors"
                      >
                        Загрузить отчет
                      </button>
                    ) : (
                      <button 
                        onClick={() => onSubmitTaskWithoutPhoto(exe.id)} 
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow cursor-pointer transition-colors"
                      >
                        Подтвердить участие
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {myTasks.length === 0 && (
            <div className="text-center text-slate-400 py-8 text-xs">
              Задач пока нет. Как только администратор добавит мероприятия или закрепит группу, они появятся в этом разделе.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TasksTab;