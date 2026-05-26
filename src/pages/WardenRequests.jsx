import React, { useMemo, useState, useEffect, useCallback } from 'react';
import useWardenLists from '@/hooks/useWardenLists';
import { REQUEST_BASE, STUDENT_BASE, HOSTEL_BASE } from '@/config';
import { useWardenAuth } from '@/contexts/WardenAuthContext';
import { 
  FileText, 
  Search, 
  X, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRightLeft, 
  Plane, 
  Wrench,
  AlertCircle,
  Calendar,
  User,
  Building,
  Info,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

const safeGetToken = () => {
  try { return localStorage.getItem('authToken'); } catch (e) { return null; }
};

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
  
  // Selected request details modal state
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    if (!Array.isArray(requests)) return;

    const enriched = requests.map(r => {
      const sid = extractStudentId(r);
      let studentName = r.studentName || (r.student && typeof r.student === 'object' ? (r.student.name || r.student.fullName || r.student.studentName) : null);
      if (!studentName && sid) {
        const found = (Array.isArray(students) ? students : []).find(s => String(s.id) === String(sid));
        if (found) studentName = found.name || found.fullName || found.studentName;
        else if (studentCache[String(sid)]) studentName = studentCache[String(sid)];
      }

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

    const missingStudentIds = Array.from(new Set(enriched.map(e => extractStudentId(e)).filter(Boolean))).filter(id => !enriched.find(e => String(extractStudentId(e)) === String(id) && e.studentName) && !studentCache[id]);
    const missingHostelIds = Array.from(new Set(enriched.map(e => extractHostelId(e)).filter(Boolean))).filter(id => !enriched.find(e => String(extractHostelId(e)) === String(id) && e.hostelName) && !hostelCache[id]);

    if (missingStudentIds.length > 0) {
      missingStudentIds.forEach(id => fetchAndCacheStudentName(id));
    }
    if (missingHostelIds.length > 0) {
      missingHostelIds.forEach(id => fetchAndCacheHostelName(id));
    }

  }, [requests, students, wardenComposite]);

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
      const hay = (String(r.id) + ' ' + studentText + ' ' + String(r.status || '') + ' ' + String(r.type || '')).toLowerCase();
      return hay.includes(q);
    });
  }, [localRequests, query, statusFilter]);

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

    if (selectedRequest && selectedRequest.id === id) {
      setSelectedRequest(prevSel => ({ ...prevSel, status: newStatusFriendly }));
    }

    const token = safeGetToken();
    const enumStatus = mapFriendlyToEnum(newStatusFriendly);
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
        setLocalRequests(prev => prev.map(r => r.id === id ? { ...r, status: prevStatus ?? 'PENDING' } : r));
        if (selectedRequest && selectedRequest.id === id) {
          setSelectedRequest(prev => prev.find(r => r.id === id));
        }
        const txt = await res.text().catch(() => null);
        toast.error(`Failed to update status: ${res.status} ${txt ?? ''}`);
        return;
      }

      const updated = await res.json().catch(() => null);
      if (updated && updated.id) {
        setLocalRequests(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
        if (selectedRequest && selectedRequest.id === id) {
          setSelectedRequest(prevSel => ({ ...prevSel, ...updated }));
        }
      }
      toast.success(`Request ${newStatusFriendly.toLowerCase()} successfully!`);
    } catch (e) {
      setLocalRequests(prev => prev.map(r => r.id === id ? { ...r, status: prevStatus ?? 'PENDING' } : r));
      if (selectedRequest && selectedRequest.id === id) {
        setSelectedRequest(prev => prev.find(r => r.id === id));
      }
      toast.error(`Failed to update status: ${e?.message ?? String(e)}`);
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [selectedRequest]);

  const isUpdating = useCallback((id) => updatingIds.has(id), [updatingIds]);

  // Request Icons Mapping
  const getRequestIconAndColor = (type = '') => {
    const text = String(type).toLowerCase();
    if (text.includes('leave') || text.includes('gate') || text.includes('out')) {
      return {
        icon: <Plane className="w-5 h-5" />,
        colorClass: 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/30 dark:text-amber-400',
        label: 'Residency Leave'
      };
    }
    if (text.includes('transfer') || text.includes('swap') || text.includes('room') || text.includes('change')) {
      return {
        icon: <ArrowRightLeft className="w-5 h-5" />,
        colorClass: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/30 dark:text-blue-400',
        label: 'Room Transfer'
      };
    }
    return {
      icon: <Wrench className="w-5 h-5" />,
      colorClass: 'text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-950/30 dark:border-purple-900/30 dark:text-purple-400',
      label: 'Maintenance / Other'
    };
  };

  // Stats
  const stats = useMemo(() => {
    const list = localRequests || [];
    const total = list.length;
    const pending = list.filter(r => String(r.status || '').toLowerCase() === 'pending').length;
    const approved = list.filter(r => String(r.status || '').toLowerCase() === 'approved').length;
    const rejected = list.filter(r => ['rejected', 'denied'].includes(String(r.status || '').toLowerCase())).length;
    return { total, pending, approved, rejected };
  }, [localRequests]);

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Header section */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-outline-variant/30">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Requests Command Desk</h1>
          <p className="font-body-md text-on-surface-variant text-sm mt-1">
            Review student room transfer requests, hostel leaves, and out-of-residency requests.
          </p>
        </div>
      </header>

      {/* Bento summary stats grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Filed */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 shadow-sm transition-all">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Total Requests</p>
          <p className="text-3xl font-bold text-on-surface mt-3">{stats.total}</p>
        </div>

        {/* Pending */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 shadow-sm transition-all">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-500">Pending Review</p>
          <p className="text-3xl font-bold text-on-surface mt-3">{stats.pending}</p>
        </div>

        {/* Approved */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 shadow-sm transition-all">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">Approved Requests</p>
          <p className="text-3xl font-bold text-on-surface mt-3">{stats.approved}</p>
        </div>

        {/* Denied */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 shadow-sm transition-all">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-500">Denied Requests</p>
          <p className="text-3xl font-bold text-on-surface mt-3">{stats.rejected}</p>
        </div>
      </section>

      {/* Filters and search docks */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Horizontal tabs filter */}
        <div className="flex bg-surface-container-high/60 p-1.5 rounded-xl border border-outline-variant/40 overflow-x-auto max-w-full">
          <button 
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-label-md transition-all whitespace-nowrap ${
              statusFilter === 'all' 
                ? 'bg-surface shadow-sm text-portal-primary font-semibold' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All Requests
          </button>
          <button 
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-1.5 rounded-lg text-xs font-label-md transition-all whitespace-nowrap ${
              statusFilter === 'pending' 
                ? 'bg-amber-50 dark:bg-amber-950/40 shadow-sm text-amber-750 dark:text-amber-400 font-semibold' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button 
            onClick={() => setStatusFilter('approved')}
            className={`px-4 py-1.5 rounded-lg text-xs font-label-md transition-all whitespace-nowrap ${
              statusFilter === 'approved' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 shadow-sm text-emerald-750 dark:text-emerald-400 font-semibold' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Approved ({stats.approved})
          </button>
          <button 
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-1.5 rounded-lg text-xs font-label-md transition-all whitespace-nowrap ${
              statusFilter === 'rejected' 
                ? 'bg-rose-50 dark:bg-rose-950/40 shadow-sm text-rose-755 dark:text-rose-400 font-semibold' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Denied ({stats.rejected})
          </button>
        </div>

        {/* Live Search input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/70" />
          <input 
            type="text" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by student name, ID or type..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-portal-primary/60 transition-all text-on-surface"
          />
        </div>
      </div>

      {/* Requests Feed list card */}
      <div className="bg-surface-container-lowest security-shadow glass-effect rounded-2xl p-6 border border-outline-variant">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-on-surface-variant">
            <Loader2 className="w-8 h-8 animate-spin text-portal-primary" />
            <p className="text-sm font-label-md">Loading requests from registry...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant/80 mb-4 border border-outline-variant/30">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">No requests found</h3>
            <p className="text-sm text-on-surface-variant mt-2">
              We couldn't find any request tickets matching your search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(r => {
              const { icon, colorClass, label } = getRequestIconAndColor(r.type);
              const st = String(r.status || '').toLowerCase();
              const isFinal = ['approved', 'rejected', 'denied'].includes(st);
              const isApproved = st === 'approved';
              const isRejected = ['rejected', 'denied'].includes(st);
              const sid = extractStudentId(r);
              const studentDisplay = r.studentName || getStudentNameSync(sid);

              return (
                <article 
                  key={r.id} 
                  onClick={() => setSelectedRequest(r)}
                  className="security-shadow glass-effect rounded-xl border border-outline-variant bg-surface p-5 hover:border-portal-primary/40 card-shadow-hover transition-all duration-300 flex flex-col justify-between cursor-pointer animate-in slide-in-from-bottom-2"
                >
                  <div>
                    {/* Header: Request Type Icon and ID */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg border ${colorClass}`}>
                          {icon}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-on-surface/90 uppercase tracking-wider block">{label}</span>
                          <span className="text-[10px] text-on-surface-variant tracking-normal block mt-0.5">#{String(r.id).slice(0, 5).toUpperCase()}</span>
                        </div>
                      </div>

                      {/* Status Badges */}
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                        isApproved 
                          ? 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30' 
                          : isRejected 
                            ? 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30' 
                            : 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30'
                      }`}>
                        {String(r.status).toUpperCase()}
                      </span>
                    </div>

                    {/* Complainant Student Info */}
                    <div className="flex items-center gap-2 mb-3 bg-surface-container-high/40 border border-outline-variant/10 p-3 rounded-lg">
                      <div className="w-8 h-8 rounded-full bg-portal-primary/10 border border-portal-primary/20 flex items-center justify-center text-portal-primary">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-on-surface line-clamp-1">{studentDisplay}</p>
                        <p className="text-[10px] text-on-surface-variant">UID: {sid || '—'}</p>
                      </div>
                    </div>

                    {/* Request details context snippet */}
                    <div className="space-y-1 mb-4">
                      <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Details</p>
                      <p className="text-sm text-on-surface font-body-md line-clamp-2 leading-relaxed bg-surface-container-low p-2.5 rounded border border-outline-variant/30">
                        {formatDetails(r.details || r.reason || r.body)}
                      </p>
                    </div>
                  </div>

                  {/* Actions buttons footer */}
                  <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4 mt-auto gap-2" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {!isFinal && (
                        <>
                          <button 
                            disabled={isUpdating(r.id)}
                            onClick={() => updateStatus(r.id, 'Approved')}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
                          >
                            {isUpdating(r.id) ? 'Approve...' : 'Approve'}
                          </button>
                          <button 
                            disabled={isUpdating(r.id)}
                            onClick={() => updateStatus(r.id, 'Denied')}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-md active:scale-[0.98] transition-all disabled:opacity-60"
                          >
                            {isUpdating(r.id) ? 'Deny...' : 'Deny'}
                          </button>
                        </>
                      )}
                    </div>

                    <button 
                      onClick={() => setSelectedRequest(r)}
                      className="px-3 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-variant/10 text-xs font-semibold text-on-surface-variant transition-all flex items-center gap-1 active:scale-[0.98]"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant/70" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Details drawer/popover modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-lg w-full security-shadow overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/30 bg-surface-container-high/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg border text-portal-primary bg-primary-fixed">
                  {getRequestIconAndColor(selectedRequest.type).icon}
                </div>
                <div>
                  <h3 className="font-headline-sm text-base text-on-surface font-semibold">Request Inspection</h3>
                  <p className="text-xs text-on-surface-variant">Ticket ID: #{String(selectedRequest.id).toUpperCase()}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                className="p-1.5 rounded-full hover:bg-surface-variant/20 text-on-surface-variant transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content box */}
            <div className="p-6 overflow-y-auto space-y-6 text-on-surface">
              
              {/* Type & Status metadata card */}
              <div className="grid grid-cols-2 gap-4 bg-surface-container-high/20 border border-outline-variant/20 p-4 rounded-xl">
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Request Type</span>
                  <span className="text-sm font-semibold text-on-surface">{renderValue(selectedRequest.type)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Current Status</span>
                  <span className={`text-sm font-semibold uppercase ${
                    String(selectedRequest.status).toLowerCase() === 'approved' 
                      ? 'text-emerald-600' 
                      : ['rejected', 'denied'].includes(String(selectedRequest.status).toLowerCase()) 
                        ? 'text-rose-600' 
                        : 'text-amber-600'
                  }`}>
                    {String(selectedRequest.status)}
                  </span>
                </div>
              </div>

              {/* Complainant student metadata card */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Requesting Student
                </h4>
                <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low flex flex-col gap-1">
                  <p className="font-semibold text-sm text-on-surface">
                    {selectedRequest.studentName || getStudentNameSync(extractStudentId(selectedRequest))}
                  </p>
                  <p className="text-xs text-on-surface-variant">UID: {extractStudentId(selectedRequest) || '—'}</p>
                  {selectedRequest.hostelName && (
                    <p className="text-xs text-portal-primary font-semibold mt-1 flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-portal-primary" />
                      {selectedRequest.hostelName}
                    </p>
                  )}
                </div>
              </div>

              {/* Request Details Reason */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  Parameters / Reason
                </h4>
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40">
                  <p className="text-sm font-body-md leading-relaxed text-on-surface-variant whitespace-pre-wrap">
                    {formatDetails(selectedRequest.details || selectedRequest.reason || selectedRequest.body)}
                  </p>
                </div>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-outline-variant/30 bg-surface-container-high/40">
              <button 
                onClick={() => setSelectedRequest(null)}
                className="px-5 py-2.5 rounded-lg border border-outline-variant text-sm font-semibold text-on-surface-variant hover:bg-surface-variant/20 active:scale-[0.98] transition-all"
              >
                Close View
              </button>

              {!['approved', 'rejected', 'denied'].includes(String(selectedRequest.status).toLowerCase()) && (
                <>
                  <button 
                    disabled={isUpdating(selectedRequest.id)}
                    onClick={() => updateStatus(selectedRequest.id, 'Denied')}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-md active:scale-[0.98] transition-all"
                  >
                    Deny
                  </button>
                  <button 
                    disabled={isUpdating(selectedRequest.id)}
                    onClick={() => updateStatus(selectedRequest.id, 'Approved')}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-[0.98] transition-all"
                  >
                    Approve
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default WardenRequests;
