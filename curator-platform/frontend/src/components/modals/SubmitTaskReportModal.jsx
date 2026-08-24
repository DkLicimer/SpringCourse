import React from 'react';
import { RefreshCw } from 'lucide-react';

function SubmitTaskReportModal({ 
  execution, 
  onClose, 
  onFileUpload, 
  isUploadingFile, 
  uploadedPhotoUrl, 
  confirmedRequirements, 
  setConfirmedRequirements, 
  onSubmit 
}) {
  if (!execution) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zab-navy/80 flex items-center justify-center p-4 backdrop-blur-sm">
      <form onSubmit={onSubmit} className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl border-t-8 border-t-zab-teal space-y-3 text-xs">
        <h3 className="font-bold text-sm text-slate-800">Отправить фотоотчет по задаче</h3>
        <p className="font-bold text-zab-teal">{execution.task?.title}</p>
        
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center relative cursor-pointer hover:bg-slate-50">
          <input type="file" accept="image/*" onChange={onFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          {isUploadingFile ? (
            <div className="flex flex-col items-center"><RefreshCw className="animate-spin h-5 w-5 text-zab-teal mb-1" /> Загрузка файла...</div>
          ) : uploadedPhotoUrl ? (
            <span className="text-emerald-600 font-bold">✓ Фотография прикреплена</span>
          ) : (
            <span className="text-slate-500 font-bold">Нажмите для выбора фотоотчета</span>
          )}
        </div>

        <div className="flex items-start space-x-2 bg-slate-50 p-2.5 rounded-xl border">
          <input 
            type="checkbox" 
            id="confirm_box" 
            checked={confirmedRequirements} 
            onChange={(e) => setConfirmedRequirements(e.target.checked)} 
            className="rounded text-zab-teal mt-0.5" 
          />
          <label htmlFor="confirm_box" className="font-semibold text-slate-600 cursor-pointer">
            Подтверждаю выполнение требований задачи и присутствие на фото.
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <button type="submit" className="px-4 py-1.5 bg-zab-teal hover:bg-zab-teal-hover text-white font-bold rounded-lg shadow cursor-pointer">Отправить</button>
          <button type="button" onClick={onClose} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer">Отмена</button>
        </div>
      </form>
    </div>
  );
}

export default SubmitTaskReportModal;