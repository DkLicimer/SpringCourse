import React from 'react';
import { AlertTriangle } from 'lucide-react';

function RatingTab({ 
  user, 
  ratingList, 
  ratingPeriod, 
  setRatingPeriod, 
  onExportRatingCSV 
}) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Турнирная таблица кураторов</h2>
          <span className="text-[11px] text-slate-400">Ранжирование по баллам и проценту выполнения</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <select 
            value={ratingPeriod} 
            onChange={(e) => setRatingPeriod(e.target.value)} 
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white cursor-pointer"
          >
            <option value="all">За все время (Год)</option>
            <option value="semester1">1 семестр</option>
            <option value="semester2">2 семестр</option>
            <option value="month">Текущий месяц</option>
          </select>
          <button onClick={onExportRatingCSV} className="px-3 py-1.5 bg-zab-teal text-white font-bold text-xs rounded-lg shadow cursor-pointer">
            CSV
          </button>
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
  );
}

export default RatingTab;