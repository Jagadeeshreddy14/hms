import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = API_URL.replace(/\/api\/?$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  sendOtp: (data) => api.post('/auth/send-otp', data),
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  register: (data) => api.post('/auth/register', data),
  registerStudent: (formData) => api.post('/auth/register-student', formData, {
    headers: { 'Content-Type': undefined }
  }),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

// Student Approvals
export const studentApprovalAPI = {
  getPendingRegistrations: () => api.get('/student-approvals'),
  getRegistrationDetails: (id) => api.get(`/student-approvals/${id}`),
  approveRegistration: (id, data) => api.put(`/student-approvals/${id}/approve`, data),
  rejectRegistration: (id, data) => api.put(`/student-approvals/${id}/reject`, data),
  getStats: () => api.get('/student-approvals/stats'),
};

// Hostels
export const hostelAPI = {
  getAll: () => api.get('/hostels'),
  getOne: (id) => api.get(`/hostels/${id}`),
  create: (data) => api.post('/hostels', data),
  update: (id, data) => api.put(`/hostels/${id}`, data),
  delete: (id) => api.delete(`/hostels/${id}`),
};

// Rooms
export const roomAPI = {
  getAll: (params) => api.get('/rooms', { params }),
  getOne: (id) => api.get(`/rooms/${id}`),
  create: (data) => api.post('/rooms', data),
  update: (id, data) => api.put(`/rooms/${id}`, data),
  allocate: (id, studentId) => api.post(`/rooms/${id}/allocate`, { studentId }),
  vacate: (id, studentId) => api.post(`/rooms/${id}/vacate`, { studentId }),
  delete: (id) => api.delete(`/rooms/${id}`),
};

// Students
export const studentAPI = {
  getAll: (params) => api.get('/students', { params }),
  getOne: (id) => api.get(`/students/${id}`),
  getMe: () => api.get('/students/me'),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  delete: (id) => api.delete(`/students/${id}`),
};

// Payments
export const paymentAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getOne: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  markAsPaid: (id, data) => api.put(`/payments/${id}/pay`, data),
  update: (id, data) => api.put(`/payments/${id}`, data),
  getAnalytics: (params) => api.get('/payments/analytics', { params }),
};

// Bank Details
export const bankDetailAPI = {
  getAll: () => api.get('/bank-details'),
  getByHostel: (hostelId) => api.get(`/bank-details/hostel/${hostelId}`),
  create: (data) => api.post('/bank-details', data),
  update: (id, data) => api.put(`/bank-details/${id}`, data),
  delete: (id) => api.delete(`/bank-details/${id}`),
};

// Payment Slips
export const paymentSlipAPI = {
  upload: (formData) => api.post('/payment-slips', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getSlips: (params) => api.get('/payment-slips', { params }),
  getAllSlips: (params) => api.get('/payment-slips/admin/all', { params }),
  verifySlip: (id, data) => api.put(`/payment-slips/${id}/verify`, data),
  deleteSlip: (id) => api.delete(`/payment-slips/${id}`),
};

// Complaints
export const complaintAPI = {
  getAll: (params) => api.get('/complaints', { params }),
  getOne: (id) => api.get(`/complaints/${id}`),
  create: (data) => api.post('/complaints', data),
  updateStatus: (id, data) => api.put(`/complaints/${id}/status`, data),
  update: (id, data) => api.put(`/complaints/${id}`, data),
  delete: (id) => api.delete(`/complaints/${id}`),
  getStats: () => api.get('/complaints/stats'),
};

// Visitors
export const visitorAPI = {
  getAll: (params) => api.get('/visitors', { params }),
  create: (data) => api.post('/visitors', data),
  checkout: (id) => api.put(`/visitors/${id}/checkout`),
  update: (id, data) => api.put(`/visitors/${id}`, data),
  delete: (id) => api.delete(`/visitors/${id}`),
};

// Analytics
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getOccupancy: () => api.get('/analytics/occupancy'),
};

// Notifications
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAllRead: () => api.put('/notifications/read-all'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
};

// KYC & Aadhaar e-KYC
export const kycAPI = {
  getAadhaarStatus: () => api.get('/kyc/aadhaar/status'),
  verifyAadhaar: (formData) => api.post('/kyc/aadhaar/verify', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteAadhaarData: () => api.delete('/kyc/aadhaar/data'),
  getAdminVerifications: (params) => api.get('/kyc/admin/verifications', { params }),
  adminReviewKyc: (studentId, data) => api.put(`/kyc/admin/review/${studentId}`, data),
};
