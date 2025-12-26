import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { ShoppingCart, Package, Maximize2 } from 'lucide-react'; // Добавили иконку зума
import { useCart } from '../context/CartContext';
import ProductModal from '../components/ProductModal'; // Импорт модалки
import toast from 'react-hot-toast';

const StorePage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null); // Состояние для модалки
  const { addToCart } = useCart();

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data);
    } catch (err) { toast.error("Ошибка загрузки"); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Рендерим модалку, если товар выбран */}
      {selectedProduct && (
        <ProductModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={addToCart} 
        />
      )}

      {/* Заголовок витрины ... */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map(product => (
          <div key={product.id} className="group bg-white rounded-[32px] shadow-sm border border-gray-100 p-5 hover:shadow-2xl transition-all duration-500">
            {/* Картинка (теперь берем первую из списка) */}
            <div className="relative overflow-hidden rounded-[24px] mb-5 h-60 bg-gray-50 flex items-center justify-center">
              <img 
                src={product.imageUrls[0]} 
                alt="" 
                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" 
              />
              {/* Кнопка "Быстрый просмотр" */}
              <button 
                onClick={() => setSelectedProduct(product)}
                className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <div className="bg-white p-4 rounded-full shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                  <Maximize2 className="text-indigo-600" />
                </div>
              </button>
            </div>
            
            <h3 className="font-bold text-xl text-gray-900 mb-2">{product.name}</h3>
            <p className="text-gray-400 text-sm line-clamp-1 mb-6">{product.description}</p>
            
            <div className="flex justify-between items-center">
              <span className="text-2xl font-black text-gray-900">${product.price}</span>
              <button 
                onClick={() => addToCart(product.id)} 
                className="bg-gray-100 text-gray-900 p-4 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
              >
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