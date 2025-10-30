// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '@/api/apiClient';
import { useQueryClient } from '@tanstack/react-query';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // minimal user or enriched student object
    const [isInitializing, setIsInitializing] = useState(true);
    const queryClient = useQueryClient();
    const [studentComposite, setStudentComposite] = useState(null);

    const AUTH_BASE = import.meta.env.VITE_AUTH_BASE || 'http://localhost:4004';
    const STUDENT_BASE = import.meta.env.VITE_STUDENT_BASE || 'http://localhost:4000';

    const token = (() => {
        try { return localStorage.getItem('authToken'); } catch (e) { return null; }
    })();

    // Helper: ensure role exists
    const withDefaultRole = (u) => {
        if (!u) return u;
        try {
            if (typeof u.role === 'string' && u.role.trim().length > 0) return u;
            return { ...u, role: 'STUDENT' };
        } catch (e) {
            return { ...u, role: 'STUDENT' };
        }
    };

    // Fetch composite from student service and cache it in react-query
    const fetchAndCacheStudentComposite = useCallback(async (token) => {
        if (!token) return null;
        try {
            // Use api client (it may already attach token). Still pass header explicitly to be safe.
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
                    // Try to fetch composite directly (we prefer composite.student)
                    const composite = await fetchAndCacheStudentComposite(token);
                    if (composite?.student) {
                        const stud = composite.student;
                        if (!stud.role) stud.role = 'STUDENT';
                        setUser(withDefaultRole(stud));
                        // done
                    } else {
                        // If composite not available, optionally try /auth/me to get minimal user
                        try {
                            const authResp = await api.get(`${STUDENT_BASE}/students/me`, {
                                headers: { Authorization: `Bearer ${token}` }
                            });
                            setUser(withDefaultRole(authResp.data));
                        } catch (e) {
                            // auth/me failed — clear token & user
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
            if (token) {
                localStorage.setItem('authToken', token);
            }
            const minimalUser = userPayload ?? { email: resp.data.email, role: resp.data.role ?? 'STUDENT' };
            setUser(withDefaultRole(minimalUser));

            // Immediately fetch the student composite using the new token
            const composite = await fetchAndCacheStudentComposite(token || localStorage.getItem('authToken'));
            if (composite?.student) {
                const stud = composite.student;
                if (!stud.role) stud.role = minimalUser?.role ?? 'STUDENT';
                setUser(withDefaultRole(stud));
            }

            // prime query cache
            queryClient.invalidateQueries(['studentComposite']);

            return { success: true, user: minimalUser };
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
            if (!stud.role) stud.role = user?.role ?? 'STUDENT';
            setUser(withDefaultRole(stud));
        }
        return composite;
    }, [fetchAndCacheStudentComposite, user]);

    const setUserRoleSafe = useCallback((u) => {
        if (!u) return;
        if (!u.role) u.role = 'STUDENT';
        setUser(u);
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
