import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add auth token to requests
api.interceptors.request.use(
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

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

// Auth
export const auth = {
    login: (enrollmentNumber, password) =>
        api.post('/auth/login', { enrollmentNumber, password }),
    logout: () => api.post('/auth/logout')
};

// Profile
export const profile = {
    get: () => api.get('/profile'),
    updatePhoto: (data) => api.put('/profile/photo', data),
    requestChange: (data) => api.post('/profile/request-change', data),
    markComplete: () => api.put('/profile/mark-complete')
};

// Passes (Student)
export const passes = {
    apply: (data) => api.post('/passes/apply', data),
    getMyPasses: () => api.get('/passes/my-passes')
};

// Payment
export const payment = {
    createOrder: (data) => api.post('/payment/create-order', data),
    verifyPayment: (data) => api.post('/payment/verify', data),
    paymentFailed: (data) => api.post('/payment/failed', data)
};

// Admin - Students
export const admin = {
    // Student Management
    createStudent: (data) => api.post('/admin/students', data),
    getStudents: (params) => api.get('/admin/students', { params }),
    getStudent: (id) => api.get(`/admin/students/${id}`),

    // Profile Change Requests
    getProfileChangeRequests: () => api.get('/admin/profile-change-requests'),
    approveProfileChange: (studentId) => api.put(`/admin/profile-change-requests/${studentId}/approve`),
    rejectProfileChange: (studentId, data) => api.put(`/admin/profile-change-requests/${studentId}/reject`, data),

    // Pass Management
    getPendingPasses: (params) => api.get('/passes/admin/pending', { params }),
    getPendingPassesByRoute: () => api.get('/passes/admin/pending/by-route'),
    getApprovedPasses: (params) => api.get('/passes/admin/approved', { params }),
    getApprovedPassesByRoute: () => api.get('/passes/admin/approved/by-route'),
    approvePass: (id) => api.put(`/passes/${id}/approve`),
    rejectPass: (id, data) => api.put(`/passes/${id}/reject`, data)
};

// Routes
export const routes = {
    getAll: () => api.get('/routes'),
    getById: (id) => api.get(`/routes/${id}`)
};

export default api;
