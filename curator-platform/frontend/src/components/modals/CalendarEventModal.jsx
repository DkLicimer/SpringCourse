import React from 'react';
import { formatChitaTime } from '../../utils/dateUtils';
import { Calendar, MapPin } from 'lucide-react';

function CalendarEventModal({ item, onClose, onGoToTasks }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zab-navy/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border-t-8 border-t-zab-teal text-xs space-y-3">
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-zab-teal" />
          <h3 className="font-bold text-sm text-slate-800">{item.title}</h3>
        </div>

        {/* Вывод диапазона дат события (если многодневное) */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5">
          <div>
            <span className="text-slate-400 block font-semibold text-[11px]">Время проведения (Чита):</span>
            <span className="font-bold text-slate-700">
              {item.end_date_time ? (
                `${formatChitaTime(item.date_time)} — ${formatChitaTime(item.end_date_time)}`
              ) : (
                formatChitaTime(item.date_time)
              )}
            </span>
          </div>

          {item.location && (
            <div className="flex items-center text-slate-600 mt-1">
              <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" />
              <span>{item.location}</span>
            </div>
          )}

          <div className="pt-1">
            {item.is_mandatory ? (
              <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-red-100 text-red-700">
                Обязательное мероприятие
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full font-black text-[10px] bg-orange-100 text-orange-700">
                Мероприятие на выбор
              </span>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          {item.type === 'task_deadline' && (
            <button 
              onClick={() => { onClose(); onGoToTasks(); }} 
              className="px-3 py-1.5 bg-zab-teal hover:bg-zab-teal-hover text-white font-bold rounded-lg shadow cursor-pointer transition-colors"
            >
              К задаче
            </button>
          )}
          <button 
            onClick={onClose} 
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

export default CalendarEventModal;