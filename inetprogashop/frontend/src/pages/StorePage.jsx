import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShoppingCart, Package } from 'lucide-react'; // Иконки для красоты

const StorePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Загрузка товаров при открытии страницы
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/products');
      setProducts(res.data);
    } catch (err) {
      console.error("Ошибка при загрузке товаров:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Логика добавления в корзину
  const addToCart = async (productId) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert("Пожалуйста, войдите в аккаунт, чтобы добавлять товары в корзину.");
      return;
    }

    try {
      // Отправляем запрос на бэкенд с JWT токеном в заголовке
      await axios.post(`http://localhost:8080/api/cart/add?productId=${productId}`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      alert("Товар добавлен в корзину!");
    } catch (err) {
      console.error("Ошибка при добавлении в корзину:", err);
      alert("Не удалось добавить товар. Попробуйте перезайти в аккаунт.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-center mb-10">
        <Package className="mr-2 text-indigo-600" size={32} />
        <h1 className="text-4xl font-extrabold text-gray-900">Наши товары</h1>
      </div>

      {products.length === 0 ? (
        <p className="text-center text-gray-500 text-xl">Товаров пока нет. Зайдите в админку, чтобы добавить их.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map(product => (
            <div key={product.id} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 overflow-hidden">
              {/* Контейнер для фото */}
              <div className="aspect-square w-full overflow-hidden bg-gray-200">
                <img 
                  src={product.imageUrl || 'https://via.placeholder.com/300'} 
                  alt={product.name} 
                  className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Инфо о товаре */}
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 mb-1">{product.name}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">
                  {product.description || "Нет описания"}
                </p>
                
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-2xl font-black text-indigo-600">
                    ${product.price?.toLocaleString()}
                  </span>
                  <button 
                    onClick={() => addToCart(product.id)}
                    className="flex items-center bg-gray-900 text-white px-4 py-2 rounded-xl hover:bg-indigo-600 transition-colors duration-200"
                  >
                    <ShoppingCart size={18} className="mr-2" />
                    Купить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StorePage;