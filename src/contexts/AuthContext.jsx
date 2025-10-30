// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/api/apiClient';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // only student allowed
    const [isInitializing, setIsInitializing] = useState(true);
    const queryClient = useQueryClient();
    const [studentComposite, setStudentComposite] = useState(null);

    const AUTH_BASE = import.meta.env.VITE_AUTH_BASE || 'http://localhost:4004';
    const STUDENT_BASE = import.meta.env.VITE_STUDENT_BASE || 'http://localhost:4000';

    const token = (() => {
        try { return localStorage.getItem('authToken'); } catch (e) { return null; }
    })();

    // Helper: ensure role exists and is STUDENT
    const roleIsStudent = (u) => {
        if (!u) return false;
        try {
            const r = (u.role || 'STUDENT').toString().trim().toUpperCase();
            return r === 'STUDENT';
        } catch (e) {
            return false;
        }
    };

    // Fetch composite from student service and cache it in react-query
    const fetchAndCacheStudentComposite = useCallback(async (token) => {
        if (!token) return null;
        try {
            const res = await api.get(`${STUDENT_BASE}/students/me/full`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const composite = res.data; // expected: { student, room, hostel }
            queryClient.setQueryData(['studentComposite'], composite);
            try { setStudentComposite(composite); } catch (e) { /* ignore */ }
            return composite;
        } catch (err) {
            console.debug('fetchStudentComposite failed', err?.response?.status ?? err?.message);
            return null;
        }
    }, [STUDENT_BASE, queryClient]);

    // On mount: if token exists, hydrate composite (preferred) and set user
    useEffect(() => {
        let mounted = true;
        const run = async () => {
            const token = localStorage.getItem('authToken');
            if (token) {
                try {
                    const composite = await fetchAndCacheStudentComposite(token);
                    if (composite?.student) {
                        const stud = composite.student;
                        if (!roleIsStudent(stud)) {
                            // Not a student -> clear auth
                            try { localStorage.removeItem('authToken'); } catch (ex) {}
                            setUser(null);
                        } else {
                            setUser({ ...stud, role: 'STUDENT' });
                        }
                    } else {
                        // If composite not available, try /students/me to get minimal user
                        try {
                            const authResp = await api.get(`${STUDENT_BASE}/students/me`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            const minimal = authResp.data;
                            if (!roleIsStudent(minimal)) {
                                try { localStorage.removeItem('authToken'); } catch (ex) {}
                                setUser(null);
                            } else {
                                setUser({ ...minimal, role: 'STUDENT' });
                            }
                        } catch (e) {
                            console.debug('auth/me failed during init:', e?.response?.status ?? e?.message);
                            try { localStorage.removeItem('authToken'); } catch (ex) {}
                            setUser(null);
                        }
                    }
                } catch (err) {
                    console.debug('init composite fetch error', err?.message ?? err);
                    try { localStorage.removeItem('authToken'); } catch (ex) {}
                    setUser(null);
                }
            }
            if (mounted) setIsInitializing(false);
        };

        run();

        // listen for global unauthorized events from api client
        const onUnauthorized = () => logout();
        window.addEventListener('auth:unauthorized', onUnauthorized);

        return () => {
            mounted = false;
            window.removeEventListener('auth:unauthorized', onUnauthorized);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchAndCacheStudentComposite]);

    // Login: call auth/login -> store token -> fetch student composite
    const login = useCallback(async (email, password) => {
        try {
            const resp = await api.post(`${AUTH_BASE}/auth/login`, { email, password });
            const { token, user: userPayload } = resp.data;

            const minimalUser = userPayload ?? { email: resp.data.email, role: resp.data.role ?? 'STUDENT' };
            // Only allow STUDENT role
            if (!roleIsStudent(minimalUser)) {
                return { success: false, message: 'Only student accounts are allowed to log in here.' };
            }

            if (token) {
                localStorage.setItem('authToken', token);
            }

            setUser({ ...minimalUser, role: 'STUDENT' });

            // Immediately fetch the student composite using the new token
            const composite = await fetchAndCacheStudentComposite(token || localStorage.getItem('authToken'));
            if (composite?.student) {
                const stud = composite.student;
                if (!roleIsStudent(stud)) {
                    // Server says not a student -> clear token
                    try { localStorage.removeItem('authToken'); } catch (e) {}
                    setUser(null);
                    return { success: false, message: 'Account is not a student.' };
                }
                setUser({ ...stud, role: 'STUDENT' });
            }

            // prime query cache
            queryClient.invalidateQueries(['studentComposite']);

            return { success: true, user: { ...minimalUser, role: 'STUDENT' } };
        } catch (err) {
            const msg = err?.response?.data?.message ?? err.message ?? 'Login failed';
            return { success: false, message: msg };
        }
    }, [AUTH_BASE, fetchAndCacheStudentComposite, queryClient]);

    const logout = useCallback(() => {
        try { localStorage.removeItem('authToken'); } catch (e) {}
        setUser(null);
        queryClient.removeQueries(['studentComposite']);
    }, [queryClient]);

    // Allow external refresh after booking/assignment
    const refreshStudentComposite = useCallback(async () => {
        const token = localStorage.getItem('authToken');
        const composite = await fetchAndCacheStudentComposite(token);
        if (composite?.student) {
            const stud = composite.student;
            if (!roleIsStudent(stud)) {
                try { localStorage.removeItem('authToken'); } catch (e) {}
                setUser(null);
            } else {
                setUser({ ...stud, role: 'STUDENT' });
            }
        }
        return composite;
    }, [fetchAndCacheStudentComposite]);

    const setUserRoleSafe = useCallback((u) => {
        if (!u) return;
        // enforce student role when setting externally
        if (!roleIsStudent(u)) return;
        setUser({ ...u, role: 'STUDENT' });
    }, []);

    return (
        <AuthContext.Provider value={{
            user,
            token,
            studentComposite,
            setUser: setUserRoleSafe,
            isInitializing,
            login,
            logout,
            refreshStudentComposite
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
