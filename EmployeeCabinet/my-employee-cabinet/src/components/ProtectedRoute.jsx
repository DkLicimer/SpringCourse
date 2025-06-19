import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isLoggedIn } from '../utils/auth'; // Импортируем функцию проверки статуса

// Этот компонент оборачивает маршруты, которые должны быть доступны только после входа
function ProtectedRoute() {
  const auth = isLoggedIn(); // Проверяем статус "авторизации"

  // Если пользователь не залогинен, перенаправляем на страницу входа
  // 'replace' удаляет текущую страницу из истории браузера
  if (!auth) {
    return <Navigate to="/login" replace />;
  }

  // Если пользователь залогинен, рендерим содержимое дочерних маршрутов
  return <Outlet />;
}

export default ProtectedRoute;