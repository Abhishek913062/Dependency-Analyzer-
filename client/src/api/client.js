import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export const submitScan = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/scan', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getScans = async (page = 1, limit = 10) => {
  const response = await api.get(`/scans?page=${page}&limit=${limit}`);
  return response.data;
};

export const getScanDetails = async (id) => {
  const response = await api.get(`/scans/${id}`);
  return response.data;
};

export const deleteScan = async (id) => {
  const response = await api.delete(`/scans/${id}`);
  return response.data;
};

export const getStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

export default api;
