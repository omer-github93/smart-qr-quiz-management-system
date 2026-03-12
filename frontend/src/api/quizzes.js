import api from './index';

export const getQuizzesApi = () => api.get('/api/admin/quizzes');
export const createQuizApi = (data) => api.post('/api/admin/quizzes', data);
export const updateQuizApi = (id, data) => api.put(`/api/admin/quizzes/${id}`, data);
export const deleteQuizApi = (id) => api.delete(`/api/admin/quizzes/${id}`);
export const generateQuizQrApi = (id) => api.post(`/api/admin/quizzes/${id}/generate-qr`);
