import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/' && 
          window.location.pathname !== '/login' && 
          window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Tasks API
export const tasksApi = {
  getAll: (params) => api.get('/tasks', { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};

// Pomodoro API
export const pomodoroApi = {
  start: (data) => api.post('/pomodoro/start', data),
  complete: (id) => api.post(`/pomodoro/${id}/complete`),
  getSessions: (days = 7) => api.get('/pomodoro/sessions', { params: { days } }),
  getStats: () => api.get('/pomodoro/stats'),
};

// Goals API
export const goalsApi = {
  getAll: () => api.get('/goals'),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
};

// Analytics API
export const analyticsApi = {
  getOverview: () => api.get('/analytics/overview'),
  getDailyStats: (days = 7) => api.get('/analytics/daily-stats', { params: { days } }),
};

// AI API
export const aiApi = {
  getStudyCoach: () => api.post('/ai/study-coach'),
  breakDownTask: (data) => api.post('/ai/break-down-task', data),
  getWeeklySummary: () => api.post('/ai/weekly-summary'),
  checkBurnout: () => api.post('/ai/burnout-check'),
};

export default api;
