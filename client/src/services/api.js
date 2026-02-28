import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL}`;

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
    login: (loginId, password) =>
        api.post('/auth/login', { loginId, password }),
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

// Student Helpers
export const students = {
    getBusDetails: () => api.get('/students/bus-details')
};

// Day Tickets
export const dayTickets = {
    getMyTickets: () => api.get('/day-tickets/my-tickets'),
    getTodayTicket: () => api.get('/day-tickets/today'),
    purchase: (data) => api.post('/day-tickets/purchase', data)
};

// Journey
export const journey = {
    getLogs: (days) => api.get(`/journey/my-logs?days=${days}`),
    getDailySummary: (date) => api.get(`/journey/daily-summary/${date}`)
};

// Payment
export const payment = {
    createOrder: (data) => api.post('/payment/create-order', data),
    verifyPayment: (data) => api.post('/payment/verify', data),
    paymentFailed: (data) => api.post('/payment/failed', data)
};

// Routes
export const routes = {
    getAll: () => api.get('/routes'),
    getById: (id) => api.get(`/routes/${id}`)
};


// Admin APIs
export const admin = {
    // Students
    getStudents: (params) => api.get('/admin/students', { params }),
    getStudentDetails: (id) => api.get(`/admin/students/${id}`),
    createStudent: (data) => api.post('/admin/students', data),
    uploadStudents: (data) => api.post('/admin/students/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    // Profile change requests
    getProfileChangeRequests: () => api.get('/admin/profile-change-requests'),
    approveProfileChange: (studentId) =>
        api.put(`/admin/profile-change-requests/${studentId}/approve`),
    rejectProfileChange: (studentId, data) =>
        api.put(`/admin/profile-change-requests/${studentId}/reject`, data),

    // Pass viewing (read-only)
    getApprovedPasses: (params) => api.get('/passes/admin/approved', { params }),

    // Analytics & Stats
    getDashboardStats: () => api.get('/admin/analytics/today-summary'),
    getTodayAttendance: () => api.get('/admin/today-attendance'),
    getLiveAnalytics: () => api.get('/admin/analytics/live'),

    // Bus Management
    getBuses: () => api.get('/admin/buses'),
    createBus: (data) => api.post('/admin/buses', data),
    updateBus: (id, data) => api.put(`/admin/buses/${id}`, data),
    deleteBus: (id) => api.delete(`/admin/buses/${id}`),

    // Driver Management
    getDrivers: () => api.get('/admin/drivers'),
    createDriver: (data) => api.post('/admin/drivers', data),
    updateDriver: (id, data) => api.put(`/admin/drivers/${id}`, data),
    deleteDriver: (id) => api.delete(`/admin/drivers/${id}`),

    // Route Management
    getRoutes: () => api.get('/routes'),
    createRoute: (data) => api.post('/routes', data),
    updateRoute: (id, data) => api.put(`/routes/${id}`, data),
    deleteRoute: (id) => api.delete(`/routes/${id}`),

    // Ticket Management
    getAllTickets: (params) => api.get('/admin/tickets/all', { params }),
    getTicketsReport: () => api.get('/admin/tickets/all') // Use this for summary stats
};

// Driver
export const driver = {
    getDashboard: () => api.get('/driver/dashboard'),
    scan: (data) => api.post('/driver/scan', data),
    getRoute: () => api.get('/driver/route')
};

// Lost & Found
export const lostFound = {
    // Public Boards
    getBoardFound: (params) => api.get('/lost-found/board/found', { params }),
    getBoardReports: (params) => api.get('/lost-found/board/reports', { params }),

    // Details & Comments
    getItemDetails: (type, id) => api.get(`/lost-found/board/${type}/${id}`),
    getComments: (type, id) => api.get(`/lost-found/${type}/${id}/comments`),
    addComment: (type, id, data) => api.post(`/lost-found/${type}/${id}/comments`, data),

    // Posting items
    reportFoundItem: (data) => api.post('/lost-found/items', data),
    reportLostItem: (data) => api.post('/lost-found/reports', data),
    getMyReports: () => api.get('/lost-found/reports/my'),

    // Admin management
    getAllItemsList: () => api.get('/lost-found/items/all'),
    getAllReportsList: () => api.get('/lost-found/reports/all'),
    resolveItem: (id, data) => api.put(`/lost-found/items/${id}/resolve`, data),
    markReportFound: (id, data) => api.put(`/lost-found/reports/${id}/mark-found`, data),
    resolveReport: (id, data) => api.put(`/lost-found/reports/${id}/resolve`, data),

    // Chat Moderation
    deleteComment: (commentId) => api.delete(`/lost-found/comments/${commentId}`),
    toggleChatEnabled: (type, id, data) => api.put(`/lost-found/${type === 'found' ? 'items' : 'reports'}/${id}/chat-toggle`, data),
};

// Ride Intent
export const rideIntent = {
    submitIntent: (data) => api.post('/ride-intent', data),
    getUpcoming: () => api.get('/ride-intent/upcoming'),
    getHistory: () => api.get('/ride-intent/history'),
};

// Demand Forecast (Admin)
export const forecast = {
    getByDate: (date) => api.get(`/forecast/date/${date}`),
    getAnalytics: () => api.get('/forecast/analytics'),
    getLeaderboard: () => api.get('/forecast/leaderboard'),
    getSummary: () => api.get('/forecast/summary'),
};

export default api;
