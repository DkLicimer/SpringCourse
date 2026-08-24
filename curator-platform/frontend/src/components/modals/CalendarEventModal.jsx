import React from 'react';
import { formatChitaTime } from '../../utils/dateUtils';

function CalendarEventModal({ item, onClose, onGoToTasks }) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zab-navy/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border-t-8 border-t-zab-teal text-xs space-y-3">
        <h3 className="font-bold text-sm text-slate-800">{item.title}</h3>
        <p className="text-slate-500">Время проведения (Чита): {formatChitaTime(item.date_time)}</p>
        <div className="flex justify-end gap-2 pt-2 border-t">
          {item.type === 'task_deadline' && (
            <button 
              onClick={() => { onClose(); onGoToTasks(); }} 
              className="px-3 py-1.5 bg-zab-teal text-white font-bold rounded-lg shadow cursor-pointer"
            >
              К задаче
            </button>
          )}
          <button 
            onClick={onClose} 
            className="px-3 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

export default CalendarEventModal;