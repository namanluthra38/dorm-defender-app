// src/pages/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import useStudentComposite from '@/hooks/useStudentComposite';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/api/studentClient';
import { REQUEST_BASE } from '@/config';
import { 
  Building, 
  User, 
  MessageSquare, 
  FileText, 
  Wrench, 
  Zap, 
  Wifi, 
  AlertTriangle, 
  Plus, 
  Calendar, 
  Info, 
  CheckCircle2, 
  ArrowRight,
  Loader2,
  X,
  Camera,
  Flame
} from 'lucide-react';
import { toast } from 'sonner';

export default function StudentDashboard() {
  const { data: composite, isLoading, error } = useStudentComposite();
  const { studentComplaints, refreshStudentComplaints, token } = useAuth();

  const [roommates, setRoommates] = useState([]);
  const [roommatesLoading, setRoommatesLoading] = useState(false);
  const [showNewComplaintModal, setShowNewComplaintModal] = useState(false);

  // Form states for New Complaint
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileAttachments, setFileAttachments] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const student = composite?.student ?? {};
  const room = composite?.room ?? null;
  const hostel = composite?.hostel ?? null;

  const complaints = studentComplaints ?? [];

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

  // Helper to get corresponding Lucide icon for complaint type
  const getComplaintIcon = (cTitle = '', cDesc = '') => {
    const text = `${cTitle} ${cDesc}`.toLowerCase();
    if (text.includes('leak') || text.includes('water') || text.includes('pipe') || text.includes('plumbing')) {
      return <Wrench className="w-5 h-5" />;
    }
    if (text.includes('light') || text.includes('fan') || text.includes('power') || text.includes('switch') || text.includes('electricity') || text.includes('bolt')) {
      return <Zap className="w-5 h-5" />;
    }
    if (text.includes('wifi') || text.includes('internet') || text.includes('signal') || text.includes('network')) {
      return <Wifi className="w-5 h-5" />;
    }
    return <AlertTriangle className="w-5 h-5" />;
  };

  // Calculate active and high priority complaints count dynamically
  const activeComplaintsList = complaints.filter(c => {
    const s = (c?.status ?? '').toString().toUpperCase();
    return s === 'OPEN' || s === 'IN_PROGRESS' || s === 'PENDING';
  });
  const complaintsOpen = activeComplaintsList.length;
  const highPriorityCount = activeComplaintsList.filter(c => getPriority(c.title, c.description) === 'High').length;

  // Retrieve roommates names asynchronously using roommate studentIds
  useEffect(() => {
    if (!room?.studentIds || room.studentIds.length === 0) {
      setRoommates([]);
      return;
    }

    const currentStudentId = student?.id ?? composite?.student?.id;
    const ids = room.studentIds.filter(id => String(id) !== String(currentStudentId));
    if (ids.length === 0) {
      setRoommates([]);
      return;
    }

    let active = true;
    (async () => {
      setRoommatesLoading(true);
      try {
        const fetchName = async (id) => {
          try {
            const res = await api.get(`/students/${id}/name`);
            if (res && res.data) {
              const name = typeof res.data === 'string' ? res.data.replace(/^"(.*)"$/, '$1') : String(res.data);
              return { id, name };
            }
          } catch (e) {
            console.debug('Failed to fetch name for', id, e);
          }
          return { id, name: `Student #${id.slice(-4)}` };
        };
        const list = await Promise.all(ids.map(fetchName));
        if (active) {
          setRoommates(list);
        }
      } catch (err) {
        console.error('Failed fetching roommates', err);
      } finally {
        if (active) setRoommatesLoading(false);
      }
    })();

    return () => { active = false; };
  }, [room?.studentIds, student?.id, composite?.student?.id]);

  // Handle files preview creation
  useEffect(() => {
    previews.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} });
    const urls = fileAttachments.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => { urls.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} }); };
  }, [fileAttachments]);

  // Image compression & resizing helper to match main Complaints page
  const resizeFileToDataUrl = (file, maxWidth = 600, quality = 0.55) => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          let { width: w, height: h } = img;
          if (w > maxWidth) {
            const ratio = maxWidth / w;
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);
          const mime = 'image/webp';
          canvas.toBlob((blob) => {
            if (!blob) {
              URL.revokeObjectURL(url);
              return reject(new Error('Compression failed'));
            }
            const reader = new FileReader();
            reader.onload = () => {
              URL.revokeObjectURL(url);
              resolve(reader.result);
            };
            reader.onerror = (err) => { URL.revokeObjectURL(url); reject(err); };
            reader.readAsDataURL(blob);
          }, mime, quality);
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };
      img.onerror = (err) => { URL.revokeObjectURL(url); reject(err); };
      img.src = url;
    });
  };

  const onFileChange = (e) => {
    const files = Array.from(e.target.files || [])
      .filter(f => f && f.type && f.type.startsWith('image/'))
      .slice(0, 5);
    setFileAttachments(files);
  };

  const removeFileAt = (idx) => setFileAttachments(prev => prev.filter((_, i) => i !== idx));

  // Submit new complaint directly from the dashboard
  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (submitting) return;
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    setSubmitting(true);
    try {
      const tokenToUse = token ?? localStorage.getItem('authToken');

      let attachments = [];
      if (fileAttachments.length > 0) {
        const converted = [];
        for (const f of fileAttachments) {
          try {
            const dataUrl = await resizeFileToDataUrl(f);
            converted.push(dataUrl);
          } catch (err) {
            console.warn('Failed to compress image', f.name, err);
          }
        }
        attachments = converted;
      }

      const body = { title, description, attachments };
      const res = await fetch(`${REQUEST_BASE}/complaints`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}) 
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(txt || `Server error: ${res.status}`);
      }

      toast.success('Complaint submitted successfully!');
      
      // Refresh complaints in AuthContext
      await refreshStudentComplaints();
      
      // Close modal and reset fields
      setShowNewComplaintModal(false);
      setTitle('');
      setDescription('');
      setFileAttachments([]);
    } catch (err) {
      toast.error(`Failed to submit complaint: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to dynamically calculate next upcoming Friday
  const getNextFriday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);
    return nextFriday.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  // Static fallback or mock items matching the premium design brief
  const summary = {
    hostelName: hostel?.name ?? 'Sigma Hall',
    room: room?.roomNumber ?? '402',
    wing: hostel?.wing ?? 'North Campus Wing',
    seater: room?.totalSeats ? `${room.totalSeats}-Seater Occupancy` : 'Double Occupancy',
    complaintsOpen: complaintsOpen,
    highPriorityCount: highPriorityCount,
    announcementTitle: 'Water maintenance on Friday',
    announcementTime: 'Sent 2h ago'
  };

  const recentAlerts = [
    { id: 1, type: 'info', text: 'Mess menu updated for the week.' },
    { id: 2, type: 'check', text: 'Room audit completed successfully.' }
  ];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="w-10 h-10 text-portal-primary animate-spin" />
        <p className="text-on-surface-variant font-medium">Loading your student dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-portal-error p-6 rounded-2xl max-w-xl mx-auto my-10 flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 shrink-0" />
        <div>
          <h3 className="font-bold text-lg mb-1">Failed to load dashboard</h3>
          <p className="text-sm opacity-90">{error.message || 'An unexpected connection error occurred. Please refresh or try again.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-on-surface font-headline-lg">Overview</h2>
        <p className="text-base text-on-surface-variant mt-1 font-body-lg">Quick access to your residence details and updates.</p>
      </div>

      {/* Metric Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {/* Hostel Building Card */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl card-shadow card-shadow-hover border-l-4 border-secondary-container transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-secondary-fixed w-12 h-12 flex items-center justify-center rounded-xl">
              <Building className="w-6 h-6 text-on-secondary-container" />
            </div>
            <span className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase font-label-md">Hostel Building</span>
          </div>
          <p className="text-2xl font-bold text-on-surface font-headline-md">{summary.hostelName}</p>
          <p className="text-xs font-medium text-on-surface-variant mt-2 tracking-wider font-label-md">{summary.wing}</p>
        </div>

        {/* Room Number Card */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl card-shadow card-shadow-hover border-l-4 border-tertiary-container transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-tertiary-fixed w-12 h-12 flex items-center justify-center rounded-xl">
              <User className="w-6 h-6 text-on-tertiary-fixed-variant" />
            </div>
            <span className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase font-label-md">Room Number</span>
          </div>
          <p className="text-2xl font-bold text-on-surface font-headline-md">{summary.room}</p>
          <p className="text-xs font-medium text-on-surface-variant mt-2 tracking-wider font-label-md">{summary.seater}</p>
        </div>

        {/* Open Complaints Card */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl card-shadow card-shadow-hover border-l-4 border-portal-error transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-error-container w-12 h-12 flex items-center justify-center rounded-xl">
              <MessageSquare className="w-6 h-6 text-on-error-container" />
            </div>
            <span className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase font-label-md">Open Complaints</span>
          </div>
          <p className="text-2xl font-bold text-on-surface font-headline-md">
            {summary.complaintsOpen} {summary.complaintsOpen === 1 ? 'Active' : 'Active'}
          </p>
          <p className="text-xs font-medium text-on-surface-variant mt-2 tracking-wider font-label-md">
            {summary.highPriorityCount} {summary.highPriorityCount === 1 ? 'High Priority' : 'High Priority'}
          </p>
        </div>

        {/* Latest Announcement Card */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl card-shadow card-shadow-hover border-l-4 border-portal-primary transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-primary-fixed w-12 h-12 flex items-center justify-center rounded-xl">
              <FileText className="w-6 h-6 text-portal-primary" />
            </div>
            <span className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase font-label-md">Latest Announcement</span>
          </div>
          <p className="text-lg font-bold text-on-surface leading-snug line-clamp-1 font-title-lg">{summary.announcementTitle}</p>
          <p className="text-xs font-medium text-on-surface-variant mt-3 tracking-wider font-label-md">{summary.announcementTime}</p>
        </div>
      </div>

      {/* Asymmetric Bento Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity / Complaints (Large Span) */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-6 xl:p-8 rounded-2xl card-shadow flex flex-col justify-between border border-outline-variant/10">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-on-surface font-headline-sm">My Complaints</h3>
              <a 
                href="/student/complaints" 
                className="text-portal-primary font-semibold text-sm hover:underline flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="space-y-4">
              {complaints.length === 0 ? (
                <div className="text-center py-8 text-on-surface-variant font-medium">
                  <MessageSquare className="w-12 h-12 mx-auto opacity-20 mb-3" />
                  <p>You have not filed any complaints yet.</p>
                </div>
              ) : (
                complaints.slice(0, 3).map((c, idx) => {
                  const priority = getPriority(c.title, c.description);
                  const isHigh = priority === 'High';
                  const isMed = priority === 'Medium';
                  
                  let badgeClass = "bg-surface-container-high text-on-surface-variant";
                  if (isHigh) badgeClass = "bg-error-container text-on-error-container";
                  if (isMed) badgeClass = "bg-secondary-fixed text-on-secondary-fixed-variant";

                  let iconBgClass = "bg-primary-container/10 text-portal-primary";
                  if (isHigh) iconBgClass = "bg-portal-error/10 text-portal-error";
                  if (isMed) iconBgClass = "bg-portal-secondary/10 text-portal-secondary";

                  return (
                    <div 
                      key={c.id || c._id || idx} 
                      className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-outline-variant/30 hover:border-portal-primary/30 transition-all card-shadow-hover"
                    >
                      <div className={`p-3 rounded-xl shrink-0 ${iconBgClass}`}>
                        {getComplaintIcon(c.title, c.description)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-semibold text-base text-on-surface truncate font-title-lg">{c.title}</p>
                          <span className={`px-3 py-0.5 rounded-full text-xs font-semibold shrink-0 font-label-sm ${badgeClass}`}>
                            {priority}
                          </span>
                        </div>
                        <p className="text-sm text-on-surface-variant mt-1 font-body-md truncate">
                          {c.status === 'OPEN' ? 'Pending Review' : c.status === 'IN_PROGRESS' ? 'Assigned to Maintenance' : c.status === 'RESOLVED' ? 'Resolved • Completed' : c.status} 
                          {` • ID: #CM-${(c.id || c._id || '40291').slice(-5)}`}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Interactive Action Button */}
          <button 
            onClick={() => setShowNewComplaintModal(true)}
            className="w-full mt-6 py-3 bg-portal-primary text-white font-bold text-base rounded-xl shadow-sm hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> New Complaint
          </button>
        </div>

        {/* Side Cards Column */}
        <div className="space-y-6">
          {/* Room Mates Mini Card */}
          <div className="bg-surface-container-lowest p-6 rounded-2xl card-shadow border border-outline-variant/20">
            <h3 className="text-lg font-bold text-on-surface mb-4 font-title-lg">Room Mates</h3>
            <div className="space-y-4">
              {roommatesLoading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-portal-primary animate-spin" />
                  <p className="text-sm text-on-surface-variant">Loading roommates...</p>
                </div>
              ) : roommates.length === 0 ? (
                <p className="text-sm text-on-surface-variant font-medium py-2">No roommates currently assigned.</p>
              ) : (
                roommates.map((rm) => (
                  <div key={rm.id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high border-2 border-primary-container flex items-center justify-center font-bold text-portal-primary font-title-lg">
                      {rm.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-on-surface font-body-md">{rm.name}</p>
                      <p className="text-xs text-on-surface-variant font-label-sm">Occupied</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Maintenance Progress Card */}
          <div className="bg-primary-container p-6 rounded-2xl card-shadow text-on-primary-container relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-1 font-title-lg text-white">Hostel Maintenance</h3>
              <p className="text-xs font-semibold text-white/80 mb-6 font-label-md tracking-wider uppercase">Next Scheduled Visit</p>
              
              <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
                <div className="bg-white/20 p-2 rounded-lg text-white">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-white font-body-md">{getNextFriday()}</p>
                  <p className="text-xs text-white/90 font-label-sm">{summary.room ? `Room ${String(summary.room).slice(0, 1)}00 - ${String(summary.room).slice(0, 1)}50 Wing` : 'All Wings'}</p>
                </div>
              </div>
            </div>
            
            {/* Decorative Background Element */}
            <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-on-tertiary-container/10 rounded-full blur-2xl"></div>
          </div>

          {/* Soft Sky Announcement List Container */}
          <div className="bg-[#e0f2fe]/20 p-6 rounded-2xl border border-[#bae6fd]/30">
            <h3 className="text-lg font-bold text-portal-primary mb-4 font-title-lg">Recent Alerts</h3>
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

      {/* Floating Action Button Contextual */}
      <button 
        onClick={() => setShowNewComplaintModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-secondary-container text-on-secondary-container hover:scale-105 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all z-40 group hover:shadow-2xl"
        title="Quick Complaint"
      >
        <Plus className="w-6 h-6 transition-transform group-hover:rotate-90 duration-300" />
      </button>

      {/* Slide-over Modal for New Complaint */}
      {showNewComplaintModal && (
        <div className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative border border-outline-variant/30 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 pb-2 border-b border-outline-variant/20">
              <div>
                <h3 className="text-xl font-bold text-on-surface font-headline-sm">Raise a Complaint</h3>
                <p className="text-xs text-on-surface-variant mt-1">Let us know what needs fixing. We'll assign it to maintenance.</p>
              </div>
              <button 
                onClick={() => {
                  setShowNewComplaintModal(false);
                  setTitle('');
                  setDescription('');
                  setFileAttachments([]);
                }} 
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-high transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateComplaint} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-label-md">Complaint Title</label>
                <input 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g., Leaking Bathroom Tap, Weak WiFi" 
                  className="w-full mt-2 border border-outline-variant rounded-xl px-4 py-2.5 font-body-md focus:outline-none focus:ring-2 focus:ring-portal-primary/20 focus:border-portal-primary bg-surface transition-all"
                  maxLength={150} 
                  required 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-label-md">Detailed Description</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Describe the issue in detail, including specific locations or behaviors..." 
                  className="w-full mt-2 border border-outline-variant rounded-xl px-4 py-2.5 font-body-md focus:outline-none focus:ring-2 focus:ring-portal-primary/20 focus:border-portal-primary bg-surface transition-all"
                  rows={5} 
                  maxLength={4000} 
                  required 
                />
              </div>

              <div>
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider font-label-md block mb-2">Attach Device Photo (Optional)</label>
                <div className="relative border-2 border-dashed border-outline-variant/60 rounded-xl p-4 flex flex-col items-center justify-center bg-surface hover:bg-surface-container-low transition-colors group cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={onFileChange} 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                  <Camera className="w-8 h-8 text-on-surface-variant group-hover:text-portal-primary transition-colors mb-2" />
                  <p className="text-sm font-semibold text-on-surface font-body-md">Click or drag images here</p>
                  <p className="text-xs text-on-surface-variant mt-1">Accepts up to 5 image attachments. Resized & compressed automatically.</p>
                </div>

                {fileAttachments.length > 0 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                    {fileAttachments.map((f, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-outline-variant/40 shrink-0">
                        <button 
                          type="button" 
                          onClick={() => removeFileAt(idx)} 
                          className="absolute top-1 right-1 z-10 bg-black/60 text-white rounded-full p-0.5 hover:bg-black transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <img src={previews[idx]} alt={f.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/10">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowNewComplaintModal(false);
                    setTitle('');
                    setDescription('');
                    setFileAttachments([]);
                  }} 
                  className="px-4 py-2 border border-outline-variant rounded-xl font-bold text-sm text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="px-5 py-2 bg-portal-primary text-white rounded-xl font-bold text-sm shadow-sm hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    'Submit Complaint'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
