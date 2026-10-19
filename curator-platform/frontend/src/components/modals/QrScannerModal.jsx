import React from 'react';

function QrScannerModal({ isOpen, onClose, scannerMessage }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-zab-navy/90 flex flex-col items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border-t-8 border-t-zab-teal text-center space-y-3 text-xs">
        <div className="flex justify-between items-center border-b pb-2">
          <span className="font-bold text-slate-800">Сканирование QR-кода студента</span>
          <button onClick={onClose} className="text-slate-400 font-bold text-lg cursor-pointer">×</button>
        </div>

        {/* Контейнер видоискателя камеры */}
        <div id="qr-reader-container" className="w-full h-64 bg-slate-900 rounded-2xl overflow-hidden shadow-inner"></div>

        {scannerMessage && (
          <div className={`p-2.5 rounded-xl font-bold text-xs ${scannerMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
            {scannerMessage.text}
          </div>
        )}

        <button onClick={onClose} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer">
          Закрыть
        </button>
      </div>
    </div>
  );
}

export default QrScannerModal;