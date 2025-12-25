import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    // Простая валидация на совпадение паролей
    if (password !== confirmPassword) {
      alert("Пароли не совпадают!");
      return;
    }

    try {
      await axios.post('http://localhost:8080/api/auth/register', { 
        username, 
        password 
      });
      alert('Регистрация успешна! Теперь вы можете войти.');
      navigate('/login'); // После регистрации отправляем на страницу входа
    } catch (err) {
      console.error(err);
      alert('Ошибка при регистрации. Возможно, такое имя уже занято.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Создать аккаунт</h2>
      
      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Логин</label>
          <input 
            type="text" 
            placeholder="Придумайте логин" 
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" 
            value={username}
            onChange={e => setUsername(e.target.value)} 
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" 
            value={password}
            onChange={e => setPassword(e.target.value)} 
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Подтвердите пароль</label>
          <input 
            type="password" 
            placeholder="••••••••" 
            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" 
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)} 
            required
          />
        </div>

        <button 
          type="submit" 
          className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 active:transform active:scale-95 transition-all shadow-md"
        >
          Зарегистрироваться
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-600">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="text-indigo-600 font-medium hover:underline">
          Войти
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;