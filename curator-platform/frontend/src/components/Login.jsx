import React, { useState } from 'react';
import api from '../api';
import logoHorizontal from '../assets/logo_horizontal.png';
import logoCrest from '../assets/logo_crest.png';
import { Shield, KeyRound, User, Lock, AlertCircle } from 'lucide-react';

function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('username', username.trim());
    formData.append('password', password);

    try {
      const response = await api.post('/auth/login', formData);
      const token = response.data.access_token;
      localStorage.setItem('token', token);
      onLoginSuccess(token);
    } catch (err) {
      setError(
        err.response?.data?.detail || 
        'Неверное имя пользователя или пароль. Попробуйте снова.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Быстрое заполнение для тестирования
  const fillDemoAccount = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-zab-navy flex flex-col items-center justify-center p-4 font-sans text-slate-800 relative overflow-hidden">
      {/* Декоративные фоновые элементы */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-zab-teal/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-zab-blue rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full border-t-8 border-t-zab-teal z-10 space-y-6">
        
        {/* Логотип и заголовок */}
        <div className="text-center space-y-3">
          <div className="flex justify-center items-center space-x-2">
            <img src={logoCrest} alt="ЗабГУ Герб" className="h-14 w-auto object-contain" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 leading-tight uppercase tracking-tight">
              Забайкальский государственный университет
            </h1>
            <p className="text-xs font-bold text-zab-teal uppercase tracking-widest mt-1">
              Электронная книжка куратора
            </p>
          </div>
        </div>

        {/* Ошибка входа */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-semibold flex items-center border border-red-100 animate-fadeIn">
            <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Форма авторизации */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Имя пользователя (логин)</label>
            <div className="relative">
              <User className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-zab-teal bg-slate-50/50 font-medium text-slate-800"
                placeholder="например, admin или curator_ivanov"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Пароль</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-zab-teal bg-slate-50/50 font-medium text-slate-800"
                placeholder="Введите пароль"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-zab-teal hover:bg-zab-teal-hover disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-lg transition-all text-center cursor-pointer uppercase tracking-wider"
          >
            {loading ? 'Авторизация...' : 'Войти в личный кабинет'}
          </button>
        </form>

        {/* Блок быстрого ввода для тестирования */}
        <div className="pt-4 border-t border-slate-100 text-[11px] space-y-2">
          <span className="font-bold text-slate-400 uppercase tracking-wider block text-center">Демо-аккаунты для входа:</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('admin', 'admin123')}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left cursor-pointer transition-colors"
            >
              <span className="font-bold text-slate-800 block">Администратор</span>
              <span className="text-[10px] text-slate-400 font-mono">admin / admin123</span>
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('curator_ivanov', 'curator123')}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-left cursor-pointer transition-colors"
            >
              <span className="font-bold text-zab-teal block">Куратор Иванов</span>
              <span className="text-[10px] text-slate-400 font-mono">curator123</span>
            </button>
          </div>
        </div>

      </div>

      <span className="text-slate-400 text-xs mt-6 font-medium">
        © 2026 Забайкальский государственный университет
      </span>
    </div>
  );
}

export default Login;