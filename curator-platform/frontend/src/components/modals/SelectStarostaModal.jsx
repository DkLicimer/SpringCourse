import React from 'react';
import { Star } from 'lucide-react';

function SelectStarostaModal({ isOpen, onClose, groupName, students, searchQuery, onSearchChange, onAssign }) {
  if (!isOpen) return null;

  const candidateStudents = students.filter(s => 
    `${s.last_name} ${s.first_name} ${s.middle_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-zab-navy/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border-t-8 border-t-amber-500 text-xs space-y-3">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="font-bold text-sm text-slate-800 flex items-center">
            <Star className="h-4 w-4 mr-1.5 text-amber-500 fill-current" /> Выбор старосты группы {groupName}
          </h3>
          <button onClick={onClose} className="text-slate-400 font-bold text-lg cursor-pointer">×</button>
        </div>

        <p className="text-slate-500 text-[11px]">Выберите студента из списка группы для назначения на роль старосты:</p>
        
        <input 
          type="text" 
          placeholder="Поиск студента по фамилии..." 
          value={searchQuery} 
          onChange={(e) => onSearchChange(e.target.value)} 
          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
        />

        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
          {candidateStudents.map(st => (
            <div 
              key={st.id} 
              className="p-2.5 bg-slate-50 hover:bg-amber-50 border border-slate-200 rounded-xl flex justify-between items-center transition-colors"
            >
              <span className="font-bold text-slate-800">{st.last_name} {st.first_name} {st.middle_name || ''}</span>
              <button 
                onClick={() => onAssign(st.id, `${st.last_name} ${st.first_name}`)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow cursor-pointer text-[11px]"
              >
                Назначить ★
              </button>
            </div>
          ))}
          {candidateStudents.length === 0 && <p className="text-center text-slate-400 py-4">Студенты не найдены.</p>}
        </div>

        <button onClick={onClose} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer">
          Отмена
        </button>
      </div>
    </div>
  );
}

export default SelectStarostaModal;