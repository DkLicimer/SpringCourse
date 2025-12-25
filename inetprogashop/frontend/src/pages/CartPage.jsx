import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const CartPage = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      setCartItems(res.data);
    } catch (err) {
      console.error("Ошибка при загрузке корзины", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const removeItem = async (id) => {
    try {
      await api.delete(`/cart/${id}`);
      setCartItems(cartItems.filter(item => item.id !== id));
    } catch (err) {
      alert("Ошибка при удалении");
    }
  };

  const handleCheckout = async () => {
  try {
    const res = await api.post('/orders/checkout');
    alert(`Заказ №${res.data.id} успешно оформлен!`);
    setCartItems([]); // Очищаем корзину визуально
  } catch (err) {
    alert("Ошибка при оформлении заказа");
    console.error(err);
  }
};

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  if (loading) return <div className="text-center mt-20">Загрузка корзины...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center mb-8">
        <Link to="/" className="mr-4 text-gray-500 hover:text-indigo-600"><ArrowLeft /></Link>
        <h1 className="text-3xl font-bold flex items-center"><ShoppingBag className="mr-2" /> Корзина</h1>
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center bg-white p-10 rounded-2xl shadow">
          <p className="text-gray-500 mb-6">В корзине пусто</p>
          <Link to="/" className="bg-indigo-600 text-white px-6 py-2 rounded-lg">За покупками</Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow divide-y">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center p-6">
                <img src={item.product.imageUrl} alt={item.product.name} className="w-16 h-16 object-cover rounded-lg" />
                <div className="ml-6 flex-grow">
                  <h3 className="font-bold">{item.product.name}</h3>
                  <p className="text-gray-400">Кол-во: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-indigo-600">${(item.product.price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeItem(item.id)} className="text-red-500"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white p-6 rounded-2xl shadow flex justify-between items-center">
            <span className="text-2xl font-bold">Итого: ${totalPrice.toFixed(2)}</span>
            <button onClick={handleCheckout} className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-600 transition-all">
                Оформить заказ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;