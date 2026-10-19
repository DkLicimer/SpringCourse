import React from 'react';

function GroupSelector({ 
  groups, 
  filteredGroups, 
  selectedGroupId, 
  setSelectedGroupId, 
  groupSearchQuery, 
  setGroupSearchQuery, 
  course 
}) {
  if (!groups || groups.length === 0) return null;

  return (
    <div className="bg-zab-blue text-white px-4 md:px-6 py-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between shadow-inner border-t border-slate-800 text-xs gap-2">
      {/* Выпадающий список групп */}
      <div className="flex items-center space-x-2 flex-grow max-w-md">
        <span className="font-bold text-slate-300 shrink-0">Группа:</span>
        <select 
          value={selectedGroupId} 
          onChange={(e) => setSelectedGroupId(e.target.value)} 
          className="bg-zab-navy text-white font-bold px-3 py-1.5 rounded-lg border border-slate-700 focus:ring-1 focus:ring-zab-teal cursor-pointer w-full text-xs"
        >
          {filteredGroups.map(g => (
            <option key={g.id} value={g.id}>{g.name} ({g.faculty})</option>
          ))}
        </select>
      </div>

      {/* Быстрый фильтр и номер курса */}
      <div className="flex items-center justify-between sm:justify-end space-x-3">
        <input 
          type="text" 
          placeholder="Фильтр групп..." 
          value={groupSearchQuery} 
          onChange={(e) => setGroupSearchQuery(e.target.value)} 
          className="bg-zab-navy/60 border border-slate-700 px-2.5 py-1 rounded-lg text-white text-[11px] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-zab-teal w-32 sm:w-40"
        />
        <span className="text-slate-400 font-mono shrink-0">Курс {course || 1}</span>
      </div>
    </div>
  );
}

export default GroupSelector;