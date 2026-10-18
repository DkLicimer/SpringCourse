import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const BrandContext = createContext(null);

export function BrandProvider({ children }) {
  const [brand, setBrand] = useState({
    university_name: 'Университет',
    university_short_name: 'ВУЗ',
    timezone: 'Asia/Chita',
    primary_color: '#1E3A8A',
    accent_color: '#10B981',
    contact_phone: '',
    contact_email: '',
    address: '',
    payment_purpose: 'Арахлей'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/core/settings/')
      .then(res => {
        setBrand(res.data);
        if (res.data.primary_color) {
          document.documentElement.style.setProperty('--brand-primary', res.data.primary_color);
        }
        if (res.data.accent_color) {
          document.documentElement.style.setProperty('--brand-accent', res.data.accent_color);
        }
      })
      .catch(err => console.error('Ошибка загрузки настроек вуза:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <BrandContext.Provider value={{ brand, loading }}>
      {children}
    </BrandContext.Provider>
  );
}

export const useBrand = () => useContext(BrandContext);