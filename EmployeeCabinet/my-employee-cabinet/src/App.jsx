import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/DashBoard';
import Work from './pages/Work';
import Help from './pages/Help';
import ProtectedRoute from './components/ProtectedRoute';
import AppNavbar from './components/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css'; // Убедитесь, что Bootstrap CSS импортирован (лучше в main.jsx)
import './index.css'; // Импортируем наши кастомные стили

function AuthenticatedPageLayout() {
    return (
        <div className="authenticated-page-content">
            <Outlet />
        </div>
    );
}


function App() {
  return (
    <BrowserRouter>
      <AppNavbar />

      <Routes>

         <Route path="/login" element={
             <div className="login-wrapper">
                 <Login />
             </div>
         } />



         <Route element={<ProtectedRoute />}>
            <Route element={<AuthenticatedPageLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/work" element={<Work />} />
                <Route path="/help" element={<Help />} />
            </Route>
         </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;