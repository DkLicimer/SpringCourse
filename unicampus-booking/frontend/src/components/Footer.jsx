import React from 'react';
import { useBrand } from '../context/BrandContext';

export default function Footer() {
  const { brand } = useBrand();

  return (
    <footer className="bg-gray-900 text-gray-400 py-8 border-t border-gray-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <p className="text-white font-semibold text-sm">© {new Date().getFullYear()} {brand.university_name}</p>
          <p className="mt-1">Система онлайн-бронирования инфраструктурных ресурсов кампуса.</p>
        </div>
        <div className="text-center md:text-right space-y-1">
          <p>{brand.address}</p>
          <p>
            Email: <a href={`mailto:${brand.contact_email}`} className="text-gray-300 hover:underline">{brand.contact_email}</a>
            {brand.contact_phone && ` | Тел: ${brand.contact_phone}`}
          </p>
        </div>
      </div>
    </footer>
  );
}