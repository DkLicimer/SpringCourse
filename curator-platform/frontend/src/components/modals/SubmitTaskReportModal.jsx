import React from 'react';
import { RefreshCw, Upload, CheckCircle2 } from 'lucide-react';

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
        <h3 className="font-bold text-sm text-slate-800">Прикрепить отчет по задаче</h3>
        <p className="font-bold text-zab-teal">{execution.task?.title}</p>
        
        {/* Поддержка изображений, документов PDF, Word, архивов */}
        <div className="border-2 border-dashed border-slate-200 rounded-2xl p-5 text-center relative cursor-pointer hover:bg-slate-50 transition-colors">
          <input 
            type="file" 
            accept="image/*,.pdf,.doc,.docx,.zip,.rar" 
            onChange={onFileUpload} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          />
          {isUploadingFile ? (
            <div className="flex flex-col items-center">
              <RefreshCw className="animate-spin h-5 w-5 text-zab-teal mb-1" /> 
              <span>Загрузка файла...</span>
            </div>
          ) : uploadedPhotoUrl ? (
            <div className="flex flex-col items-center text-emerald-600 font-bold">
              <CheckCircle2 className="h-6 w-6 mb-1 text-emerald-500" />
              <span>Файл отчета успешно прикреплен!</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-slate-500">
              <Upload className="h-6 w-6 mb-1 text-zab-teal" />
              <span className="font-bold">Нажмите для выбора фото или документа</span>
              <span className="text-[10px] text-slate-400 mt-1">Поддерживаются: JPG, PNG, PDF, DOCX, ZIP</span>
            </div>
          )}
        </div>

        <div className="flex items-start space-x-2 bg-slate-50 p-2.5 rounded-xl border">
          <input 
            type="checkbox" 
            id="confirm_box" 
            checked={confirmedRequirements} 
            onChange={(e) => setConfirmedRequirements(e.target.checked)} 
            className="rounded text-zab-teal mt-0.5 cursor-pointer" 
          />
          <label htmlFor="confirm_box" className="font-semibold text-slate-600 cursor-pointer text-[11px]">
            Подтверждаю выполнение требований задачи и достоверность прикрепленных материалов.
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <button type="submit" className="px-4 py-1.5 bg-zab-teal hover:bg-zab-teal-hover text-white font-bold rounded-lg shadow cursor-pointer transition-colors">
            Отправить на проверку
          </button>
          <button type="button" onClick={onClose} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer transition-colors">
            Отмена
          </button>
        </div>
      </form>
    </div>
  );
}

export default SubmitTaskReportModal;