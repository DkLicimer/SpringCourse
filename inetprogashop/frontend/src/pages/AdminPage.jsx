import React, { useState } from 'react';
import axios from 'axios';

const AdminPage = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('price', price);
    formData.append('file', file);

    try {
      await axios.post('http://localhost:8080/api/admin/products/add', formData);
      alert('Товар успешно добавлен!');
      setName(''); setDescription(''); setPrice('');
    } catch (error) {
      console.error(error);
      alert('Ошибка при добавлении');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Админ-панель: Добавить товар</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" placeholder="Название" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border rounded" required />
        <textarea placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 border rounded" />
        <input type="number" placeholder="Цена" value={price} onChange={e => setPrice(e.target.value)} className="w-full p-2 border rounded" required />
        <input type="file" onChange={e => setFile(e.target.files[0])} className="w-full" required />
        <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
          Сохранить товар
        </button>
      </form>
    </div>
  );
};

export default AdminPage;