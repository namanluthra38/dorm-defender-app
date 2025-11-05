export const API_GATEWAY_BASE = import.meta.env.VITE_API_GATEWAY_BASE || 'http://api-gateway:4004';
export const AUTH_BASE = import.meta.env.VITE_AUTH_BASE || `${API_GATEWAY_BASE}/auth`;
export const STUDENT_BASE = import.meta.env.VITE_STUDENT_BASE || API_GATEWAY_BASE;
export const WARDEN_BASE = import.meta.env.VITE_WARDEN_BASE || API_GATEWAY_BASE;
export const HOSTEL_BASE = import.meta.env.VITE_HOSTEL_BASE || API_GATEWAY_BASE;
export const REQUEST_BASE = import.meta.env.VITE_REQUEST_BASE || API_GATEWAY_BASE;

