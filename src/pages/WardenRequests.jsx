import React, { useMemo, useState, useEffect, useCallback } from 'react';
import useWardenLists from '@/hooks/useWardenLists';
import { REQUEST_BASE, STUDENT_BASE, HOSTEL_BASE } from '@/config';
import { useWardenAuth } from '@/contexts/WardenAuthContext';



const safeGetToken = () => {
  try { return localStorage.getItem('authToken'); } catch (e) { return null; }
};

// helper: safely extract student id from a request (prefer studentId, then student.id, student.studentId)
const extractStudentId = (r) => {
  if (!r) return null;
  if (r.studentId) return String(r.studentId);
  const s = r.student;
  if (!s) return null;
  if (typeof s === 'string') return s;
  if (typeof s === 'object') {
    if (s.id) return String(s.id);
    if (s.studentId) return String(s.studentId);
  }
  return null;
};

// helper: safely extract hostel id from request details or top-level
const extractHostelId = (r) => {
  if (!r) return null;
  if (r.details && r.details.hostelId) return String(r.details.hostelId);
  if (r.hostelId) return String(r.hostelId);
  return null;
};

const formatDetails = (d) => {
  if (d == null) return '—';
  if (typeof d === 'string') return d;
  if (typeof d === 'number' || typeof d === 'boolean') return String(d);
  if (Array.isArray(d)) return d.join(', ');
  if (typeof d === 'object') {
    if (d.roomId) return `Room: ${d.roomId}`;
    try {
      return Object.entries(d)
          .filter(([k]) => String(k).toLowerCase() !== 'hostelid')
          .map(([k, v]) => `${k}: ${String(v)}`).join(', ');
    } catch (e) {
      try {
        const copy = { ...d };
        delete copy.hostelId;
        return JSON.stringify(copy);
      } catch (_) {
        return '—';
      }
    }
  }
  return String(d);
};

const renderValue = (v) => {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'object') {
    if (v.name) return String(v.name);
    if (v.fullName) return String(v.fullName);
    if (v.studentName) return String(v.studentName);
    try {
      const copy = { ...v };
      if ('hostelId' in copy) delete copy.hostelId;
      return JSON.stringify(copy);
    } catch (e) { return String(v); }
  }
  return String(v);
};

const getStudentDisplay = (r) => {
  if (r?.studentName && typeof r.studentName === 'string' && r.studentName.trim() !== '') return r.studentName;
  if (r?.studentId) return `(${String(r.studentId)})`;
  const s = r.student;
  if (!s) return 'Unknown';
  if (typeof s === 'string') return String(s);
  if (typeof s === 'object') return (s.name || s.fullName || s.studentName || (s.id ? `(${String(s.id)})` : 'Unknown'));
  return 'Unknown';
};

const mapFriendlyToEnum = (friendly) => {
  const mapping = {
    approved: 'APPROVED',
    denied: 'REJECTED',
    rejected: 'REJECTED',
    pending: 'PENDING',
  };
  return mapping[String(friendly).toLowerCase()] || String(friendly).toUpperCase();
};

