import axios from 'axios';

const API = axios.create({
  baseURL: 'https://kisansetu-backend-w2ni.onrender.com',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor to automatically append JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const loginUser = (data) => API.post('/auth/login', data);
export const registerUser = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');

// Crop endpoints
export const fetchCrops = (params) => API.get('/crops', { params });
export const fetchFarmerCrops = () => API.get('/crops/farmer');
export const fetchCropById = (id) => API.get(`/crops/${id}`);
export const createCropListing = (data) => API.post('/crops', data);
export const updateCropListing = (id, data) => API.put(`/crops/${id}`, data);
export const deleteCropListing = (id) => API.delete(`/crops/${id}`);

// Order endpoints
export const placeOrder = (data) => API.post('/orders', data);
export const fetchBuyerOrders = () => API.get('/orders/buyer');
export const fetchFarmerOrders = () => API.get('/orders/farmer');
export const updateOrderStatus = (id, status) => API.put(`/orders/${id}/status`, { status });

// Admin endpoints
export const fetchAdminStats = () => API.get('/admin/stats');
export const fetchAllUsers = () => API.get('/admin/users');
export const deleteUserAccount = (id) => API.delete(`/admin/users/${id}`);
export const fetchAllReports = () => API.get('/admin/reports');
export const submitReportDispute = (data) => API.post('/admin/reports', data);
export const resolveReportDispute = (id, status) => API.put(`/admin/reports/${id}`, { status });

// Upload image (Multer multipart/form-data)
export const uploadImage = (formData) => {
  return API.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
};

// Chat endpoints
export const getOrCreateConversation = (data) => API.post('/chat/conversation', data);
export const getMyConversations = () => API.get('/chat/conversations');
export const getMessages = (conversationId) => API.get(`/chat/messages/${conversationId}`);
export const sendMessage = (conversationId, data) => API.post(`/chat/messages/${conversationId}`, data);
export const markMessagesRead = (conversationId) => API.put(`/chat/messages/${conversationId}/read`);

export default API;
