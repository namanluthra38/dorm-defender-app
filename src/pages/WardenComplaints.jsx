import React, { useMemo, useState, useEffect } from 'react';
import useWardenLists from '@/hooks/useWardenLists';
import { useWardenAuth } from '@/contexts/WardenAuthContext';
import { REQUEST_BASE } from '@/config';

const WardenComplaints = () => {
  const { requests, rooms, students, complaints, isLoading } = useWardenLists();
  const { wardenComposite, user } = useWardenAuth();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  // keep a local editable copy so we can mark resolved locally without mutating the react-query cache
  const [localComplaints, setLocalComplaints] = useState([]);

  useEffect(() => {
    if (Array.isArray(complaints)) setLocalComplaints(complaints);
  }, [complaints]);

  const normalizeStatus = (s) => {
    if (!s) return '';
    return s.toString().toLowerCase().replace(/[_-]/g, ' ').trim();
  };

  const getDisplayStatus = (s) => {
    const n = normalizeStatus(s);
    if (!n) return 'Unknown';
    if (n === 'open') return 'Open';
    if (n === 'in progress' || n === 'under review') return 'Under Review';
    if (n === 'resolved') return 'Resolved';
    if (n === 'approved') return 'Approved';
    return n.split(' ').map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ');
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (localComplaints || []).filter(c => {
      const statusNorm = normalizeStatus(c.status);
      if (statusFilter !== 'all' && statusNorm !== statusFilter) return false;
      if (!q) return true;
      return (String(c.title || '') + ' ' + String(c.id || '') + ' ' + String(c.description || c.details || '')).toLowerCase().includes(q);
    });
  }, [localComplaints, query, statusFilter]);

  // optimistic patch to backend, rollback on failure
  const patchStatus = async (id, statusStr) => {
    const prev = localComplaints;
    // optimistic update
    setLocalComplaints(prevList => prevList.map(c => c.id === id ? { ...c, status: statusStr } : c));
    try {
      const token = (() => { try { return localStorage.getItem('authToken'); } catch (e) { return null; }})();
      const url = `${REQUEST_BASE}/complaints/${encodeURIComponent(id)}/status?status=${encodeURIComponent(statusStr)}`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed ${res.status}`);
      }
      const updated = await res.json();
      // replace with server-updated object (if returned)
      setLocalComplaints(prevList => prevList.map(c => c.id === id ? (updated || { ...c, status: statusStr }) : c));
    } catch (e) {
      // rollback
      alert('Failed to update complaint status: ' + (e.message || e));
      setLocalComplaints(prev);
    }
  };

  const markResolved = (id) => patchStatus(id, 'RESOLVED');
  const markInProgress = (id) => patchStatus(id, 'IN_PROGRESS');

  const pendingRequestsCount = Array.isArray(requests) ? requests.filter(r => String(r.status || '').toLowerCase() === 'pending').length : 0;
  const studentsCount = Array.isArray(students) ? students.length : 0;
  const roomsCount = Array.isArray(rooms) ? rooms.length : 0;

  const hostelName = 'Hostel - ' + (wardenComposite?.hostel.name || '(unavailable)');
  const wardenProfile = wardenComposite?.warden || user || {};

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Complaints</h2>
          <p className="text-sm text-gray-500">Overview of student complaints — you can mark items resolved or open investigations</p>
          <div className="mt-2 text-sm text-gray-600">{hostelName}</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center bg-gray-100 rounded-md px-3 py-1">
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search complaints" className="bg-transparent outline-none text-sm" />
          </div>

          <div className="hidden md:flex flex-col text-right mr-2">
            <div className="text-xs text-gray-500">Pending requests</div>
            <div className="font-semibold">{pendingRequestsCount}</div>
          </div>

          <div className="hidden md:flex flex-col text-right mr-2">
            <div className="text-xs text-gray-500">Students</div>
            <div className="font-semibold">{studentsCount}</div>
          </div>

          <div className="hidden md:flex flex-col text-right mr-2">
            <div className="text-xs text-gray-500">Rooms</div>
            <div className="font-semibold">{roomsCount}</div>
          </div>

          <div className="flex items-center gap-2 bg-white border rounded px-3 py-2">
            <div className="text-sm">
              <div className="font-medium">{wardenProfile?.name || wardenProfile?.email || 'Warden'}</div>
              <div className="text-xs text-gray-500">{wardenProfile?.email || ''}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <label className="text-sm text-gray-500">Filter:</label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border rounded px-2 py-1">
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="under review">Under Review</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="bg-white border rounded-md p-4">
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading complaints...</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-gray-500">No complaints match the filter/search.</div>
        ) : (
          <ul className="space-y-3">
            {filtered.map(c => (
              <li key={c.id} className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{c.title || c.subject || 'Untitled'}</p>
                  <p className="text-xs text-gray-400">{new Date(c.createdAt || c.date || Date.now()).toLocaleDateString()} • {getDisplayStatus(c.status)}</p>
                  <p className="text-sm text-gray-700 mt-2">{c.description || c.details || ''}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {/* show "Mark In Progress" if not already in progress or resolved */}
                  {normalizeStatus(c.status) !== 'in progress' && normalizeStatus(c.status) !== 'resolved' && (
                    <button onClick={() => markInProgress(c.id)} className="px-3 py-1 rounded bg-yellow-600 text-white text-sm">Mark In Progress</button>
                  )}
                  {getDisplayStatus(c.status) !== 'Resolved' ? (
                    <button onClick={() => markResolved(c.id)} className="px-3 py-1 rounded bg-green-600 text-white text-sm">Mark Resolved</button>
                  ) : (
                    <div className="text-xs text-gray-500">Resolved</div>
                  )}
                  <button onClick={() => alert('Open complaint details modal')} className="px-3 py-1 rounded border text-sm">Details</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WardenComplaints;
