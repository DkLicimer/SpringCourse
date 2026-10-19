import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Navbar from './components/layout/Navbar';

// Модули экосистемы
import CalendarView from './pages/calendar/CalendarView';
import SpacesView from './pages/booking/SpacesView';
import RecreationView from './pages/booking/RecreationView';
import CuratorsView from './pages/curators/CuratorsView';
import RatingView from './pages/rating/RatingView';
import DormitoriesView from './pages/dormitories/DormitoriesView';
import MobilityView from './pages/mobility/MobilityView';
import DDMView from './pages/ddm/DDMView';
import LearningView from './pages/learning/LearningView';

function MainDashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('calendar');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs font-mono">
        Загрузка экосистемы ЗабГУ...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Единая шапка с ролевой навигацией */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Контейнер текущего модуля */}
      <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'spaces' && <SpacesView />}
        {activeTab === 'recreation' && <RecreationView />}
        {activeTab === 'curators' && <CuratorsView />}
        {activeTab === 'rating' && <RatingView />}
        {activeTab === 'dormitories' && <DormitoriesView />}
        {activeTab === 'mobility' && <MobilityView />}
        {activeTab === 'ddm' && <DDMView />}
        {activeTab === 'learning' && <LearningView />}
      </main>

      <footer className="bg-slate-900 text-slate-500 text-xs py-6 border-t border-slate-800 text-center">
        UniCampus Ecosystem © 2026 Забайкальский государственный университет
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  );
}