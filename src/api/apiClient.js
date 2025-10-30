// src/api/apiClient.js
import axios from 'axios';

const STUDENT_BASE = import.meta.env.VITE_STUDENT_BASE || 'http://localhost:4000';

const api = axios.create({
    baseURL: STUDENT_BASE,   // <- set backend baseURL (or use separate clients per service)
    timeout: 10000,
});

api.interceptors.request.use((config) => {
    try {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (e) {}
    return config;
});

api.interceptors.response.use(
    res => res,
    err => {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
            window.dispatchEvent(new CustomEvent('auth:unauthorized'));
        }
        return Promise.reject(err);
    }
);

export default api;
