import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const { user } = useAuth();

  // Загрузка корзины с сервера
  const fetchCart = async () => {
    if (!user) return;
    try {
      const res = await api.get('/cart');
      setCartItems(res.data);
    } catch (err) {
      console.error("Ошибка при получении корзины", err);
    }
  };

  // Вызываем при логине
  useEffect(() => {
    if (user) fetchCart();
    else setCartItems([]);
  }, [user]);

  // Глобальная функция добавления
  const addToCart = async (productId) => {
    if (!user) {
      toast.error("Пожалуйста, войдите в аккаунт");
      return;
    }

    const loadToast = toast.loading('Добавляем...');
    try {
      await api.post(`/cart/add?productId=${productId}`);
      await fetchCart(); // Обновляем состояние после добавления
      toast.success("Товар добавлен!", { id: loadToast });
    } catch (err) {
      toast.error("Ошибка добавления", { id: loadToast });
    }
  };

  // Суммарное количество товаров для счетчика
  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, totalCount, fetchCart, addToCart, setCartItems }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);