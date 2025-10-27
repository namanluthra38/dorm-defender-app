import { useEffect, useState } from 'react';

// Simple in-memory cache to avoid refetching when multiple components request same student
const STUDENT_CACHE_KEY = 'me';
const studentCache = new Map(); // key: 'me', value: student object

// Base URL - keep in sync with AuthContext if changed
const STUDENT_BASE = 'http://localhost:4000';

async function fetchJson(url, token) {
  // Debug: show outgoing requests in the browser console
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { headers });

    // capture raw text for debugging
    const text = await res.text().catch(() => null);
    // Try to parse JSON
    let parsed = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        parsed = null;
      }
    }

    // Debug: log the request and response summary
    try {
      console.debug('[useStudentDetails] fetch', { url, status: res.status, ok: res.ok, parsed, textSnippet: text ? (text.length > 200 ? text.slice(0, 200) + '...' : text) : null });
    } catch (e) {
      // ignore console errors in some environments
    }

    if (!res.ok) {
      const error = new Error(`HTTP ${res.status}` + (text ? `: ${text}` : ''));
      error.status = res.status;
      throw error;
    }

    return parsed;
  } catch (err) {
    // Debug: log fetch error
    try { console.debug('[useStudentDetails] fetch error', { url, error: err?.message ?? err }); } catch (e) {}
    throw err;
  }
}

/**
 * useStudentDetails
 * - Always fetches the currently-authenticated student via /students/me
 * Returns: { data: { student }, loading, error, refresh }
 */
export default function useStudentDetails() {
  const [data, setData] = useState(() => {
    const cached = studentCache.get(STUDENT_CACHE_KEY);
    return cached ? { student: cached } : null;
  });
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch student from /students/me
        let student = studentCache.get(STUDENT_CACHE_KEY);
        if (!student) {
          const url = `${STUDENT_BASE}/students/me`;
          student = await fetchJson(url, token);
          studentCache.set(STUDENT_CACHE_KEY, student);
        }

        if (!mounted) return;
        setData({ student });
        setLoading(false);
      } catch (e) {
        if (!mounted) return;
        setError(e);
        setLoading(false);
      }
    };

    load();
    return () => (mounted = false);
  }, [token]);

  const refresh = async () => {
    studentCache.delete(STUDENT_CACHE_KEY);

    setData(null);
    setLoading(true);
    setError(null);

    try {
      const url = `${STUDENT_BASE}/students/me`;
      const student = await fetchJson(url, token);
      studentCache.set(STUDENT_CACHE_KEY, student);

      setData({ student });
      setLoading(false);
    } catch (e) {
      setError(e);
      setLoading(false);
    }
  };

  return { data, loading, error, refresh };
}
