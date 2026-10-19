import React from 'react';
import { UserCheck, Camera, CheckCircle2, XCircle } from 'lucide-react';

function AttendanceTab({ 
  selectedSession, 
  sessionRecords, 
  presentCount, 
  totalStudentsCount, 
  attendanceRate, 
  manualQrInput, 
  setManualQrInput, 
  onOpenCreateSession, 
  onOpenScanner, 
  onSaveAttendance, 
  onManualQrSubmit, 
  onToggleStudentRecord 
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-sm text-slate-800 flex items-center">
            <UserCheck className="h-4 w-4 text-zab-teal mr-2" /> Учет посещаемости кураторского часа
          </h3>
          <p className="text-xs text-slate-400">Явка: {presentCount} из {totalStudentsCount} ({attendanceRate}%)</p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={onOpenCreateSession} 
            className="flex-1 sm:flex-none px-3.5 py-2 bg-zab-teal text-white font-bold text-xs rounded-xl shadow cursor-pointer"
          >
            + Начать занятие
          </button>
          {selectedSession && (
            <button 
              onClick={onOpenScanner} 
              className="flex-1 sm:flex-none px-3.5 py-2 bg-zab-navy text-white font-bold text-xs rounded-xl shadow cursor-pointer flex items-center justify-center"
            >
              <Camera className="h-4 w-4 mr-1 text-zab-teal" /> Сканер QR
            </button>
          )}
        </div>
      </div>

      {selectedSession && (
        <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="font-bold text-xs text-slate-800">{selectedSession.title}</span>
            <button onClick={onSaveAttendance} className="px-3 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg shadow cursor-pointer">
              Сохранить ведомость
            </button>
          </div>

          {/* Ручной ввод токена */}
          <form onSubmit={onManualQrSubmit} className="flex gap-2 text-xs">
            <input 
              type="text" 
              placeholder="Ввод токена QR вручную..." 
              value={manualQrInput} 
              onChange={(e) => setManualQrInput(e.target.value)} 
              className="flex-grow px-2.5 py-1.5 rounded-lg border bg-white" 
            />
            <button type="submit" className="px-3 py-1.5 bg-zab-blue text-white font-bold rounded-lg cursor-pointer">
              Отметить
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[450px] overflow-y-auto">
            {sessionRecords.map(rec => (
              <div 
                key={rec.student_id} 
                onClick={() => onToggleStudentRecord(rec.student_id)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer select-none transition-all ${
                  rec.is_present ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  {rec.is_present ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-slate-400" />}
                  <span className="font-bold text-xs">{rec.student_name}</span>
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${rec.is_present ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {rec.is_present ? 'Был ✓' : 'Нет'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AttendanceTab;