import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useWardenAuth } from '@/contexts/WardenAuthContext';
import useWardenComposite from '@/hooks/useWardenComposite';
import { REQUEST_BASE, STUDENT_BASE } from '@/config';



const safeGetToken = () => {
  try { return localStorage.getItem('authToken'); } catch (e) { return null; }
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
  const { user: wardenUser } = useWardenAuth();
  const { data: composite, isLoading: compositeLoading } = useWardenComposite();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // track ids that are currently being updated so UI can disable buttons
  const [updatingIds, setUpdatingIds] = useState(new Set());

  // derive hostelId (memoized)
  const hostelId = useMemo(() => {
    if (composite?.hostels && composite.hostels.length > 0) return composite.hostels[0].id;
    return (wardenUser?.hostelId ?? null);
  }, [composite, wardenUser]);

  // --- load requests & student names ---
  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();
    const token = safeGetToken();

    const loadRequests = async () => {
      if (!hostelId) {
        setRequests([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const url = `${REQUEST_BASE}/requests/hostel/${encodeURIComponent(hostelId)}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });

        if (aborted) return;

        if (!res.ok) {
          const txt = await res.text().catch(() => null);
          setError(`Failed to load requests: ${res.status} ${txt ?? ''}`);
          setRequests([]);
          return;
        }

        const data = await res.json();
        const items = Array.isArray(data) ? data : [];

        // merge any embedded student name from nested object
        const initial = items.map(r => {
          let studentName = r.studentName;
          if (!studentName || typeof studentName !== 'string') {
            const s = r.student;
            if (s && typeof s === 'object') studentName = s.name || s.fullName || s.studentName || studentName;
          }
          return studentName ? { ...r, studentName } : r;
        });

        if (aborted) return;
        setRequests(initial);

        // collect missing student IDs we want names for
        const ids = Array.from(new Set(initial
            .map(r => {
              const hasName = (typeof r.studentName === 'string' && r.studentName.trim() !== '');
              if (hasName) return null;
              if (r.studentId) return String(r.studentId);
              const s = r.student;
              if (!s) return null;
              if (typeof s === 'string') return s;
              if (typeof s === 'object' && (s.id || s.studentId)) return (s.id || s.studentId);
              return null;
            })
            .filter(Boolean)));

        if (ids.length === 0 || aborted) {
          return;
        }

        // Try a batch endpoint first: /students?ids=id1,id2 - if your API supports a different batch endpoint, adjust here.
        // If batch fails, fall back to per-id requests.
        let namePairs = []; // { id, name }

        try {
          const batchUrl = `${STUDENT_BASE}/students?ids=${ids.map(encodeURIComponent).join(',')}`;
          const batchResp = await fetch(batchUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            signal: controller.signal,
          });

          if (aborted) return;

          if (batchResp.ok) {
            const list = await batchResp.json();
            if (Array.isArray(list)) {
              namePairs = list
                  .map(s => ({ id: String(s.id || s.studentId || s._id || ''), name: s.name || s.fullName || s.studentName || null }))
                  .filter(p => p.id && p.name);
            }
          } else if (batchResp.status === 401 || batchResp.status === 403) {
            // permission issue — fall back to per-id fetches below
            // but keep going silently
          } else {
            // other non-ok: try per-id below
          }
        } catch (e) {
          // batch fetch may not be supported or aborted — we'll fall back to per-id below
        }

        if (namePairs.length === 0) {
          // fallback: individual attempts (try per-id name endpoint, then try /students list fallback)
          let studentsListCache = null;

          const fetchNameForId = async (studentId) => {
            if (!studentId) return null;
            try {
              const singleUrl = `${STUDENT_BASE}/students/${encodeURIComponent(studentId)}/name`;
              const resp = await fetch(singleUrl, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                signal: controller.signal,
              });

              if (aborted) return null;

              if (resp.ok) {
                const txt = await resp.text();
                return txt || null;
              }

              if (resp.status === 401 || resp.status === 403) {
                // try list fallback
                if (!studentsListCache) {
                  try {
                    const listRes = await fetch(`${STUDENT_BASE}/students`, {
                      method: 'GET',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                      signal: controller.signal,
                    });
                    if (listRes.ok) studentsListCache = await listRes.json();
                    else studentsListCache = [];
                  } catch (e) {
                    studentsListCache = [];
                  }
                }
                const found = (studentsListCache || []).find(s => String(s.id) === String(studentId) || String(s.id) === studentId);
                if (found) return (found.name || found.fullName || found.studentName || null);
              }

              return null;
            } catch (e) {
              return null;
            }
          };

          const pairs = await Promise.all(ids.map(id => fetchNameForId(id).then(name => ({ id, name }))));
          namePairs = pairs.filter(p => p.name);
        }

        if (aborted) return;

        if (namePairs.length > 0) {
          setRequests(prev => prev.map(r => {
            const sid = r.studentId ? String(r.studentId) : (r.student && typeof r.student === 'string' ? r.student : (r.student && r.student.id ? r.student.id : null));
            if (!r.studentName && sid) {
              const found = namePairs.find(p => String(p.id) === String(sid) && p.name);
              if (found) return { ...r, studentName: found.name };
            }
            return r;
          }));
        } else {
          // no names found - do nothing (we already set initial requests)
        }
      } catch (e) {
        if (!aborted) {
          setError(e.message ?? String(e));
          setRequests([]);
        }
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    // only run when composite finished loading (or warden user present)
    if (!compositeLoading) loadRequests();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [hostelId, compositeLoading]);

  // --- filtered list (memoized) ---
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter(r => {
      if (statusFilter !== 'all' && (String(r.status || '').toLowerCase() !== statusFilter)) return false;
      if (!q) return true;
      const detailsText = (r.details != null) ? formatDetails(r.details).toLowerCase() : '';
      const studentText = renderValue(getStudentDisplay(r)).toLowerCase();
      const hay = (String(r.id) + ' ' + studentText + ' ' + renderValue(r.type) + ' ' + detailsText).toLowerCase();
      return hay.includes(q);
    });
  }, [requests, query, statusFilter]);

  // --- update status (optimistic) ---
  const updateStatus = useCallback(async (id, newStatusFriendly) => {
    setUpdatingIds(prev => new Set(prev).add(id));

    let prevStatus = null;
    setRequests(prev => prev.map(r => {
      if (r.id === id) {
        prevStatus = r.status;
        return { ...r, status: newStatusFriendly };
      }
      return r;
    }));

    const token = safeGetToken();
    const enumStatus = mapFriendlyToEnum(newStatusFriendly);
    const url = `${REQUEST_BASE}/requests/${encodeURIComponent(id)}/status?status=${encodeURIComponent(enumStatus)}&reviewedBy=${encodeURIComponent(wardenUser?.id ?? wardenUser?.email ?? 'warden')}`;

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
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: prevStatus ?? 'PENDING' } : r));
        const txt = await res.text().catch(() => null);
        // use a friendly UI alert - you can replace with your toast component
        window.alert(`Failed to update status: ${res.status} ${txt ?? ''}`);
        return;
      }

      const updated = await res.json().catch(() => null);
      if (updated && updated.id) {
        // merge server response into existing request so we don't lose locally fetched fields (like studentName)
        setRequests(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
      }
    } catch (e) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: prevStatus ?? 'PENDING' } : r));
      window.alert(`Failed to update status: ${e?.message ?? String(e)}`);
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [wardenUser]);

  // small helper for button disabled state
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
          {compositeLoading || loading ? (
              <div className="text-sm text-gray-500">Loading requests…</div>
          ) : error ? (
              <div className="text-sm text-rose-600">{error}</div>
          ) : filtered.length === 0 ? (
              <div className="text-sm text-gray-500">No requests found for the chosen filter/search.</div>
          ) : (
              <ul className="space-y-3">
                {filtered.map(r => {
                  const st = String(r.status || '').toLowerCase();
                  const isFinal = ['approved', 'rejected', 'denied'].includes(st);
                  return (
                      <li key={r.id} className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{renderValue(r.type)} — {renderValue(getStudentDisplay(r))}</p>
                          <p className="text-xs text-gray-400">{String(r.id)} • {String(r.status)}</p>
                          <p className="text-sm text-gray-700 mt-2">{formatDetails(r.details)}</p>
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
