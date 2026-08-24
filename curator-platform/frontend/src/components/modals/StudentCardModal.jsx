import React from 'react';
import { Star } from 'lucide-react';

function StudentCardModal({ 
  student, 
  onClose, 
  form, 
  setForm, 
  activeDynamicFields, 
  onSave, 
  onAssignStarosta 
}) {
  if (!student) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zab-navy/80 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
      <form onSubmit={onSave} className="bg-white rounded-3xl p-5 max-w-2xl w-full shadow-2xl border-t-8 border-t-zab-teal grid grid-cols-1 sm:grid-cols-2 gap-4 my-8 text-xs">
        
        {/* QR-код и назначение старостой */}
        <div className="bg-slate-50 p-4 rounded-xl border flex flex-col items-center justify-between text-center space-y-3">
          <div>
            <div className="h-14 w-14 bg-zab-teal/10 text-zab-teal rounded-full flex items-center justify-center mx-auto text-lg font-black mb-1">
              {form.last_name[0] || ''}{form.first_name[0] || ''}
            </div>
            <h3 className="font-bold text-sm text-slate-800">{form.last_name} {form.first_name}</h3>
          </div>

          <div className="p-2.5 bg-white border rounded-xl inline-block shadow-inner mx-auto">
            <svg viewBox="0 0 100 100" className="h-24 w-24 text-zab-navy" fill="none" stroke="currentColor" strokeWidth="3">
              <rect x="5" y="5" width="25" height="25" rx="3" strokeWidth="5" />
              <rect x="11" y="11" width="13" height="13" rx="1" fill="currentColor" />
              <rect x="70" y="5" width="25" height="25" rx="3" strokeWidth="5" />
              <rect x="76" y="11" width="13" height="13" rx="1" fill="currentColor" />
              <rect x="5" y="70" width="25" height="25" rx="3" strokeWidth="5" />
              <rect x="11" y="76" width="13" height="13" rx="1" fill="currentColor" />
              <path d="M42,45 C42,39 48,35 52,37 C54,39 53,44 48,47 C45,49 46,54 50,56 C53,58 54,63 52,65" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-[9px] font-mono text-slate-400 block uppercase">Токен: {student.qr_token.substring(0, 13)}...</span>

          <button 
            type="button" 
            onClick={() => onAssignStarosta(student.id, `${form.last_name} ${form.first_name}`)}
            className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow flex items-center justify-center cursor-pointer"
          >
            <Star className="h-3.5 w-3.5 mr-1 fill-current" /> Назначить старостой группы
          </button>
        </div>

        {/* Поля социального паспорта */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-700 border-b pb-1">Сведения паспорта</h4>
          <input required type="text" placeholder="Фамилия" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
          <input required type="text" placeholder="Имя" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
          <input type="text" placeholder="Отчество" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} className="w-full px-2.5 py-1.5 rounded-lg border bg-white" />
          
          <div className="flex items-center space-x-2 py-1">
            <input type="checkbox" id="modal_union" checked={form.is_union_member} onChange={(e) => setForm({ ...form, is_union_member: e.target.checked })} className="rounded text-zab-teal" />
            <label htmlFor="modal_union" className="font-semibold text-slate-700">Состоит в профсоюзе</label>
          </div>

          {/* Динамические поля */}
          {activeDynamicFields.map(field => (
            <div key={field.id}>
              <label className="block font-bold text-slate-600 mb-0.5">{field.label}</label>
              {field.type === 'boolean' ? (
                <input 
                  type="checkbox" 
                  checked={form.dynamic_values[field.id] === 'true' || form.dynamic_values[field.id] === true} 
                  onChange={(e) => setForm({ ...form, dynamic_values: { ...form.dynamic_values, [field.id]: e.target.checked } })} 
                  className="rounded text-zab-teal" 
                />
              ) : (
                <input 
                  type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} 
                  value={form.dynamic_values[field.id] || ''} 
                  onChange={(e) => setForm({ ...form, dynamic_values: { ...form.dynamic_values, [field.id]: e.target.value } })} 
                  className="w-full px-2.5 py-1.5 rounded-lg border bg-white" 
                />
              )}
            </div>
          ))}

          <div className="pt-2 flex gap-2">
            <button type="submit" className="flex-1 py-1.5 bg-zab-teal hover:bg-zab-teal-hover text-white font-bold rounded-lg shadow cursor-pointer">Сохранить</button>
            <button type="button" onClick={onClose} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer">Закрыть</button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default StudentCardModal;