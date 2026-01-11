import api from './api';

export const adminAnalytics = {
  getTodaySummary: () => api.get('/admin/analytics/today-summary'),
  getActiveStudents: () => api.get('/admin/analytics/active-students'),
  getDailyReport: (date) => api.get(`/admin/analytics/daily-report?date=${date}`),
  getRouteReport: (routeId) => api.get(`/admin/analytics/route-report/${routeId}`)
};
