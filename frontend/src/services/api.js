const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

import axios from 'axios';

const api = axios.create({
    baseURL: API_URL,
    withCredentials: true, // For cookie-based JWT
});

// Add a request interceptor to add the JWT token to the headers if needed
// Although the backend uses cookies, we might still want to handle tokens in localStorage for some flows
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

export default api;
