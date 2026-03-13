import axios from 'axios';

const api = axios.create({
    baseURL: 'https://laravel-quiz-api-production.up.railway.app/',
    headers: {
        'Accept': 'application/json',
    }
});

// Request interceptor to add the token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
