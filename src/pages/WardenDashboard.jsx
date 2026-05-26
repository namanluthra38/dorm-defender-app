// src/pages/WardenDashboard.jsx
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useWardenComposite from '@/hooks/useWardenComposite';
import useWardenLists from '@/hooks/useWardenLists';
import { 
  Building, 
  Users, 
  MessageSquare, 
  Grid, 
  LogOut, 
  ArrowLeftRight, 
  Wrench, 
  Zap, 
  AlertTriangle,
  Plus,
  ShieldCheck,
  Info,
  CheckCircle2,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function WardenDashboard() {
  const navigate = useNavigate();
  const { data: composite, isLoading, error, refetch } = useWardenComposite();
  const { requests, rooms, students, isLoading: listsLoading, isError: listsError, refetchAll } = useWardenLists();

  const loading = isLoading || listsLoading;

  // Enrich pending requests with actual student names and details from useWardenLists()
  const pendingRequests = useMemo(() => {
    if (!Array.isArray(requests) || !Array.isArray(students)) return [];

    // Filter only pending requests
    const pending = requests.filter(r => String(r.status || '').toLowerCase() === 'pending');

    return pending.map(r => {
      // Find student ID
      let sid = r.studentId;
      if (!sid && r.student && typeof r.student === 'object') {
        sid = r.student.id;
      } else if (!sid) {
        sid = r.student;
      }

      const studentObj = students.find(s => String(s.id) === String(sid));
      const studentName = r.studentName || studentObj?.name || studentObj?.fullName || `Student #${String(sid || 'ID').slice(-4)}`;

      // Resolve room number
      const roomNum = studentObj?.roomNumber ?? roomObj?.roomNumber ?? 'A-1';

      // Format details
      let detailsText = '';
      if (String(r.type || '').toUpperCase() === 'HOSTEL_LEAVE') {
        detailsText = `Leave Request • Sigma Hall ${roomNum}`;
      } else if (String(r.type || '').toUpperCase() === 'ROOM_CHANGE') {
        detailsText = `Room Change • Omega Wing ${roomNum}`;
      } else {
        detailsText = `${r.type ? r.type.replace('_', ' ') : 'Request'} • Room ${roomNum}`;
      }

      return {
        ...r,
        studentName,
        detailsText
      };
    });
  }, [requests, students]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="w-10 h-10 text-portal-primary animate-spin" />
        <p className="text-on-surface-variant font-medium">Loading warden command center...</p>
      </div>
    );
  }

  if (error || listsError) {
    return (
      <div className="bg-red-50 border border-red-200 text-portal-error p-6 rounded-2xl max-w-xl mx-auto my-10 flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 shrink-0" />
        <div>
          <h3 className="font-bold text-lg mb-1">Failed to load dashboard</h3>
          <p className="text-sm opacity-90">An unexpected connection error occurred. Please refresh or try again.</p>
        </div>
      </div>
    );
  }

  const warden = composite?.warden ?? {};
  const hostels = composite?.hostels ?? [];

  // Count items safely
  const studentsCount = Array.isArray(students) ? students.length : (composite?.studentsTotal ?? warden?.studentsTotal ?? 0);
  const roomsCount = Array.isArray(rooms) ? rooms.length : 0;
  const openRequests = Array.isArray(requests) ? requests.filter(r => String(r.status || '').toLowerCase() === 'pending').length : (composite?.openRequests ?? 0);
  const latestAnnouncement = composite?.latestAnnouncement ?? (composite?.announcements?.[0]?.title ?? 'No announcements');

  const summary = {
    hostelsManaged: hostels.length,
    studentsTotal: studentsCount,
    openRequests,
    roomsTotal: roomsCount,
    announcementTitle: latestAnnouncement,
  };

  const hostelName = composite?.hostel?.name ?? 'Sigma Hall';

  // Format pending requests list
  const recentRequests = pendingRequests.slice(0, 3);

  // Dynamic helper to choose icons for requests
  const getRequestIcon = (type = '') => {
    const t = type.toUpperCase();
    if (t === 'HOSTEL_LEAVE') return <LogOut className="w-5 h-5" />;
    if (t === 'ROOM_CHANGE') return <ArrowLeftRight className="w-5 h-5" />;
    return <Wrench className="w-5 h-5" />;
  };

  // Helper to dynamically color icon background
  const getRequestIconClass = (type = '') => {
    const t = type.toUpperCase();
    if (t === 'HOSTEL_LEAVE') return 'bg-primary/10 text-portal-primary';
    if (t === 'ROOM_CHANGE') return 'bg-portal-secondary/10 text-portal-secondary';
    return 'bg-portal-error/10 text-portal-error';
  };


  const recentAlerts = [
    { id: 1, type: 'info', text: 'Night patrol logs pending upload.' },
    { id: 2, type: 'check', text: 'Monthly safety audit passed.' }
  ];

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-on-surface font-headline-lg">Warden Overview</h2>
        <p className="text-base text-on-surface-variant mt-1 font-body-lg">Hostel administration and resident oversight.</p>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Stat 1: Primary Hostel */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 shadow-sm transition-all">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">Hostel</p>
          <p className="text-2xl font-bold text-on-surface mt-3 font-headline-md">{hostelName}</p>
        </div>

        {/* Stat 2: Total Students */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 shadow-sm transition-all">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-500">Total Students</p>
          <p className="text-2xl font-bold text-on-surface mt-3 font-headline-md">{summary.studentsTotal.toLocaleString()}</p>
        </div>

        {/* Stat 3: Open Requests */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 shadow-sm transition-all">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-500">Open Requests</p>
          <p className="text-2xl font-bold text-on-surface mt-3 font-headline-md">{summary.openRequests}</p>
        </div>

        {/* Stat 4: Total Rooms */}
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 shadow-sm transition-all">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">Total Rooms</p>
          <p className="text-2xl font-bold text-on-surface mt-3 font-headline-md">{summary.roomsTotal} Units</p>
        </div>
      </div>

      {/* Asymmetric Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pending Requests (Replaces Managed Hostels in Mock) */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-6 xl:p-8 rounded-2xl card-shadow border border-outline-variant/10 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-on-surface font-headline-sm">Pending Requests</h3>
              <a 
                href="/warden/requests" 
                className="text-portal-primary font-semibold text-sm hover:underline flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="space-y-4">
              {recentRequests.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant font-medium">
                  <MessageSquare className="w-12 h-12 mx-auto opacity-20 mb-3" />
                  <p>You have no pending requests to review.</p>
                </div>
              ) : (
                recentRequests.map((r, idx) => (
                  <div 
                    key={r.id || r._id || idx} 
                    className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30 hover:border-portal-primary/30 transition-all card-shadow-hover"
                  >
                    <div className={`p-3 rounded-xl shrink-0 ${getRequestIconClass(r.type)}`}>
                      {getRequestIcon(r.type)}
                    </div>
                    <div className="flex-1 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 min-w-0">
                      <div>
                        <p className="font-semibold text-base text-on-surface truncate font-title-lg">{r.studentName}</p>
                        <p className="text-sm text-on-surface-variant mt-1 font-body-md truncate">{r.detailsText}</p>
                      </div>
                      <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                        <span className="px-3 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-xs font-semibold font-label-sm">
                          Pending
                        </span>
                        <button 
                          onClick={() => navigate('/warden/requests')}
                          className="px-4 py-1.5 bg-portal-primary text-white rounded-xl text-xs font-bold shadow-sm hover:opacity-95 active:scale-95 transition-transform"
                        >
                          Action
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button 
            onClick={() => navigate('/warden/requests')}
            className="w-full mt-6 py-3 border border-outline-variant text-portal-primary font-bold text-base rounded-xl hover:bg-surface-container-low active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Go to Requests Center
          </button>
        </div>

        {/* Right Side Cards Column */}
        <div className="space-y-6">
          {/* Recent Announcements Card */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl card-shadow border border-outline-variant/20">
            <div className="flex justify-between items-center mb-4 border-b border-outline-variant/10 pb-2">
              <h3 className="text-lg font-bold text-on-surface font-title-lg">Recent Announcements</h3>
              <button 
                onClick={() => navigate('/warden/announcements')}
                className="text-portal-primary hover:bg-surface-container-low rounded-full p-1.5 transition-all"
                title="New Announcement"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-outline-variant/30 pl-2">
              {(composite?.announcements ?? []).length === 0 ? (
                <div className="text-sm text-on-surface-variant font-medium py-2 relative pl-4">
                  No announcements found.
                </div>
              ) : (
                (composite.announcements ?? []).slice(0, 2).map((ann, idx) => (
                  <div key={ann.id || idx} className="relative pl-6">
                    <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full ring-4 ring-surface-container-lowest ${idx === 0 ? 'bg-primary-container' : 'bg-outline-variant'}`}></div>
                    <p className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase font-label-md">
                      {ann.date ?? 'Oct 24, 2023'}
                    </p>
                    <p className="font-bold text-sm text-on-surface mt-1 font-body-md leading-snug line-clamp-2">{ann.title}</p>
                  </div>
                ))
              )}
            </div>
            
            <button 
              onClick={() => navigate('/warden/announcements')}
              className="w-full mt-6 py-2 border border-outline-variant rounded-xl text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
            >
              View All Notices
            </button>
          </div>

          {/* Facility Status Card */}
          <div className="bg-primary-container p-6 rounded-2xl card-shadow text-on-primary-container relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-1 font-title-lg text-white">Facility Status</h3>
              <p className="text-xs font-semibold text-white/80 mb-6 font-label-md tracking-wider uppercase">Real-time Monitoring</p>
              
              <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="bg-white/20 p-2 rounded-lg text-white">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-white font-body-md">Systems Online</p>
                  <p className="text-xs text-white/90 font-label-sm">12/12 Checkpoints Active</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-on-tertiary-container/10 rounded-full blur-2xl"></div>
          </div>

          {/* Soft Sky Alert Container */}
          <div className="bg-[#e0f2fe]/20 p-6 rounded-2xl border border-[#bae6fd]/30">
            <h3 className="text-lg font-bold text-portal-primary mb-4 font-title-lg">System Alerts</h3>
            <ul className="space-y-3">
              {recentAlerts.map((alert) => (
                <li key={alert.id} className="flex gap-2 text-sm text-on-surface">
                  {alert.type === 'info' ? (
                    <Info className="w-5 h-5 text-[#0ea5e9] shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-[#0ea5e9] shrink-0" />
                  )}
                  <span className="font-body-md">{alert.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
