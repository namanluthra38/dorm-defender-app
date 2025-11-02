import React, { useMemo, useState, useEffect } from 'react';
import { PlusCircle, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWardenAuth } from '@/contexts/WardenAuthContext';
import useWardenComposite from '@/hooks/useWardenComposite';
import { STUDENT_BASE, HOSTEL_BASE } from '@/config';

const safeGetToken = () => {
  try { return localStorage.getItem('authToken'); } catch (e) { return null; }
};

const WardenStudents = () => {
  const navigate = useNavigate();
  const { user: wardenUser } = useWardenAuth();
  const { data: composite, isLoading: compositeLoading } = useWardenComposite();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hostelId = useMemo(() => {
    if (composite?.hostels && composite.hostels.length > 0) return composite.hostels[0].id;
    return (wardenUser?.hostelId ?? null);
  }, [composite, wardenUser]);

  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();
    const token = safeGetToken();

    const load = async () => {
      if (!hostelId) {
        setStudents([]);
        setError(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const studentsUrl = `${STUDENT_BASE}/students/hostel/${encodeURIComponent(hostelId)}`;
        const roomsUrl = `${HOSTEL_BASE}/hostels/rooms/hostel/${encodeURIComponent(hostelId)}`;

        // fetch students and rooms in parallel
        const [sRes, rRes] = await Promise.all([
          fetch(studentsUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            signal: controller.signal,
          }),
          fetch(roomsUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            signal: controller.signal,
          })
        ]);

        if (aborted) return;

        if (!sRes.ok) {
          const txt = await sRes.text().catch(() => null);
          setError(`Failed to load students: ${sRes.status} ${txt ?? ''}`);
          setStudents([]);
          return;
        }

        if (!rRes.ok) {
          // rooms failed - we can continue without room numbers but warn
          console.debug('Failed to load rooms for hostel', hostelId, rRes.status);
        }

        const studentsData = await sRes.json();
        const roomsData = rRes.ok ? await rRes.json().catch(() => []) : [];

        // build map roomId -> roomNumber
        const roomMap = (Array.isArray(roomsData) ? roomsData : []).reduce((acc, room) => {
          if (room && room.id) acc[String(room.id)] = room.roomNumber ?? room.roomNumber;
          return acc;
        }, {});

        const normalized = (Array.isArray(studentsData) ? studentsData : []).map(s => ({
          ...s,
          roomNumber: s.roomId ? roomMap[String(s.roomId)] ?? s.roomNumber : s.roomNumber
        }));

        if (!aborted) setStudents(normalized);
      } catch (e) {
        if (!aborted) setError(e.message ?? String(e));
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    if (!compositeLoading) load();
    return () => { aborted = true; controller.abort(); };
  }, [hostelId, compositeLoading]);

  // Debounce the query to avoid frequent re-filtering while user types
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    const list = students.slice();
    // sort by roomNumber if present (numeric), else by roomId/string
    list.sort((a, b) => {
      const ar = a.roomId || a.room || '';
      const br = b.roomId || b.room || '';
      const an = parseInt(String(a.roomNumber ?? a.room ?? '').replace(/[^0-9]/g, ''), 10);
      const bn = parseInt(String(b.roomNumber ?? b.room ?? '').replace(/[^0-9]/g, ''), 10);
      if (!isNaN(an) && !isNaN(bn)) return an - bn;
      if (!isNaN(an) && isNaN(bn)) return -1;
      if (isNaN(an) && !isNaN(bn)) return 1;
      return String(ar).localeCompare(String(br));
    });
    if (!q) return list;
    return list.filter(s => {
      const hay = `${s.name ?? ''} ${s.uid ?? s.id ?? ''} ${s.roomNumber ?? s.roomId ?? s.room ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [students, debouncedQuery]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Students</h2>
          <p className="text-sm text-gray-500">Search and manage students in your hostels</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-md px-3 py-1">
            <Search className="w-4 h-4 text-gray-400 mr-2" aria-hidden />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, uid/id or room"
              aria-label="Search students"
              className="bg-transparent outline-none text-sm w-48 md:w-80"
            />
            {query ? (
              <button
                aria-label="Clear search"
                onClick={() => setQuery('')}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>
          <button className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-md text-sm" onClick={() => navigate('students/new')}>
            <PlusCircle className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-md p-4">
        {compositeLoading || loading ? (
          <div className="text-sm text-gray-500">Loading students…</div>
        ) : error ? (
          <div className="text-sm text-rose-600">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-gray-500">No students found. Try a different search or add a new student.</div>
        ) : (
          <ul className="divide-y">
            {filtered.map(s => (
              <li key={s.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{s.name} <span className="text-xs text-gray-400">({s.uid ?? s.id})</span></p>
                  <p className="text-xs text-gray-400">Room: {s.roomNumber ?? s.roomId ?? s.room ?? '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/warden/students/${s.id}`)} className="px-3 py-1 rounded bg-sky-500 text-white text-sm">Details</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WardenStudents;
