import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Pencil, Trash2, Plus, X } from 'lucide-react';

const AdminPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Состояния для формы
  const [editId, setEditId] = useState(null); // Если null — добавляем, если id — редактируем
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [files, setFiles] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/admin/products');
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      await api.post('/admin/products/add', formData);
      alert('Товар добавлен с несколькими фото!');
    } catch (err) { alert('Ошибка'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить этот товар?')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      fetchProducts();
    } catch (err) {
      alert('Ошибка при удалении');
    }
  };

  const startEdit = (p) => {
    setEditId(p.id);
    setName(p.name);
    setDescription(p.description);
    setPrice(p.price);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditId(null);
    setName('');
    setDescription('');
    setPrice('');
    setFile(null);
  };

  if (loading) return <div className="text-center mt-10">Загрузка данных...</div>;

  return (
    <div className="max-w-5xl mx-auto mt-10 p-6">
      {/* Форма управления */}
      <div className="bg-white rounded-2xl shadow-sm border p-6 mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            {editId ? <Pencil className="mr-2 text-amber-500" /> : <Plus className="mr-2 text-indigo-600" />}
            {editId ? `Редактирование ID: ${editId}` : 'Добавить новый товар'}
          </h2>
          {editId && (
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <input type="text" placeholder="Название" value={name} onChange={e => setName(e.target.value)} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
            <input type="number" placeholder="Цена" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" required />
            <input type="file" multiple onChange={e => setFile(e.target.files[0])} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
          </div>
          <div className="space-y-4">
            <textarea placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2.5 border rounded-lg h-[118px] focus:ring-2 focus:ring-indigo-500 outline-none" />
            <button type="submit" className={`w-full py-3 rounded-xl font-bold text-white transition-colors ${editId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
              {editId ? 'Обновить данные' : 'Создать товар'}
            </button>
          </div>
        </form>
      </div>

      {/* Список товаров */}
      <h2 className="text-2xl font-bold mb-6">Управление списком ({products.length})</h2>
      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 font-semibold text-gray-600">Товар</th>
              <th className="p-4 font-semibold text-gray-600">Цена</th>
              <th className="p-4 font-semibold text-gray-600 text-right">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-4 flex items-center">
                  <img src={p.imageUrl} alt="" className="w-12 h-12 object-cover rounded-lg mr-4 border" />
                  <div>
                    <div className="font-bold text-gray-900">{p.name}</div>
                    <div className="text-xs text-gray-400">ID: {p.id}</div>
                  </div>
                </td>
                <td className="p-4 font-medium text-indigo-600">${p.price}</td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => startEdit(p)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors inline-block">
                    <Pencil size={18} />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-block">
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPage;