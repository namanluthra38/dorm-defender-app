import React, { useMemo, useState, useEffect } from 'react';
import { PlusCircle, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useWardenLists from '@/hooks/useWardenLists';

const WardenStudents = () => {
  const navigate = useNavigate();
  const { students = [], rooms = [], isLoading } = useWardenLists();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // normalize students by attaching roomNumber using rooms from the hook
  const normalizedStudents = useMemo(() => {
    const roomMap = (Array.isArray(rooms) ? rooms : []).reduce((acc, room) => {
      if (room && room.id) acc[String(room.id)] = room.roomNumber ?? room.roomNumber;
      return acc;
    }, {});
    return (Array.isArray(students) ? students : []).map(s => ({
      ...s,
      roomNumber: s.roomId ? roomMap[String(s.roomId)] ?? s.roomNumber : s.roomNumber
    }));
  }, [students, rooms]);

  // Debounce the query to avoid frequent re-filtering while user types
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    const list = normalizedStudents.slice();
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
  }, [normalizedStudents, debouncedQuery]);

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
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading students…</div>
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
