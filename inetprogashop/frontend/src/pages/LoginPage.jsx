import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8080/api/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role);
      alert('Успешный вход!');
      navigate('/');
    } catch (err) {
      alert('Ошибка входа');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-center">Вход</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <input type="text" placeholder="Логин" className="w-full p-2 border border-gray-300 rounded" onChange={e => setUsername(e.target.value)} />
        <input type="password" placeholder="Пароль" className="w-full p-2 border border-gray-300 rounded" onChange={e => setPassword(e.target.value)} />
        <button className="w-full bg-indigo-600 text-white py-2 rounded">Войти</button>
      </form>
    </div>
  );
};

export default LoginPage;