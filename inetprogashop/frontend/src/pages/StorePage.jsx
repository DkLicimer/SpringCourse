import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ShoppingCart, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const StorePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // Проверяем, залогинен ли юзер

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products'); // URL теперь сокращенный благодаря baseURL
      setProducts(res.data);
    } catch (err) {
      console.error("Ошибка при загрузке товаров:", err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId) => {
    if (!user) {
      alert("Пожалуйста, войдите в аккаунт");
      return;
    }

    try {
      // Headers больше не нужны, api.interceptors добавит их сам!
      await api.post(`/cart/add?productId=${productId}`);
      alert("Товар добавлен в корзину!");
    } catch (err) {
      alert("Не удалось добавить товар");
    }
  };

  if (loading) return <div className="text-center mt-20">Загрузка товаров...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-center justify-center mb-10">
        <Package className="mr-2 text-indigo-600" size={32} />
        <h1 className="text-4xl font-extrabold text-gray-900">Наши товары</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-2xl shadow-sm border p-4 hover:shadow-md transition-shadow">
            <img src={product.imageUrl} alt={product.name} className="h-48 w-full object-cover rounded-xl mb-4" />
            <h3 className="font-bold text-lg">{product.name}</h3>
            <p className="text-gray-500 text-sm mb-4 h-10 line-clamp-2">{product.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-indigo-600">${product.price}</span>
              <button onClick={() => addToCart(product.id)} className="bg-gray-900 text-white p-2 rounded-lg hover:bg-indigo-600">
                <ShoppingCart size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StorePage;