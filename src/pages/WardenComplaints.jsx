import React, { useMemo, useState, useEffect } from 'react';
import useWardenLists from '@/hooks/useWardenLists';
import { useWardenAuth } from '@/contexts/WardenAuthContext';
import { REQUEST_BASE } from '@/config';
import { 
  Wrench, 
  Zap, 
  Wifi, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Loader2, 
  Search, 
  Clock, 
  Calendar,
  AlertCircle,
  FileText,
  User,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

const WardenComplaints = () => {
  const { requests, rooms, students, complaints, isLoading } = useWardenLists();
  const { wardenComposite, user } = useWardenAuth();

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [localComplaints, setLocalComplaints] = useState([]);
  
  // Selected complaint details modal state
  const [selectedComplaint, setSelectedComplaint] = useState(null);

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

  // Helper to determine priority dynamically based on keywords
  const getPriority = (cTitle = '', cDesc = '') => {
    const text = `${cTitle} ${cDesc}`.toLowerCase();
    if (
      text.includes('leak') || 
      text.includes('water') || 
      text.includes('fire') || 
      text.includes('short') || 
      text.includes('wire') || 
      text.includes('shock') || 
      text.includes('broken') ||
      text.includes('pipe')
    ) {
      return 'High';
    }
    if (
      text.includes('wifi') || 
      text.includes('internet') || 
      text.includes('light') || 
      text.includes('fan') || 
      text.includes('ceiling') || 
      text.includes('power') ||
      text.includes('switch')
    ) {
      return 'Medium';
    }
    return 'Low';
  };

  // Helper to get corresponding Lucide icon and category info
  const getTagsAndIcon = (cTitle = '', cDesc = '') => {
    const text = `${cTitle} ${cDesc}`.toLowerCase();
    
    if (text.includes('leak') || text.includes('water') || text.includes('pipe') || text.includes('plumbing') || text.includes('shower') || text.includes('drain')) {
      return {
        icon: <Wrench className="w-5 h-5" />,
        category: 'Maintenance',
        colorClass: 'text-purple-600 bg-purple-50 border-purple-100 dark:bg-purple-950/30 dark:border-purple-900/30 dark:text-purple-400',
      };
    }
    
    if (text.includes('light') || text.includes('fan') || text.includes('power') || text.includes('switch') || text.includes('electricity') || text.includes('shock') || text.includes('ac') || text.includes('wire')) {
      return {
        icon: <Zap className="w-5 h-5" />,
        category: 'Facilities',
        colorClass: 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/30 dark:text-amber-400',
      };
    }
    
    if (text.includes('wifi') || text.includes('internet') || text.includes('signal') || text.includes('network') || text.includes('router') || text.includes('connectivity')) {
      return {
        icon: <Wifi className="w-5 h-5" />,
        category: 'Facilities',
        colorClass: 'text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/30 dark:text-blue-400',
      };
    }

    if (text.includes('mess') || text.includes('food') || text.includes('dinner') || text.includes('lunch') || text.includes('breakfast') || text.includes('meal') || text.includes('quality') || text.includes('kitchen')) {
      return {
        icon: <Flame className="w-5 h-5" />,
        category: 'Mess',
        colorClass: 'text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/30 dark:text-emerald-400',
      };
    }
    
    return {
      icon: <AlertTriangle className="w-5 h-5" />,
      category: 'General',
      colorClass: 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/30 dark:text-rose-400',
    };
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (localComplaints || []).filter(c => {
      const statusNorm = normalizeStatus(c.status);
      
      // Status tabs filter logic
      if (statusFilter === 'open' && statusNorm !== 'open') return false;
      if (statusFilter === 'under_review' && statusNorm !== 'in progress' && statusNorm !== 'under review') return false;
      if (statusFilter === 'resolved' && statusNorm !== 'resolved') return false;
      
      if (!q) return true;
      return (
        String(c.title || '') + ' ' + 
        String(c.id || '') + ' ' + 
        String(c.description || c.details || '') + ' ' + 
        String(c.studentEmail || c.studentId || '')
      ).toLowerCase().includes(q);
    });
  }, [localComplaints, query, statusFilter]);

  // Patch status implementation (optimistic update with fallback)
  const patchStatus = async (id, statusStr) => {
    const prev = localComplaints;
    // Optimistic local state update
    setLocalComplaints(prevList => prevList.map(c => c.id === id ? { ...c, status: statusStr } : c));
    
    // Also update selected modal complaint locally if open
    if (selectedComplaint && selectedComplaint.id === id) {
      setSelectedComplaint(prevSel => ({ ...prevSel, status: statusStr }));
    }

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
      
      // Merge verified backend payload into local list
      setLocalComplaints(prevList => prevList.map(c => c.id === id ? (updated || { ...c, status: statusStr }) : c));
      toast.success(`Complaint marked as ${getDisplayStatus(statusStr).toLowerCase()} successfully!`);
    } catch (e) {
      // Revert on failure
      toast.error('Failed to update complaint status: ' + (e.message || e));
      setLocalComplaints(prev);
      if (selectedComplaint && selectedComplaint.id === id) {
        setSelectedComplaint(prev.find(c => c.id === id));
      }
    }
  };

  const markResolved = (id) => patchStatus(id, 'RESOLVED');
  const markInProgress = (id) => patchStatus(id, 'IN_PROGRESS');

  // Stats Calculations
  const stats = useMemo(() => {
    const list = localComplaints || [];
    const total = list.length;
    const open = list.filter(c => normalizeStatus(c.status) === 'open').length;
    const inProgress = list.filter(c => ['in progress', 'under review'].includes(normalizeStatus(c.status))).length;
    const resolved = list.filter(c => normalizeStatus(c.status) === 'resolved').length;
    return { total, open, inProgress, resolved };
  }, [localComplaints]);

  const hostelName = wardenComposite?.hostel?.name ? `Hostel ${wardenComposite.hostel.name}` : 'My Hostel';

  return (
    <div className="max-w-[1200px] mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Header section */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-outline-variant/30">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Complaints Command Center</h1>
          <p className="font-body-md text-on-surface-variant text-sm mt-1">
            Review residency issues for <span className="font-semibold text-portal-primary">{hostelName}</span>, initiate investigations, and resolve complaints.
          </p>
        </div>
      </header>

      {/* Bento metrics summary cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Filed */}
        <div className="security-shadow glass-effect rounded-xl p-5 bg-surface-container-lowest border-l-4 border-l-slate-400 border border-outline-variant/70">
          <p className="text-xs font-label-md uppercase tracking-wider text-on-surface-variant">Total Complaints</p>
          <p className="text-3xl font-headline-lg text-on-surface mt-2">{stats.total}</p>
        </div>

        {/* Open */}
        <div className="security-shadow glass-effect rounded-xl p-5 bg-surface-container-lowest border-l-4 border-l-indigo-500 border border-outline-variant/70">
          <p className="text-xs font-label-md uppercase tracking-wider text-indigo-600/90 dark:text-indigo-400">Open & New</p>
          <p className="text-3xl font-headline-lg text-on-surface mt-2">{stats.open}</p>
        </div>

        {/* In Progress */}
        <div className="security-shadow glass-effect rounded-xl p-5 bg-surface-container-lowest border-l-4 border-l-amber-500 border border-outline-variant/70">
          <p className="text-xs font-label-md uppercase tracking-wider text-amber-600/90 dark:text-amber-400">Under Review</p>
          <p className="text-3xl font-headline-lg text-on-surface mt-2">{stats.inProgress}</p>
        </div>

        {/* Resolved */}
        <div className="security-shadow glass-effect rounded-xl p-5 bg-surface-container-lowest border-l-4 border-l-emerald-500 border border-outline-variant/70">
          <p className="text-xs font-label-md uppercase tracking-wider text-emerald-600/90 dark:text-emerald-400">Resolved Items</p>
          <p className="text-3xl font-headline-lg text-on-surface mt-2">{stats.resolved}</p>
        </div>
      </section>

      {/* Filters and search docks */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Horizontal Filtering Tabs */}
        <div className="flex bg-surface-container-high/60 p-1.5 rounded-xl border border-outline-variant/40 self-start md:self-auto overflow-x-auto max-w-full">
          <button 
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-label-md transition-all whitespace-nowrap ${
              statusFilter === 'all' 
                ? 'bg-surface shadow-sm text-portal-primary font-semibold' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            All Complaints
          </button>
          <button 
            onClick={() => setStatusFilter('open')}
            className={`px-4 py-1.5 rounded-lg text-xs font-label-md transition-all whitespace-nowrap ${
              statusFilter === 'open' 
                ? 'bg-indigo-50 dark:bg-indigo-950/40 shadow-sm text-indigo-700 dark:text-indigo-400 font-semibold' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Open & New ({stats.open})
          </button>
          <button 
            onClick={() => setStatusFilter('under_review')}
            className={`px-4 py-1.5 rounded-lg text-xs font-label-md transition-all whitespace-nowrap ${
              statusFilter === 'under_review' 
                ? 'bg-amber-50 dark:bg-amber-950/40 shadow-sm text-amber-700 dark:text-amber-400 font-semibold' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Under Review ({stats.inProgress})
          </button>
          <button 
            onClick={() => setStatusFilter('resolved')}
            className={`px-4 py-1.5 rounded-lg text-xs font-label-md transition-all whitespace-nowrap ${
              statusFilter === 'resolved' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 shadow-sm text-emerald-700 dark:text-emerald-400 font-semibold' 
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Resolved ({stats.resolved})
          </button>
        </div>

        {/* Live Search input */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/70" />
          <input 
            type="text" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by title, student email, details..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-portal-primary/60 transition-all text-on-surface"
          />
        </div>
      </div>

      {/* Complaints Feed List */}
      <div className="bg-surface-container-lowest security-shadow glass-effect rounded-2xl p-6 border border-outline-variant">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-on-surface-variant">
            <Loader2 className="w-8 h-8 animate-spin text-portal-primary" />
            <p className="text-sm font-label-md">Loading complaints from registry...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant/80 mb-4 border border-outline-variant/30">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">No complaints match</h3>
            <p className="text-sm text-on-surface-variant mt-2">
              We couldn't find any complaints matching your active filter criteria. Try clearing search filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map(c => {
              const { icon, category, colorClass } = getTagsAndIcon(c.title, c.description || c.details);
              const priority = getPriority(c.title, c.description || c.details);
              const isResolved = normalizeStatus(c.status) === 'resolved';
              const isInProgress = ['in progress', 'under review'].includes(normalizeStatus(c.status));
              
              return (
                <article 
                  key={c.id} 
                  onClick={() => setSelectedComplaint(c)}
                  className="security-shadow glass-effect rounded-xl border border-outline-variant bg-surface p-5 hover:border-portal-primary/40 card-shadow-hover transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Card Top Category & Priority tags */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-lg border ${colorClass}`}>
                          {icon}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-on-surface/90 uppercase tracking-wider block">{category}</span>
                          <span className="text-[10px] text-on-surface-variant tracking-normal block mt-0.5">#{String(c.id).slice(0, 5).toUpperCase()}</span>
                        </div>
                      </div>

                      {/* Priority Tag indicator */}
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${
                        priority === 'High' 
                          ? 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30' 
                          : priority === 'Medium'
                            ? 'text-amber-600 bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30'
                            : 'text-slate-600 bg-slate-50 border-slate-100 dark:bg-slate-900/40 dark:border-slate-800/40'
                      }`}>
                        {priority} Priority
                      </span>
                    </div>

                    {/* Complaint Main Core info */}
                    <h3 className="font-headline-sm text-base text-on-surface font-semibold line-clamp-1 mb-1">{c.title || c.subject || 'Untitled'}</h3>
                    
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-3">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(c.createdAt || c.date || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span>•</span>
                      <span className={`font-semibold ${
                        isResolved ? 'text-emerald-600' : isInProgress ? 'text-amber-600' : 'text-indigo-600'
                      }`}>
                        {getDisplayStatus(c.status)}
                      </span>
                    </div>

                    <p className="text-sm text-on-surface-variant font-body-md line-clamp-3 leading-relaxed mb-4">
                      {c.description || c.details || 'No details provided.'}
                    </p>

                    {/* Attachements mini row preview */}
                    {c.attachments && c.attachments.length > 0 && (
                      <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
                        <FileText className="w-3.5 h-3.5 text-on-surface-variant/80 shrink-0" />
                        <span className="text-xs text-on-surface-variant font-semibold mr-1">{c.attachments.length} attachments:</span>
                        {c.attachments.slice(0, 3).map((url, idx) => (
                          <div key={idx} className="w-6 h-6 rounded border border-outline-variant/60 bg-surface-container-high overflow-hidden shrink-0 flex items-center justify-center">
                            <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                          </div>
                        ))}
                        {c.attachments.length > 3 && (
                          <span className="text-[10px] text-on-surface-variant font-semibold bg-surface-container-high border rounded px-1 shrink-0">
                            +{c.attachments.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions buttons footer */}
                  <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4 mt-auto gap-2" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {/* Mark in progress action */}
                      {!isInProgress && !isResolved && (
                        <button 
                          onClick={() => markInProgress(c.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-md shadow-amber-500/10 active:scale-[0.98] transition-all"
                        >
                          Investigate
                        </button>
                      )}

                      {/* Mark resolved action */}
                      {!isResolved && (
                        <button 
                          onClick={() => markResolved(c.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all"
                        >
                          Resolve
                        </button>
                      )}
                    </div>

                    <button 
                      onClick={() => setSelectedComplaint(c)}
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
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-xl w-full security-shadow overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/30 bg-surface-container-high/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg border text-portal-primary bg-primary-fixed">
                  {getTagsAndIcon(selectedComplaint.title, selectedComplaint.description || selectedComplaint.details).icon}
                </div>
                <div>
                  <h3 className="font-headline-sm text-base text-on-surface font-semibold">Complaint Inspection</h3>
                  <p className="text-xs text-on-surface-variant">Ticket ID: #{String(selectedComplaint.id).toUpperCase()}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="p-1.5 rounded-full hover:bg-surface-variant/20 text-on-surface-variant transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Scroll Box */}
            <div className="p-6 overflow-y-auto space-y-6 text-on-surface">
              
              {/* Primary Info row */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-high/20 border border-outline-variant/20 p-4 rounded-xl">
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Priority</span>
                  <span className={`text-xs font-semibold ${
                    getPriority(selectedComplaint.title, selectedComplaint.description || selectedComplaint.details) === 'High' ? 'text-rose-600' : 'text-amber-600'
                  }`}>
                    {getPriority(selectedComplaint.title, selectedComplaint.description || selectedComplaint.details)} Severity
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Current Status</span>
                  <span className={`text-xs font-semibold ${
                    normalizeStatus(selectedComplaint.status) === 'resolved' 
                      ? 'text-emerald-600' 
                      : ['in progress', 'under review'].includes(normalizeStatus(selectedComplaint.status)) 
                        ? 'text-amber-600' 
                        : 'text-indigo-600'
                  }`}>
                    {getDisplayStatus(selectedComplaint.status)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Created On</span>
                  <span className="text-xs font-semibold">
                    {new Date(selectedComplaint.createdAt || selectedComplaint.date || Date.now()).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              {/* Student Metadata Card */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Complainant Info
                </h4>
                <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-sm text-on-surface">{selectedComplaint.studentEmail || 'Unknown'}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">UID / Member ID: {selectedComplaint.studentId || '—'}</p>
                  </div>
                  {selectedComplaint.roomNumber && (
                    <div className="text-right">
                      <p className="text-xs font-bold text-portal-primary">Room {selectedComplaint.roomNumber}</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">Resident</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Complaint Details</h4>
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/40">
                  <h3 className="font-semibold text-on-surface mb-2">{selectedComplaint.title || selectedComplaint.subject || 'Untitled Issue'}</h3>
                  <p className="text-sm font-body-md leading-relaxed text-on-surface-variant whitespace-pre-wrap">
                    {selectedComplaint.description || selectedComplaint.details || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Attachments Section */}
              {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Image Attachments ({selectedComplaint.attachments.length})</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedComplaint.attachments.map((url, idx) => (
                      <a 
                        key={idx} 
                        href={url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="group relative h-32 rounded-xl border border-outline-variant/60 overflow-hidden bg-surface-container-high flex items-center justify-center shadow-sm hover:border-portal-primary/40 transition-all"
                      >
                        <img src={url} alt="Attachment" className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-white/95 text-on-surface text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1 shadow">
                            <ExternalLink className="w-3.5 h-3.5" />
                            Expand View
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-outline-variant/30 bg-surface-container-high/40">
              <button 
                onClick={() => setSelectedComplaint(null)}
                className="px-5 py-2.5 rounded-lg border border-outline-variant text-sm font-semibold text-on-surface-variant hover:bg-surface-variant/20 active:scale-[0.98] transition-all"
              >
                Close View
              </button>
              
              {/* Modal active change states */}
              {normalizeStatus(selectedComplaint.status) !== 'resolved' && (
                <>
                  {normalizeStatus(selectedComplaint.status) !== 'in progress' && (
                    <button 
                      onClick={() => markInProgress(selectedComplaint.id)}
                      className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white shadow-md active:scale-[0.98] transition-all"
                    >
                      Investigate
                    </button>
                  )}
                  <button 
                    onClick={() => markResolved(selectedComplaint.id)}
                    className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md active:scale-[0.98] transition-all"
                  >
                    Mark Resolved
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

export default WardenComplaints;
