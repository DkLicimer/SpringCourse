import React from 'react';

function StatisticsTab({ 
  students, 
  attendanceSessions, 
  onExportRatingCSV 
}) {
  return (
    <div className="space-y-4 text-xs">
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <span className="font-bold text-sm text-slate-800">Экспорт данных в Excel (Деканат)</span>
        <button onClick={onExportRatingCSV} className="px-3 py-1.5 bg-zab-teal text-white font-bold rounded-lg shadow cursor-pointer">
          Рейтинг CSV
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100">
          <span className="text-slate-400 font-bold block">Студентов в группе</span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{students.length} чел.</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100">
          <span className="text-slate-400 font-bold block">Охват профсоюза</span>
          <span className="text-2xl font-black text-zab-teal mt-1 block">{students.filter(s => s.is_union_member).length} из {students.length}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100">
          <span className="text-slate-400 font-bold block">Сессий посещаемости</span>
          <span className="text-2xl font-black text-emerald-600 mt-1 block">{attendanceSessions.length}</span>
        </div>
      </div>
    </div>
  );
}

export default StatisticsTab;