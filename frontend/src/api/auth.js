import api from './index';

export const loginApi = (email, password) => api.post('/api/admin/login', { email, password });
export const logoutApi = () => api.post('/api/admin/logout');
export const getMeApi = () => api.get('/api/admin/me');
