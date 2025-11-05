// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import studentApi from '@/api/studentClient';
import authClient from '@/api/authClient';
import { useQueryClient } from '@tanstack/react-query';
import { AUTH_BASE, STUDENT_BASE } from '@/config';

export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const queryClient = useQueryClient();
    const [studentComposite, setStudentComposite] = useState(null);


    const token = (() => {
        try { return localStorage.getItem('authToken'); } catch (e) { return null; }
    })();


    const roleIsStudent = (u) => {
        if (!u) return false;
        try {
            const r = (u.role || 'STUDENT').toString().trim().toUpperCase();
            return r === 'STUDENT';
        } catch (e) { return false; }
    };

    // Fetch composite from student service and cache it in react-query
    const fetchAndCacheStudentComposite = useCallback(async (maybeToken) => {
        const t = maybeToken ?? localStorage.getItem('authToken');
        if (!t) return null;
        try {
            // ensure studentApi sends header (interceptor will read localStorage if needed)
            const res = await studentApi.get('/students/me/full', {
                headers: { Authorization: `Bearer ${t}` }
            });
            const composite = res.data;
            queryClient.setQueryData(['studentComposite'], composite);
            try { setStudentComposite(composite); } catch (e) {}
            return composite;
        } catch (err) {
            console.debug('fetchStudentComposite failed', err?.response?.status ?? err?.message);
            return null;
        }
    }, [queryClient]);

    // login/logout/refresh/setUserRoleSafe definitions (moved out of useEffect)
    const login = useCallback(async (email, password) => {
        try {
            // call auth service using dedicated authClient
            const resp = await authClient.post('/login', { email, password });
            const { token: newToken, user: userPayload } = resp.data;

            const minimalUser = userPayload ?? { email: resp.data.email, role: resp.data.role ?? 'STUDENT' };
            if (!roleIsStudent(minimalUser)) {
                return { success: false, message: 'Only student accounts are allowed to log in here.' };
            }

            if (newToken) {
                localStorage.setItem('authToken', newToken);
                // set default header for studentApi so subsequent requests use it
                studentApi.defaults.headers.common.Authorization = `Bearer ${newToken}`;
            }

            setUser({ ...minimalUser, role: 'STUDENT' });

            // Immediately fetch the student composite using the new token
            const composite = await fetchAndCacheStudentComposite(newToken);
            if (composite?.student) {
                const stud = composite.student;
                if (!roleIsStudent(stud)) {
                    try { localStorage.removeItem('authToken'); } catch (e) {}
                    setUser(null);
                    return { success: false, message: 'Account is not a student.' };
                }
                setUser({ ...stud, role: 'STUDENT' });
            }

            queryClient.invalidateQueries(['studentComposite']);

            return { success: true, user: { ...minimalUser, role: 'STUDENT' } };
        } catch (err) {
            const msg = err?.response?.data?.message ?? err.message ?? 'Login failed';
            return { success: false, message: msg };
        }
    }, [fetchAndCacheStudentComposite, queryClient]);

    const logout = useCallback(() => {
        try { localStorage.removeItem('authToken'); } catch (e) {}
        try { delete studentApi.defaults.headers.common.Authorization; } catch (e) {}
        setUser(null);
        queryClient.removeQueries(['studentComposite']);
    }, [queryClient]);

    const refreshStudentComposite = useCallback(async () => {
        const t = localStorage.getItem('authToken');
        const composite = await fetchAndCacheStudentComposite(t);
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
        if (!roleIsStudent(u)) return;
        setUser({ ...u, role: 'STUDENT' });
    }, []);

    // On mount: if token exists, hydrate composite (preferred) and set user
    useEffect(() => {
        let mounted = true;
        const run = async () => {
            const t = localStorage.getItem('authToken');
            if (t) {
                // set default auth header for studentApi to reduce repeated localStorage reads
                studentApi.defaults.headers.common.Authorization = `Bearer ${t}`;

                try {
                    const composite = await fetchAndCacheStudentComposite(t);
                    if (composite?.student) {
                        const stud = composite.student;
                        if (!roleIsStudent(stud)) {
                            try { localStorage.removeItem('authToken'); } catch (ex) {}
                            setUser(null);
                        } else {
                            setUser({ ...stud, role: 'STUDENT' });
                        }
                    } else {
                        try {
                            const authResp = await studentApi.get('/students/me', {
                                headers: { Authorization: `Bearer ${t}` }
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
        return () => { mounted = false; };
    }, [fetchAndCacheStudentComposite]);

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
