import React from 'react';

function CreateSessionModal({ isOpen, onClose, form, setForm, onSubmit }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zab-navy/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border-t-8 border-t-zab-teal space-y-3 text-xs">
        <h3 className="font-bold text-sm text-slate-800">Начать занятие / собрание группы</h3>
        <div>
          <label className="block font-bold text-slate-600 mb-1">Тема занятия</label>
          <input 
            required 
            type="text" 
            value={form.title} 
            onChange={(e) => setForm({ ...form, title: e.target.value })} 
            className="w-full px-2.5 py-1.5 rounded-lg border bg-white" 
          />
        </div>
        <div>
          <label className="block font-bold text-slate-600 mb-1">Дата проведения</label>
          <input 
            required 
            type="date" 
            value={form.date} 
            onChange={(e) => setForm({ ...form, date: e.target.value })} 
            className="w-full px-2.5 py-1.5 rounded-lg border bg-white" 
          />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t">
          <button type="submit" className="px-4 py-1.5 bg-zab-teal text-white font-bold rounded-lg shadow cursor-pointer">
            Начать
          </button>
          <button type="button" onClick={onClose} className="px-4 py-1.5 bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateSessionModal;