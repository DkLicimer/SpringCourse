import React, { useState } from 'react';
import api from '../api/axios'; 
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/login', { username, password });
      
      login(res.data);
      
      alert('Успешный вход!');
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Ошибка входа: ' + (err.response?.data || 'неверные данные'));
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Вход в аккаунт</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <input 
          type="text" 
          placeholder="Логин" 
          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
          onChange={e => setUsername(e.target.value)} 
          required
        />
        <input 
          type="password" 
          placeholder="Пароль" 
          className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
          onChange={e => setPassword(e.target.value)} 
          required
        />
        <button className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
          Войти
        </button>
      </form>
    </div>
  );
};

export default LoginPage;