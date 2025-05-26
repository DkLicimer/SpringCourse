import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, isLoggedIn } from '../utils/auth'; // Импортируем функцию login

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // Новое состояние для ошибки
  const navigate = useNavigate();

  // Проверяем при загрузке страницы, если пользователь уже залогинен, перенаправляем его
  useEffect(() => {
    if (isLoggedIn()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault(); // Отменяем стандартное поведение формы

    // Сбрасываем предыдущие ошибки
    setError('');

    // Вызываем нашу функцию login с введенными учетными данными
    const user = login(username, password);

    if (user) {
      // Если функция login вернула объект пользователя (т.е. вход успешен)
      navigate('/dashboard'); // Перенаправляем на дашборд
    } else {
      // Если функция login вернула null (т.е. вход неудачен)
      setError('Неверный логин или пароль.'); // Устанавливаем сообщение об ошибке
      // Можно также очистить поля, если нужно:
      // setUsername('');
      // setPassword('');
    }
  };

  // Если пользователь уже залогинен, не рендерим форму, useEffect перенаправит
   if (isLoggedIn()) {
       return null;
   }

  return (
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h2>Вход в Личный Кабинет</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleLogin}>
                {/* Отображение сообщения об ошибке, если оно есть */}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                <div className="mb-3">
                  <label htmlFor="usernameInput" className="form-label">Логин:</label>
                  <input
                    type="text"
                    className="form-control"
                    id="usernameInput"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="passwordInput" className="form-label">Пароль:</label>
                  <input
                    type="password"
                    className="form-control"
                    id="passwordInput"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary w-100">Войти</button>
              </form>
            </div>
          </div>
        </div>
      </div>
  );
}

export default Login;