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
            window.location.href = '/login';
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

// Students
export const students = {
    getAll: () => api.get('/students'),
    getById: (id) => api.get(`/students/${id}`),
    create: (data) => api.post('/students', data),
    update: (id, data) => api.put(`/students/${id}`, data),
    delete: (id) => api.delete(`/students/${id}`)
};

// Passes
export const passes = {
    apply: (data) => api.post('/passes/apply', data),
    getUserPasses: (userId) => api.get(`/passes/user/${userId}`),
    getPending: () => api.get('/passes/pending'),
    approve: (id) => api.put(`/passes/${id}/approve`),
    reject: (id) => api.put(`/passes/${id}/reject`),
    renew: (id) => api.put(`/passes/${id}/renew`)
};

// Tickets
export const tickets = {
    purchase: (data) => api.post('/tickets/purchase', data),
    getById: (id) => api.get(`/tickets/${id}`),
    getUserTickets: (userId) => api.get(`/tickets/user/${userId}`),
    validate: (id, busId) => api.put(`/tickets/${id}/validate`, { busId })
};

// Profile
export const profile = {
    get: () => api.get('/profile/profile'),
    update: (data) => api.put('/profile/profile', data)
};

// Buses
export const buses = {
    getAll: () => api.get('/buses'),
    getById: (id) => api.get(`/buses/${id}`),
    getLocation: (id) => api.get(`/buses/${id}/location`),
    updateOccupancy: (id, data) => api.put(`/buses/${id}/occupancy`, data),
    create: (data) => api.post('/buses', data),
    update: (id, data) => api.put(`/buses/${id}`, data)
};

// Routes
export const routes = {
    getAll: () => api.get('/routes'),
    getById: (id) => api.get(`/routes/${id}`),
    create: (data) => api.post('/routes', data),
    update: (id, data) => api.put(`/routes/${id}`, data),
    delete: (id) => api.delete(`/routes/${id}`)
};

// Boarding
export const boarding = {
    scan: (data) => api.post('/boarding/scan', data),
    getUserHistory: (userId) => api.get(`/boarding/history/${userId}`),
    getAllLogs: () => api.get('/boarding/logs'),
    getByShift: (shift) => api.get(`/boarding/shift/${shift}`)
};

// Shifts
export const shifts = {
    getCurrent: () => api.get('/shifts/current'),
    getAll: () => api.get('/shifts')
};

export default api;
