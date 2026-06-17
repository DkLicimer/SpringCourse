import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Получить список домиков с информацией о занятости на даты
  getCabins: async (startDate, endDate, role, beds = 1) => {
    const response = await apiClient.get('/api/cabins/available/', {
      params: {
        start_date: startDate,
        end_date: endDate,
        role: role,
        beds: beds
      }
    });
    return response.data;
  },

  // Создать новое бронирование
  createBooking: async (bookingData) => {
    const response = await apiClient.post('/api/bookings/', bookingData);
    return response.data;
  },

  // Загрузить чек об оплате
  uploadReceipt: async (bookingId, file, comment = '') => {
    const formData = new FormData();
    formData.append('file', file);
    if (comment) {
      formData.append('user_comment', comment);
    }
    const response = await apiClient.post(`/api/bookings/${bookingId}/upload-receipt/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
    return response.data;
  }
};