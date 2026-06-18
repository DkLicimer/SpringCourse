import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import BookingPage from './pages/BookingPage';
import SuccessPage from './pages/SuccessPage';

function App() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText("projectsddm@zabgu.ru");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        
        {/* Шапка сайта */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            
            {/* Ссылка-логотип ЗабГУ с фирменной синей подложкой */}
            <Link to="/" className="flex items-center hover:opacity-90 transition duration-150 py-1">
              <img 
                src="/logo.png" 
                alt="ЗабГУ Забайкальский Государственный Университет" 
                className="h-10 sm:h-12 object-contain bg-natural-blue px-3 py-1.5 rounded-lg shadow-xs"
                onError={(e) => {
                  // Фолбек на случай отсутствия картинки
                  e.target.style.display = 'none';
                }}
              />
            </Link>
            
            <div className="flex items-center space-x-6">
              <button 
                onClick={handleCopyEmail}
                className="hidden md:block text-sm font-medium text-gray-700 hover:text-natural-blue focus:outline-none cursor-pointer transition duration-150"
                title="Нажмите, чтобы скопировать email"
              >
                {copied ? "✅ Почта скопирована!" : "✉️ projectsddm@zabgu.ru"}
              </button>
              <Link 
                to="/booking" 
                className="bg-natural-blue text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition duration-150"
              >
                Забронировать
              </Link>
            </div>
          </div>
        </header>

        {/* Основной контент */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/booking" element={<BookingPage />} />
            <Route path="/booking-success/:id" element={<SuccessPage />} />
          </Routes>
        </main>

        {/* Подвал сайта */}
        <footer className="bg-gray-900 text-gray-400 py-8 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm">
            <div>
              <p className="text-white font-medium">© 2026 Университетская база отдыха «Арахлей» ЗабГУ</p>
              <p className="text-xs mt-1">Все права защищены.</p>
            </div>
            <div className="flex space-x-6">
              <span className="text-xs">Адрес: г. Чита, ул. Бабушкина, 129, каб. 243</span>
            </div>
          </div>
        </footer>

      </div>
    </Router>
  );
}

export default App;