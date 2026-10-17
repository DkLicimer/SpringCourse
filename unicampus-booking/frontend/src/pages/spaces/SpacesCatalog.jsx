import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Building2, Users } from 'lucide-react';

export default function SpacesCatalog() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/spaces/rooms/')
      .then(res => setRooms(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-gray-900">Аудитории и пространства</h1>
        <p className="text-sm text-gray-500 mt-1">Выберите аудиторию для просмотра расписания и оформления заявки</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-sm text-gray-500">Загрузка доступных пространств...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map(room => (
            <div key={room.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="aspect-[16/9] w-full bg-gray-100 relative overflow-hidden">
                  {room.image ? (
                    <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Building2 className="w-12 h-12 opacity-50" />
                    </div>
                  )}
                </div>
                <div className="p-5 space-y-2">
                  <h3 className="font-bold font-heading text-base text-gray-900">{room.name}</h3>
                  <p className="text-xs text-gray-500">{room.address}</p>
                  
                  <div className="pt-2 text-xs text-gray-600 space-y-1">
                    {room.capacity.split('|').map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-primary"></span>
                        <span>{item.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0">
                <Link
                  to={`/spaces/${room.id}/schedule`}
                  className="block w-full py-2.5 bg-brand-primary hover:opacity-90 text-white font-bold rounded-xl text-center text-xs transition"
                >
                  Выбрать дату и время
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}