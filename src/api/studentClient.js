import axios from 'axios';
import { STUDENT_BASE } from '@/config';


const api = axios.create({
    baseURL: STUDENT_BASE,
    timeout: 10000,
});


// Request interceptor: prefer existing header (set programmatically), otherwise read from localStorage.
api.interceptors.request.use((config) => {
    try {
// If Authorization already set (e.g. we set api.defaults.headers on login), respect it
        if (!config.headers?.Authorization) {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers = config.headers ?? {};
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
    } catch (e) {
// swallow
    }
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