import api from './index';

// We do not require authentication headers for student routes, but the axios instance
// will automatically attach them if a token exists. For purely public routes, 
// using the standard instance is fine as long as the backend doesn't reject auth headers.

export const getStudentQuizDetailsApi = async (slug) => {
    return await api.get(`/api/student/quiz/${slug}`);
};

export const startStudentQuizSessionApi = async (slug, data) => {
    return await api.post(`/api/student/quiz/${slug}/start`, data);
};

export const submitStudentQuizSessionApi = async (slug, data) => {
    return await api.post(`/api/student/quiz/${slug}/submit`, data);
};
