import React, { useState } from 'react';
import api from '../api';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Поскольку бэкенд FastAPI использует стандарт OAuth2 (OAuth2PasswordRequestForm),
    // нам нужно отправлять данные как Form Data, а не JSON
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    try {
      const response = await api.post('/auth/login', formData);
      const token = response.data.access_token;
      
      // Сохраняем токен в localStorage
      localStorage.setItem('token', token);
      
      // Сигнализируем родительскому компоненту об успешном входе
      onLoginSuccess(token);
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        'Не удалось войти. Проверьте имя пользователя и пароль.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">
            Электронная книжка куратора
          </h1>
          <p className="text-slate-500 mt-2">
            Войдите в свою учетную запись для продолжения работы
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Имя пользователя (логин)
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800"
              placeholder="Введите логин"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Пароль
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800"
              placeholder="Введите пароль"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl shadow-lg hover:shadow-blue-200 transition-all text-center"
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;