// src/contexts/WardenAuthContext.jsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import wardenApi from '@/api/wardenClient';
import authClient from '@/api/authClient';
import { useQueryClient } from '@tanstack/react-query';

export const WardenAuthContext = createContext();

export const WardenAuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const queryClient = useQueryClient();
    const [wardenComposite, setWardenComposite] = useState(null);

    const token = (() => {
        try { return localStorage.getItem('authToken'); } catch (e) { return null; }
    })();

    const roleIsWarden = (u) => {
        if (!u) return false;
        try {
            const r = (u.role || 'WARDEN').toString().trim().toUpperCase();
            return r === 'WARDEN';
        } catch (e) { return false; }
    };

    // Fetch composite from warden service and cache it in react-query
    const fetchAndCacheWardenComposite = useCallback(async (maybeToken) => {
        const t = maybeToken ?? localStorage.getItem('authToken');
        if (!t) return null;
        try {
            const res = await wardenApi.get('/wardens/me/full', {
                headers: { Authorization: `Bearer ${t}` }
            });
            const composite = res.data;
            queryClient.setQueryData(['wardenComposite'], composite);
            try { setWardenComposite(composite); } catch (e) {}

            // NOTE: Removed prefetching of requests/rooms/students/complaints here.
            // Let useWardenLists (the hook) own fetching and caching of those lists to avoid duplicate network calls.

            try { setUser({ ...minimalUser, role: 'WARDEN' }); } catch (e) {}
            return composite;
        } catch (err) {
            console.debug('fetchWardenComposite failed', err?.response?.status ?? err?.message);
            return null;
        }
    }, [queryClient]);

    // login/logout/refresh/setUserRoleSafe definitions
    const login = useCallback(async (email, password) => {
        try {
            const resp = await authClient.post('/login', { email, password });
            const { token: newToken, user: userPayload } = resp.data;

            const minimalUser = userPayload ?? { email: resp.data.email, role: resp.data.role ?? 'WARDEN' };
            if (!roleIsWarden(minimalUser)) {
                return { success: false, message: 'Only warden accounts are allowed to log in here.' };
            }

            if (newToken) {
                localStorage.setItem('authToken', newToken);
                wardenApi.defaults.headers.common.Authorization = `Bearer ${newToken}`;
            }

            setUser({ ...minimalUser, role: 'WARDEN' });

            const composite = await fetchAndCacheWardenComposite(newToken);
            if (composite?.warden) {
                const ward = composite.warden;
                if (!roleIsWarden(ward)) {
                    try { localStorage.removeItem('authToken'); } catch (e) {}
                    setUser(null);
                    return { success: false, message: 'Account is not a warden.' };
                }
                setUser({ ...ward, role: 'WARDEN' });
            }

            queryClient.invalidateQueries(['wardenComposite']);

            return { success: true, user: { ...minimalUser, role: 'WARDEN' } };
        } catch (err) {
            const msg = err?.response?.data?.message ?? err.message ?? 'Login failed';
            return { success: false, message: msg };
        }
    }, [fetchAndCacheWardenComposite, queryClient]);

    const logout = useCallback(() => {
        try { localStorage.removeItem('authToken'); } catch (e) {}
        try { delete wardenApi.defaults.headers.common.Authorization; } catch (e) {}
        setUser(null);
        queryClient.removeQueries(['wardenComposite']);
    }, [queryClient]);

    const refreshWardenComposite = useCallback(async () => {
        const t = localStorage.getItem('authToken');
        const composite = await fetchAndCacheWardenComposite(t);
        if (composite?.warden) {
            const ward = composite.warden;
            if (!roleIsWarden(ward)) {
                try { localStorage.removeItem('authToken'); } catch (e) {}
                setUser(null);
            } else {
                setUser({ ...ward, role: 'WARDEN' });
            }
        }
        return composite;
    }, [fetchAndCacheWardenComposite]);

    const setUserRoleSafe = useCallback((u) => {
        if (!u) return;
        if (!roleIsWarden(u)) return;
        setUser({ ...u, role: 'WARDEN' });
    }, []);

    useEffect(() => {
        let mounted = true;
        const run = async () => {
            const t = localStorage.getItem('authToken');
            if (t) {
                wardenApi.defaults.headers.common.Authorization = `Bearer ${t}`;

                try {
                    const composite = await fetchAndCacheWardenComposite(t);
                    if (composite?.warden) {
                        const ward = composite.warden;
                        if (!roleIsWarden(ward)) {
                            try { localStorage.removeItem('authToken'); } catch (ex) {}
                            setUser(null);
                        } else {
                            setUser({ ...ward, role: 'WARDEN' });
                        }
                    } else {
                        try {
                            const authResp = await wardenApi.get('/wardens/me', {
                                headers: { Authorization: `Bearer ${t}` }
                            });
                            const minimal = authResp.data;
                            if (!roleIsWarden(minimal)) {
                                try { localStorage.removeItem('authToken'); } catch (ex) {}
                                setUser(null);
                            } else {
                                setUser({ ...minimal, role: 'WARDEN' });
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
    }, [fetchAndCacheWardenComposite]);

    return (
        <WardenAuthContext.Provider value={{
            user,
            token,
            wardenComposite,
            setUser: setUserRoleSafe,
            isInitializing,
            login,
            logout,
            refreshWardenComposite
        }}>
            {children}
        </WardenAuthContext.Provider>
    );
};

export const useWardenAuth = () => {
    const ctx = useContext(WardenAuthContext);
    if (!ctx) throw new Error('useWardenAuth must be used within WardenAuthProvider');
    return ctx;
};