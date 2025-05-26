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

// Компонент-обертка для центрирования содержимого на защищенных страницах
function AuthenticatedPageLayout() {
    return (
        // Применяем класс для центрирования
        <div className="authenticated-page-content">
            {/* Outlet рендерит фактический компонент страницы (Dashboard, Work, Help) */}
            <Outlet />
        </div>
    );
}


function App() {
  return (
    <BrowserRouter>
      {/* Navbar отображается всегда, но скрывает сам себя, если пользователь не залогинен */}
      <AppNavbar />

      <Routes>
        {/* Маршрут для страницы входа */}
        {/* Оборачиваем Login в div с классом для центрирования логина */}
         <Route path="/login" element={
             <div className="login-wrapper">
                 <Login />
             </div>
         } />


        {/* Группа защищенных маршрутов */}
        {/* Сначала проверяем аутентификацию с ProtectedRoute */}
        {/* Затем применяем обертку для центрирования к защищенным страницам с AuthenticatedPageLayout */}
         <Route element={<ProtectedRoute />}>
            <Route element={<AuthenticatedPageLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/work" element={<Work />} />
                <Route path="/help" element={<Help />} />
            </Route>
         </Route>

        {/* Маршрут по умолчанию - перенаправляем '/' на '/dashboard' */}
        {/* ProtectedRoute на /dashboard перенаправит на /login, если нужно */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />


         {/* Удаляем дублирующий catch-all, так как '*' внутри ProtectedRoute уже его обрабатывает для залогиненных.
            Если пользователь не залогинен и переходит на несуществующий путь, он попадет на Login из-за ProtectedRoute.
            Если нужно, чтобы 404 отображалась и для незалогиненных, ее нужно вынести сюда:
            <Route path="*" element={<NotFound />} />
            Но тогда NotFound не будет центрироваться нашим authenticated-page-content классом.
            Оставим пока 404 внутри ProtectedRoute - она сработает для любых НЕ /login путей при попытке попасть в кабинет. */}

      </Routes>
    </BrowserRouter>
  );
}

export default App;