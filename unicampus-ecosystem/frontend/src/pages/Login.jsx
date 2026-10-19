import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, KeyRound, User, Lock, AlertCircle, Building2 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err.response?.data?.detail || 'Неверный логин или пароль. Попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans text-slate-800 relative overflow-hidden">
      {/* Фоновые декоративные сферы */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full border-t-8 border-t-blue-600 z-10 space-y-6">
        
        {/* Заголовок */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto font-black shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              UniCampus ЗабГУ
            </h1>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-0.5">
              Единая цифровая экосистема
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-semibold flex items-center border border-red-100">
            <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Имя пользователя / E-mail</label>
            <div className="relative">
              <User className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 font-medium text-slate-800"
                placeholder="admin / curator_ivanov / student_smirnov"
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50 font-medium text-slate-800"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer uppercase tracking-wider"
          >
            {loading ? 'Авторизация в системе...' : 'Войти в личный кабинет'}
          </button>
        </form>

        {/* Быстрые аккаунты для демонстрации */}
        <div className="pt-4 border-t border-slate-100 text-[11px] space-y-2">
          <span className="font-bold text-slate-400 uppercase tracking-wider block text-center">
            Быстрый вход для демо-показа:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => fillQuickAccount('admin', 'admin123')}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left cursor-pointer transition-colors"
            >
              <span className="font-bold text-slate-800 block">Администратор</span>
              <span className="text-[10px] text-slate-400 font-mono">admin123</span>
            </button>

            <button
              type="button"
              onClick={() => fillQuickAccount('curator_ivanov', 'curator123')}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left cursor-pointer transition-colors"
            >
              <span className="font-bold text-blue-600 block">Куратор</span>
              <span className="text-[10px] text-slate-400 font-mono">curator123</span>
            </button>

            <button
              type="button"
              onClick={() => fillQuickAccount('student_smirnov', 'student123')}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left cursor-pointer transition-colors"
            >
              <span className="font-bold text-emerald-600 block">Студент</span>
              <span className="text-[10px] text-slate-400 font-mono">student123</span>
            </button>

            <button
              type="button"
              onClick={() => fillQuickAccount('officer_ddm', 'ddm123')}
              className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left cursor-pointer transition-colors"
            >
              <span className="font-bold text-purple-600 block">Офицер ДДМ</span>
              <span className="text-[10px] text-slate-400 font-mono">ddm123</span>
            </button>
          </div>
        </div>

      </div>

      <span className="text-slate-500 text-xs mt-6 font-medium">
        © 2026 Забайкальский государственный университет • ЗабГУ
      </span>
    </div>
  );
}