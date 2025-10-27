import { useEffect, useState } from 'react';

// Cache key for the composite response
const STUDENT_COMPOSITE_KEY = 'me:composite';
const compositeCache = new Map(); // key: 'me:composite', value: { student, room, hostel }

// Base URL - keep in sync with AuthContext if changed
const STUDENT_BASE = 'http://localhost:4000';

async function fetchJson(url, token) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { headers });

    const text = await res.text().catch(() => null);
    let parsed = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch (e) {
        parsed = null;
      }
    }

    try {
      console.debug('[useStudentDetails] fetch', { url, status: res.status, ok: res.ok, parsed });
    } catch (e) {}

    if (!res.ok) {
      const error = new Error(`HTTP ${res.status}` + (text ? `: ${text}` : ''));
      error.status = res.status;
      throw error;
    }

    return parsed;
  } catch (err) {
    try { console.debug('[useStudentDetails] fetch error', { url, error: err?.message ?? err }); } catch (e) {}
    throw err;
  }
}

/**
 * useStudentDetails
 * - Always fetches the composite: /students/me/full
 * Returns: { data: { student, room, hostel }, loading, error, refresh }
 */
export default function useStudentDetails() {
  const [data, setData] = useState(() => compositeCache.get(STUDENT_COMPOSITE_KEY) ? { ...compositeCache.get(STUDENT_COMPOSITE_KEY) } : null);
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        let composite = compositeCache.get(STUDENT_COMPOSITE_KEY);
        if (!composite) {
          const url = `${STUDENT_BASE}/students/me/full`;
          composite = await fetchJson(url, token);
          // composite expected shape: { student, room, hostel }
          compositeCache.set(STUDENT_COMPOSITE_KEY, composite);
        }

        if (!mounted) return;
        setData({ ...composite });
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
    compositeCache.delete(STUDENT_COMPOSITE_KEY);
    setData(null);
    setLoading(true);
    setError(null);
    try {
      const url = `${STUDENT_BASE}/students/me/full`;
      const composite = await fetchJson(url, token);
      compositeCache.set(STUDENT_COMPOSITE_KEY, composite);
      setData({ ...composite });
      setLoading(false);
    } catch (e) {
      setError(e);
      setLoading(false);
    }
  };

  return { data, loading, error, refresh };
}
