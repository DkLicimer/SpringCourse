import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('unicampus_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('unicampus_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data);
          localStorage.setItem('unicampus_user', JSON.stringify(res.data));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (usernameOrEmail, password) => {
    // Стандартное кодирование формы для FastAPI OAuth2
    const params = new URLSearchParams();
    params.append('username', usernameOrEmail.trim());
    params.append('password', password);

    const res = await api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = res.data.access_token;
    localStorage.setItem('unicampus_token', accessToken);
    setToken(accessToken);

    // Загружаем профиль пользователя
    const profileRes = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    setUser(profileRes.data);
    localStorage.setItem('unicampus_user', JSON.stringify(profileRes.data));
    return profileRes.data;
  };

  const logout = () => {
    localStorage.removeItem('unicampus_token');
    localStorage.removeItem('unicampus_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);