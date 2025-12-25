import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');

  // 1. Загрузка корзины из БД
  const fetchCart = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/cart', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCartItems(res.data);
    } catch (err) {
      console.error("Ошибка при загрузке корзины", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCart();
  }, [token]);

  // 2. Удаление товара
  const removeItem = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/api/cart/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Обновляем список локально, чтобы не делать лишний запрос к серверу
      setCartItems(cartItems.filter(item => item.id !== id));
    } catch (err) {
      alert("Ошибка при удалении");
    }
  };

  // 3. Подсчет итоговой суммы
  const totalPrice = cartItems.reduce((sum, item) => {
    return sum + (item.product.price * item.quantity);
  }, 0);

  if (!token) {
    return (
      <div className="text-center mt-20">
        <h2 className="text-2xl font-bold">Вы не авторизованы</h2>
        <Link to="/login" className="text-indigo-600 underline">Войти в аккаунт</Link>
      </div>
    );
  }

  if (loading) return <div className="text-center mt-20">Загрузка корзины...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center mb-8">
        <Link to="/" className="mr-4 text-gray-500 hover:text-indigo-600 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-3xl font-bold flex items-center">
          <ShoppingBag className="mr-2" /> Ваша корзина
        </h1>
      </div>

      {cartItems.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl shadow text-center">
          <p className="text-gray-500 text-lg mb-6">В корзине пока пусто</p>
          <Link to="/" className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors">
            Перейти к покупкам
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-2xl shadow overflow-hidden">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center p-6 border-b last:border-0">
                <img 
                  src={item.product.imageUrl} 
                  alt={item.product.name} 
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="ml-6 flex-grow">
                  <h3 className="text-lg font-bold text-gray-900">{item.product.name}</h3>
                  <p className="text-gray-500 text-sm">Цена: ${item.product.price}</p>
                  <p className="text-gray-700 font-medium">Количество: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-indigo-600 mb-2">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Итоговая панель */}
          <div className="bg-white p-6 rounded-2xl shadow flex justify-between items-center">
            <div>
              <p className="text-gray-500">Итого к оплате:</p>
              <p className="text-3xl font-black text-gray-900">${totalPrice.toFixed(2)}</p>
            </div>
            <button 
              onClick={() => alert("Функционал оплаты в разработке")}
              className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-600 transition-all transform hover:scale-105"
            >
              Оформить заказ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;