const WardenRequests = () => {
  const { requests = [], students = [], isLoading } = useWardenLists();
  const { wardenComposite } = useWardenAuth();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [localRequests, setLocalRequests] = useState([]);
  const [studentCache, setStudentCache] = useState({});
  const [hostelCache, setHostelCache] = useState({});
  const [updatingIds, setUpdatingIds] = useState(new Set());

  // initialize/enrich localRequests from hook data and students/hostels
  useEffect(() => {
    if (!Array.isArray(requests)) return;

    const enriched = requests.map(r => {
      // studentName preference order: r.studentName, r.student?.name, students list, cache
      const sid = extractStudentId(r);
      let studentName = r.studentName || (r.student && typeof r.student === 'object' ? (r.student.name || r.student.fullName || r.student.studentName) : null);
      if (!studentName && sid) {
        const found = (Array.isArray(students) ? students : []).find(s => String(s.id) === String(sid));
        if (found) studentName = found.name || found.fullName || found.studentName;
        else if (studentCache[String(sid)]) studentName = studentCache[String(sid)];
      }

      // hostel name: check request.details.hostelId or r.hostelId
      const hid = extractHostelId(r);
      let hostelName = null;
      if (hid) {
        const foundH = (wardenComposite?.hostels || []).find(h => String(h.id) === String(hid));
        if (foundH) hostelName = foundH.name;
        else if (hostelCache[String(hid)]) hostelName = hostelCache[String(hid)];
      }

      return { ...r, studentName, hostelName };
    });

    setLocalRequests(enriched);

    // fetch any missing student/hostel names (best-effort, cached)
    const missingStudentIds = Array.from(new Set(enriched.map(e => extractStudentId(e)).filter(Boolean))).filter(id => !enriched.find(e => String(extractStudentId(e)) === String(id) && e.studentName) && !studentCache[id]);
    const missingHostelIds = Array.from(new Set(enriched.map(e => extractHostelId(e)).filter(Boolean))).filter(id => !enriched.find(e => String(extractHostelId(e)) === String(id) && e.hostelName) && !hostelCache[id]);

    if (missingStudentIds.length > 0) {
      missingStudentIds.forEach(id => fetchAndCacheStudentName(id));
    }
    if (missingHostelIds.length > 0) {
      missingHostelIds.forEach(id => fetchAndCacheHostelName(id));
    }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requests, students, wardenComposite]);

  // fetch and cache functions
  const fetchAndCacheStudentName = async (id) => {
    if (!id) return;
    try {
      const token = safeGetToken();
      const res = await fetch(`${STUDENT_BASE}/students/${encodeURIComponent(id)}`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (!res.ok) return;
      const data = await res.json();
      const name = data?.name || data?.fullName || data?.studentName || null;
      if (name) {
        setStudentCache(prev => ({ ...prev, [String(id)]: name }));
        setLocalRequests(prev => prev.map(r => {
          const sid = extractStudentId(r);
          if (sid && String(sid) === String(id)) return { ...r, studentName: name };
          return r;
        }));
      }
    } catch (e) {
      // ignore
    }
  };

  const fetchAndCacheHostelName = async (id) => {
    if (!id) return;
    try {
      const token = safeGetToken();
      const res = await fetch(`${HOSTEL_BASE}/hostels/${encodeURIComponent(id)}`, {
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (!res.ok) return;
      const data = await res.json();
      const name = data?.name || data?.hostelName || null;
      if (name) {
        setHostelCache(prev => ({ ...prev, [String(id)]: name }));
        setLocalRequests(prev => prev.map(r => {
          const hid = extractHostelId(r);
          if (hid && String(hid) === String(id)) return { ...r, hostelName: name };
          return r;
        }));
      }
    } catch (e) {
      // ignore
    }
  };

  const getStudentNameSync = (id) => {
    if (!id) return 'Unknown';
    const sid = String(id);
    if (studentCache && studentCache[sid]) return studentCache[sid];
    const found = (Array.isArray(students) ? students : []).find(s => String(s.id) === sid);
    if (found) return found.name || found.fullName || found.studentName || sid;
    return `(${sid})`;
  };

  const filtered = useMemo(() => {
     const q = query.trim().toLowerCase();
    return (localRequests || []).filter(r => {
      if (statusFilter !== 'all' && (String(r.status || '').toLowerCase() !== statusFilter)) return false;
      if (!q) return true;
      const sid = extractStudentId(r);
      const studentText = (String(r.studentName || getStudentNameSync(sid))).toLowerCase();
      const hay = (String(r.id) + ' ' + studentText + ' ' + String(r.status || '') ).toLowerCase();
      return hay.includes(q);
    });
  }, [localRequests, query, statusFilter]);

  // --- update status (optimistic) ---
  const updateStatus = useCallback(async (id, newStatusFriendly) => {
    setUpdatingIds(prev => new Set(prev).add(id));

    let prevStatus = null;
    setLocalRequests(prev => prev.map(r => {
      if (r.id === id) {
        prevStatus = r.status;
        return { ...r, status: newStatusFriendly };
      }
      return r;
    }));

    const token = safeGetToken();
    const enumStatus = mapFriendlyToEnum(newStatusFriendly);
    // keep reviewedBy the same as before; since we removed wardenUser usage, use 'warden' as default
    const url = `${REQUEST_BASE}/requests/${encodeURIComponent(id)}/status?status=${encodeURIComponent(enumStatus)}&reviewedBy=warden`;

    try {
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      });

      if (!res.ok) {
        // revert optimistic update
        setLocalRequests(prev => prev.map(r => r.id === id ? { ...r, status: prevStatus ?? 'PENDING' } : r));
        const txt = await res.text().catch(() => null);
        window.alert(`Failed to update status: ${res.status} ${txt ?? ''}`);
        return;
      }

      const updated = await res.json().catch(() => null);
      if (updated && updated.id) {
        setLocalRequests(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
      }
    } catch (e) {
      setLocalRequests(prev => prev.map(r => r.id === id ? { ...r, status: prevStatus ?? 'PENDING' } : r));
      window.alert(`Failed to update status: ${e?.message ?? String(e)}`);
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const isUpdating = useCallback((id) => updatingIds.has(id), [updatingIds]);

  return (
       <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Requests</h2>
            <p className="text-sm text-gray-500">Review student requests and approve or deny them</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center bg-gray-100 rounded-md px-3 py-1">
              <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search requests"
                  className="bg-transparent outline-none text-sm"
              />
            </div>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-3">
          <label className="text-sm text-gray-500">Filter:</label>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border rounded px-2 py-1">
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div className="bg-white border rounded-md p-4">
          {isLoading ? (
              <div className="text-sm text-gray-500">Loading requests…</div>
          ) : filtered.length === 0 ? (
              <div className="text-sm text-gray-500">No requests found for the chosen filter/search.</div>
          ) : (
              <ul className="space-y-3">
                {filtered.map(r => {
                  const st = String(r.status || '').toLowerCase();
                  const isFinal = ['approved', 'rejected', 'denied'].includes(st);
                  const sid = extractStudentId(r);
                  const studentDisplay = r.studentName || getStudentNameSync(sid);
                  return (
                      <li key={r.id} className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{renderValue(r.type)} — {studentDisplay}</p>
                          <p className="text-xs text-gray-400">{String(r.status)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="text-xs text-gray-500">Actions</div>
                          <div className="flex gap-2">
                            {!isFinal && (
                                <>
                                  <button
                                      onClick={() => updateStatus(r.id, 'Approved')}
                                      disabled={isUpdating(r.id)}
                                      className="px-3 py-1 rounded bg-emerald-600 text-white text-sm disabled:opacity-60"
                                  >
                                    {isUpdating(r.id) ? 'Updating…' : 'Approve'}
                                  </button>
                                  <button
                                      onClick={() => updateStatus(r.id, 'Denied')}
                                      disabled={isUpdating(r.id)}
                                      className="px-3 py-1 rounded bg-rose-600 text-white text-sm disabled:opacity-60"
                                  >
                                    {isUpdating(r.id) ? 'Updating…' : 'Deny'}
                                  </button>
                                </>
                            )}
                            <button onClick={() => alert('Open request details modal')} className="px-3 py-1 rounded border text-sm">Details</button>
                          </div>
                        </div>
                      </li>
                  );
                })}
              </ul>
          )}
        </div>
      </div>
  );
};

export default WardenRequests;
