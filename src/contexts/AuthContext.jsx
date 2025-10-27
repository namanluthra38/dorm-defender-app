import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // backend auth base URL (development: runs on localhost:4004)
  const AUTH_BASE = 'http://localhost:4004/auth';
  // student service base (development: runs on localhost:4000)
  const STUDENT_BASE = 'http://localhost:4000';

  /**
   * Login with email & password. Returns { success, user?, message? }.
   * Uses a relative URL so Vite dev proxy can forward to the backend in development.
   */
  const login = async (email, password) => {
    try {
      const res = await fetch(`${AUTH_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch (e) {
        // ignore parse errors
      }

      if (!res.ok) {
        return { success: false, message: data?.message ?? `HTTP ${res.status}` };
      }

      const userFromServer = data?.user ?? (data ?? { email });

      // store token if provided
      if (data?.token) {
        try {
          localStorage.setItem('authToken', data.token);
        } catch (e) {
          // ignore
        }
      }

      // If auth returned only email/id, try to fetch full student profile from student-service
      let finalUser = userFromServer;
      try {
        const token = data?.token || localStorage.getItem('authToken');
        if (token) {
          const profileRes = await fetch(`${STUDENT_BASE}/students/me`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${token}` },
          });
          if (profileRes.ok) {
            const profileJson = await profileRes.json();
            // prefer full profile from student service
            finalUser = { ...finalUser, ...profileJson };
          }
        }
      } catch (e) {
        // ignore profile fetch errors; keep minimal user info
      }

      setUser(finalUser);

      return { success: true, user: finalUser };
    } catch (err) {
      return { success: false, message: err?.message ?? 'Network error' };
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem('authToken');
    } catch (e) {
      // ignore
    }
  };

  /**
   * Fetch the user id (UUID) for the currently logged in user by email.
   * Returns { success: boolean, id?: string, message?: string }
   */
  const fetchUserId = async () => {
    const email = user?.email;
    if (!email) {
      return { success: false, message: 'No user email available' };
    }

    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${AUTH_BASE}/user/email/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!res.ok) {
        return { success: false, message: `HTTP ${res.status}` };
      }

      const id = await res.text();
      // endpoint returns UUID as plain text or JSON; try to parse if needed
      try {
        const parsed = JSON.parse(id);
        // if controller returned JSON object, try to extract id property
        if (typeof parsed === 'string') return { success: true, id: parsed };
        if (parsed?.id) return { success: true, id: parsed.id };
      } catch (e) {
        // not JSON, continue
      }

      return { success: true, id: id };
    } catch (err) {
      return { success: false, message: err?.message ?? 'Network error' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, fetchUserId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
