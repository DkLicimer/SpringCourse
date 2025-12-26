import React, { useState } from 'react';
import api from '../api/axios';
import { Trash2, ShoppingBag, ArrowLeft, CreditCard, MapPin, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const CartPage = () => {
  const { cartItems, fetchCart, setCartItems } = useCart();
  const [address, setAddress] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const navigate = useNavigate();

  const removeItem = async (id) => {
    try {
      await api.delete(`/cart/${id}`);
      fetchCart();
    } catch (err) {
      toast.error("Ошибка при удалении");
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!address.trim()) {
      toast.error("Укажите адрес доставки");
      return;
    }

    setIsPaying(true); // Включаем "экран оплаты"
    
    // Имитация задержки оплаты (1.5 сек)
    setTimeout(async () => {
      try {
        const res = await api.post(`/orders/checkout?address=${encodeURIComponent(address)}`);
        toast.success(`Оплата прошла успешно! Заказ №${res.data.id} принят.`);
        setCartItems([]); // Очищаем корзину в контексте
        navigate('/orders'); // Переходим в историю
      } catch (err) {
        toast.error("Ошибка при оформлении заказа");
      } finally {
        setIsPaying(false);
      }
    }, 1500);
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100">
          <ShoppingBag size={64} className="mx-auto text-gray-200 mb-6" />
          <h2 className="text-2xl font-bold mb-2">Корзина пуста</h2>
          <p className="text-gray-400 mb-8">Кажется, вы еще ничего не выбрали</p>
          <Link to="/" className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all">
            Начать покупки
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <div className="flex items-center mb-10">
        <Link to="/" className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={24}/></Link>
        <h1 className="text-4xl font-black">Оформление заказа</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Список товаров */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center p-6 border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                <img src={item.product.imageUrls && item.product.imageUrls[0]}  alt="" className="w-20 h-20 object-cover rounded-2xl border" />
                <div className="ml-6 flex-grow">
                  <h3 className="font-bold text-lg">{item.product.name}</h3>
                  <p className="text-gray-400 text-sm">Количество: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-indigo-600 text-xl">${(item.product.price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 mt-1 p-1"><Trash2 size={18}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Форма адреса и оплаты */}
        <div className="lg:col-span-1">
          <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 sticky top-24">
            <h2 className="text-xl font-bold mb-6 flex items-center"><MapPin className="mr-2 text-indigo-600"/> Доставка</h2>
            
            <form onSubmit={handleCheckout} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Адрес доставки</label>
                <textarea 
                  placeholder="Город, улица, дом, квартира..."
                  className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none transition-all"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={isPaying}
                  required
                />
              </div>

              <div className="pt-4 border-t border-dashed">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-400">Итого к оплате:</span>
                  <span className="text-3xl font-black text-gray-900">${totalPrice.toFixed(2)}</span>
                </div>

                <button 
                  type="submit" 
                  disabled={isPaying}
                  className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold text-lg hover:bg-indigo-600 transition-all flex items-center justify-center shadow-lg shadow-gray-200 disabled:bg-gray-400"
                >
                  {isPaying ? (
                    <><Loader2 className="animate-spin mr-2" /> Обработка...</>
                  ) : (
                    <><CreditCard className="mr-2" /> Оплатить заказ</>
                  )}
                </button>
                <p className="text-[10px] text-center text-gray-400 mt-4 uppercase tracking-tighter">Безопасная оплата учебными коинами</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;