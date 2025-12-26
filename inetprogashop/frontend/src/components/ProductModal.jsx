import React, { useState } from 'react';
import { X, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';

const ProductModal = ({ product, onClose, onAddToCart }) => {
  const [activeImg, setActiveImg] = useState(0);

  if (!product) return null;

  const nextImg = () => setActiveImg((prev) => (prev + 1) % product.imageUrls.length);
  const prevImg = () => setActiveImg((prev) => (prev - 1 + product.imageUrls.length) % product.imageUrls.length);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        <button onClick={onClose} className="absolute top-6 right-6 z-10 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white transition-colors">
          <X size={24} />
        </button>

        {/* Галерея картинок */}
        <div className="md:w-1/2 bg-gray-50 relative group h-full flex flex-col">
          <div className="flex-grow flex items-center justify-center p-8">
            <img 
              src={product.imageUrls[activeImg]} 
              alt="" 
              className="max-h-full max-w-full object-contain drop-shadow-2xl transition-all duration-500" 
            />
          </div>
          
          {/* Переключатели */}
          {product.imageUrls.length > 1 && (
            <>
              <button onClick={prevImg} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/50 hover:bg-white rounded-full transition-all">
                <ChevronLeft />
              </button>
              <button onClick={nextImg} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/50 hover:bg-white rounded-full transition-all">
                <ChevronRight />
              </button>
              
              {/* Превьюшки */}
              <div className="flex justify-center gap-2 pb-6 px-6 overflow-x-auto">
                {product.imageUrls.map((url, idx) => (
                  <img 
                    key={idx}
                    src={url}
                    onClick={() => setActiveImg(idx)}
                    className={`w-16 h-16 object-cover rounded-xl cursor-pointer border-2 transition-all ${activeImg === idx ? 'border-indigo-600 scale-110' : 'border-transparent opacity-50'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Информация */}
        <div className="md:w-1/2 p-12 flex flex-col">
          <div className="flex-grow">
            <span className="text-indigo-600 font-bold uppercase tracking-widest text-xs">Детали товара</span>
            <h2 className="text-4xl font-black text-gray-900 mt-2 mb-6">{product.name}</h2>
            <p className="text-gray-500 leading-relaxed text-lg mb-8">{product.description}</p>
            
            <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 mb-8">
              <p className="text-sm text-gray-400 font-bold uppercase mb-1">Цена</p>
              <p className="text-4xl font-black text-indigo-600">${product.price}</p>
            </div>
          </div>

          <button 
            onClick={() => { onAddToCart(product.id); onClose(); }}
            className="w-full bg-gray-900 text-white py-6 rounded-[24px] font-black text-xl hover:bg-indigo-600 transition-all flex items-center justify-center shadow-xl shadow-indigo-100"
          >
            <ShoppingCart className="mr-3" size={24} />
            Добавить в корзину
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;