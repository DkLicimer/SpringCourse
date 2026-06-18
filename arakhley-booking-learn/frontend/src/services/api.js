import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/',
  headers: {
    'Content-Type': 'application/json',
  },
  // Эти настройки позволят работать с CSRF-токеном
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

export const api = {
  getCabins: async (startDate, endDate, role, beds = 1) => {
    const response = await apiClient.get('/api/cabins/available/', {
      params: { start_date: startDate, end_date: endDate, role, beds }
    });
    return response.data;
  },

  createBooking: async (bookingData) => {
    const response = await apiClient.post('/api/bookings/', bookingData);
    return response.data;
  },

  uploadReceipt: async (bookingId, file, comment = '') => {
    const formData = new FormData();
    formData.append('file', file);
    if (comment) formData.append('user_comment', comment);
    const response = await apiClient.post(`/api/bookings/${bookingId}/upload-receipt/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};