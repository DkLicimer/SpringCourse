import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import BookingPage from './pages/BookingPage';
import SuccessPage from './pages/SuccessPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        
        {/* Шапка сайта по ТЗ (Страница 3) */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Логотип университета (заглушка) */}
              <div className="w-10 h-10 bg-natural-blue text-white rounded-full flex items-center justify-center font-bold text-lg">
                У
              </div>
              <div>
                <span className="font-bold text-gray-900 block leading-tight text-sm sm:text-base">База отдыха «АРАХЛЕЙ»</span>
                <span className="text-xs text-gray-500">Официальный сайт бронирования</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <a href="tel:+79991234567" className="hidden md:block text-sm font-medium text-gray-700 hover:text-natural-blue">
                📞 +7 (999) 123-45-67
              </a>
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

        {/* Подвал сайта по ТЗ (Страница 4) */}
        <footer className="bg-gray-900 text-gray-400 py-8 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm">
            <div>
              <p className="text-white font-medium">© 2026 Университетская база отдыха «Арахлей»</p>
              <p className="text-xs mt-1">Все права защищены.</p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-white transition">Правила проживания</a>
              <a href="#" className="hover:text-white transition">Контакты</a>
              <a href="#" className="hover:text-white transition">Реквизиты</a>
            </div>
          </div>
        </footer>

      </div>
    </Router>
  );
}

export default App;