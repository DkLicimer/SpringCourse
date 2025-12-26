import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Package, Calendar, MapPin, ChevronRight, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders/history');
        setOrders(res.data);
      } catch (err) {
        toast.error("Не удалось загрузить историю");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  if (loading) return <div className="text-center mt-20 text-gray-400 animate-pulse font-medium">Загрузка истории...</div>;

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-4xl font-black flex items-center">
          <Package className="mr-4 text-indigo-600" size={40} />
          Мои заказы
        </h1>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Всего заказов</p>
          <p className="text-2xl font-black">{orders.length}</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white p-20 rounded-[40px] text-center border-2 border-dashed border-gray-100">
          <Package size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-400 text-lg">История заказов пуста</p>
        </div>
      ) : (
        <div className="grid gap-8">
          {orders.map(order => (
            <div key={order.id} className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="bg-gray-50/50 px-8 py-6 border-b flex flex-wrap justify-between items-center gap-4">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Номер заказа</p>
                    <p className="font-black text-indigo-600">#000{order.id}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Дата</p>
                    <p className="font-bold flex items-center text-sm">
                      <Calendar size={14} className="mr-1 text-gray-400" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Статус</p>
                    <p className="font-bold text-green-600 text-xs flex items-center bg-green-50 px-2 py-1 rounded-full">
                      <CheckCircle2 size={12} className="mr-1" />
                      ОПЛАЧЕНО
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Сумма</p>
                  <p className="text-2xl font-black text-gray-900">${order.totalPrice.toFixed(2)}</p>
                </div>
              </div>

              {/* Address */}
              <div className="px-8 py-4 bg-indigo-50/30 flex items-start text-sm text-indigo-900 border-b border-indigo-50/50">
                <MapPin size={16} className="mr-2 mt-0.5 flex-shrink-0 text-indigo-400" />
                <span className="font-medium">{order.address}</span>
              </div>

              {/* Items List */}
              <div className="p-8">
                <div className="space-y-4">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center group">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          <Package size={20} />
                        </div>
                        <div className="ml-4">
                          <p className="font-bold text-gray-800 text-sm">{item.product.name}</p>
                          <p className="text-[10px] text-gray-400 font-medium tracking-tight">
                            {item.quantity} шт. × ${item.priceAtPurchase.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-200 group-hover:text-indigo-300 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;