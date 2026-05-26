// src/pages/Complaints.jsx
import React, { useEffect, useState } from 'react';
import { 
  Plus, 
  Wrench, 
  Zap, 
  Wifi, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  X, 
  Loader2, 
  Camera, 
  Image as ImageIcon,
  Clock
} from 'lucide-react';
import { REQUEST_BASE } from '@/config';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const safeGetToken = () => {
  try { return localStorage.getItem('authToken'); } catch (e) { return null; }
};

const MAX_FILES = 5;
const RESIZE_MAX_WIDTH = 600; // px
const RESIZE_QUALITY = 0.55; // quality
const ALERT_PAYLOAD_BYTES = 400 * 1024; // 400KB threshold

const Complaints = () => {
  const { studentComplaints, token, refreshStudentComplaints } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileAttachments, setFileAttachments] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Active status filter state: 'all' | 'open' | 'in_progress' | 'resolved'
  const [statusFilter, setStatusFilter] = useState('all');

  // Detailed selected complaint state for inspection popup
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Hydrate complaints from auth context
  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      if (studentComplaints && Array.isArray(studentComplaints)) {
        setComplaints(studentComplaints);
      } else {
        setComplaints([]);
      }
    } catch (e) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [studentComplaints]);

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
    
    // Plumbing / Maintenance
    if (text.includes('leak') || text.includes('water') || text.includes('pipe') || text.includes('plumbing') || text.includes('shower') || text.includes('drain')) {
      return {
        icon: <Wrench className="w-5 h-5" />,
        category: 'Maintenance',
        subtag: getPriority(cTitle, cDesc) === 'High' ? 'Urgent' : 'Plumbing',
      };
    }
    
    // Electrical / Power
    if (text.includes('light') || text.includes('fan') || text.includes('power') || text.includes('switch') || text.includes('electricity') || text.includes('shock') || text.includes('ac') || text.includes('wire')) {
      return {
        icon: <Zap className="w-5 h-5" />,
        category: 'Facilities',
        subtag: 'Electrical',
      };
    }
    
    // Wifi / Network
    if (text.includes('wifi') || text.includes('internet') || text.includes('signal') || text.includes('network') || text.includes('router') || text.includes('connectivity')) {
      return {
        icon: <Wifi className="w-5 h-5" />,
        category: 'Facilities',
        subtag: 'Block A',
      };
    }

    // Mess / Food
    if (text.includes('mess') || text.includes('food') || text.includes('dinner') || text.includes('lunch') || text.includes('breakfast') || text.includes('meal') || text.includes('quality') || text.includes('kitchen')) {
      return {
        icon: <Flame className="w-5 h-5" />,
        category: 'Mess',
        subtag: 'Vendor Issue',
      };
    }
    
    // Default / General
    return {
      icon: <AlertTriangle className="w-5 h-5" />,
      category: 'Facilities',
      subtag: 'General',
    };
  };

  const openForm = () => {
    setTitle('');
    setDescription('');
    setFileAttachments([]);
    setShowForm(true);
  };

  // Resize & compress an image File to a WebP data URL
  const resizeFileToDataUrl = (file, maxWidth = RESIZE_MAX_WIDTH, quality = RESIZE_QUALITY) => {
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
      .slice(0, MAX_FILES);
    setFileAttachments(files);
  };

  // manage previews and revoke old object URLs
  useEffect(() => {
    previews.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} });
    const urls = fileAttachments.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => { urls.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} }); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileAttachments]);

  const removeFileAt = (idx) => setFileAttachments(prev => prev.filter((_, i) => i !== idx));

  const submit = async (e) => {
    e?.preventDefault();
    if (submitting) return;
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    setSubmitting(true);
    try {
      const tokenToUse = token ?? safeGetToken();

      let attachments = [];
      if (fileAttachments && fileAttachments.length > 0) {
        // compress/resize each file
        const converted = [];
        for (const f of fileAttachments) {
          try {
            const dataUrl = await resizeFileToDataUrl(f);
            converted.push(dataUrl);
          } catch (err) {
            console.warn('Failed to process image', f.name, err);
          }
        }
        attachments = converted;
      }

      // Log sizes and warning
      try {
        const sizes = attachments.map(a => (typeof a === 'string' ? a.length : 0));
        const total = sizes.reduce((s, v) => s + v, 0);
        if (total > ALERT_PAYLOAD_BYTES) {
          const kb = Math.round(total / 1024);
          if (!confirm(`Total attachments payload is ~${kb} KB after compression. Continue sending?`)) {
            setSubmitting(false);
            return;
          }
        }
      } catch (e) {}

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

      const created = await res.json();
      toast.success('Complaint submitted successfully!');
      try { 
        await refreshStudentComplaints(); 
      } catch (e) { 
        setComplaints(prev => [created, ...prev]); 
      }
      setShowForm(false);
      setTitle('');
      setDescription('');
      setFileAttachments([]);
    } catch (err) {
      toast.error('Failed to create complaint: ' + (err?.message ?? String(err)));
    } finally { 
      setSubmitting(false); 
    }
  };

  // Dynamic Bento Grid Metric calculations
  const totalFiled = complaints.length;
  const openCount = complaints.filter(c => {
    const s = String(c.status || '').toUpperCase();
    return s === 'OPEN' || s === 'PENDING' || s === 'UNKNOWN';
  }).length;
  const inProgressCount = complaints.filter(c => String(c.status || '').toUpperCase() === 'IN_PROGRESS').length;
  const resolvedCount = complaints.filter(c => String(c.status || '').toUpperCase() === 'RESOLVED').length;

  // Tab dynamic filtering logic
  const filteredComplaints = complaints.filter(c => {
    const s = String(c.status || '').toUpperCase();
    if (statusFilter === 'open') return s === 'OPEN' || s === 'PENDING' || s === 'UNKNOWN';
    if (statusFilter === 'in_progress') return s === 'IN_PROGRESS';
    if (statusFilter === 'resolved') return s === 'RESOLVED';
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Content Header (Matching given code styling exactly) */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-on-surface">My Complaints</h2>
          <p className="text-body-lg font-body-lg text-secondary">Track and manage your residency issues.</p>
        </div>
        <button 
          onClick={openForm}
          className="flex items-center gap-2 bg-portal-primary text-white px-6 py-3 rounded-lg font-label-md text-label-md shadow-md hover:opacity-90 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 shrink-0 text-white" />
          <span>New Complaint</span>
        </button>
      </div>

      {/* Dashboard Bento Grid Visual Reinforcement (Matching given code styling exactly) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface-container-lowest p-stack-md rounded-xl security-shadow border border-outline-variant">
          <p className="text-label-sm font-label-sm text-secondary">Total Filed</p>
          <p className="text-headline-md font-headline-md text-primary">{String(totalFiled).padStart(2, '0')}</p>
        </div>

        <div className="bg-surface-container-lowest p-stack-md rounded-xl security-shadow border border-outline-variant">
          <p className="text-label-sm font-label-sm text-secondary">Open</p>
          <p className="text-headline-md font-headline-md text-on-primary-fixed-variant">{String(openCount).padStart(2, '0')}</p>
        </div>

        <div className="bg-surface-container-lowest p-stack-md rounded-xl security-shadow border border-outline-variant">
          <p className="text-label-sm font-label-sm text-secondary">In Progress</p>
          <p className="text-headline-md font-headline-md text-secondary">{String(inProgressCount).padStart(2, '0')}</p>
        </div>

        <div className="bg-surface-container-lowest p-stack-md rounded-xl security-shadow border border-outline-variant">
          <p className="text-label-sm font-label-sm text-secondary">Resolved</p>
          <p className="text-headline-md font-headline-md text-[#15803d]">{String(resolvedCount).padStart(2, '0')}</p>
        </div>
      </div>

      {/* Filters tabs (Matching given code styling exactly) */}
      <div className="flex items-center gap-stack-md border-b border-outline-variant mt-4 mb-6">
        {[
          { id: 'all', label: 'All' },
          { id: 'open', label: 'Open' },
          { id: 'in_progress', label: 'In Progress' },
          { id: 'resolved', label: 'Resolved' }
        ].map(tab => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-6 py-3 text-label-md font-label-md transition-all border-b-2 relative -mb-[2px] ${
                isActive 
                  ? 'text-primary border-primary font-bold' 
                  : 'text-secondary hover:text-primary border-transparent transition-colors'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Complaints Feed list container */}
      <div className="space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-xl border border-outline-variant security-shadow">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-label-md font-label-md text-secondary mt-4">Retrieving your complaints...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 bg-surface-container-lowest rounded-xl border border-outline-variant security-shadow text-center px-4">
            <AlertTriangle className="w-12 h-12 text-error" />
            <h3 className="text-headline-md font-headline-md text-on-surface mt-4">Error Loading Complaints</h3>
            <p className="text-body-md font-body-md text-error mt-2 max-w-md">{error}</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          /* Empty State Concept (Matching given code styling exactly) */
          <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant">
            <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6">
              <ImageIcon className="w-12 h-12 text-outline" />
            </div>
            <h3 className="text-headline-md font-headline-md text-on-surface">No Complaints Found</h3>
            <p className="text-body-lg font-body-lg text-secondary max-w-md mx-auto mt-2">
              You're all caught up! There are no residency issues reported under your current filter.
            </p>
            <button 
              onClick={openForm}
              className="mt-8 bg-portal-primary text-white px-6 py-3 rounded-lg font-label-md text-label-md shadow-md hover:opacity-90 active:scale-95 transition-all"
            >
              File a New Complaint
            </button>
          </div>
        ) : (
          filteredComplaints.map(c => {
            const statusUpper = String(c.status || '').toUpperCase();
            const isOpen = statusUpper === 'OPEN' || statusUpper === 'PENDING' || statusUpper === 'UNKNOWN';
            const isInProgress = statusUpper === 'IN_PROGRESS';
            const isResolved = statusUpper === 'RESOLVED';

            // Category Details
            const meta = getTagsAndIcon(c.title, c.description);
            const priority = getPriority(c.title, c.description);

            // Formatted Dates
            const dateStr = new Date(c.createdAt || c.date || Date.now()).toLocaleString();
            const updatedDateStr = new Date(c.updatedAt || c.createdAt || Date.now()).toLocaleDateString();

            const cmpId = c.id || c._id || '1024';
            const displayId = typeof cmpId === 'string' && cmpId.length > 8 
              ? `CMP-${cmpId.slice(-4).toUpperCase()}` 
              : `CMP-${cmpId}`;

            // Category Icon Background Color matching design rules
            let iconBg = 'bg-primary-fixed text-primary';
            if (isInProgress) iconBg = 'bg-[#fef3c7] text-[#d97706]';
            if (isResolved) iconBg = 'bg-[#dcfce7] text-[#15803d]';

            return (
              /* Complaint Card (Matching given code styling exactly) */
              <div 
                key={c.id || c._id || JSON.stringify(c)} 
                className="group bg-surface-container-lowest p-gutter-md rounded-xl security-shadow border border-outline-variant hover:border-primary transition-all duration-300"
              >
                {/* Header block */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-4">
                    {/* Category Icon box wrapper */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                      {meta.icon}
                    </div>

                    {/* Metadata details */}
                    <div>
                      <h3 
                        onClick={() => setSelectedComplaint(c)}
                        className="text-label-md font-label-md text-on-surface group-hover:text-primary transition-colors cursor-pointer hover:underline"
                      >
                        {c.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-label-sm font-label-sm text-secondary bg-surface-container px-2 py-0.5 rounded">
                          #{displayId}
                        </span>
                        <span className="text-label-sm font-label-sm text-outline">•</span>
                        <span className="text-label-sm font-label-sm text-secondary flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-outline/80" />
                          {dateStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* High Contrast Status Badges */}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-label-sm font-label-sm border ${
                    isOpen 
                      ? 'bg-[#e0e7ff] text-[#4338ca] border-[#c7d2fe]' 
                      : isInProgress 
                        ? 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]' 
                        : 'bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]'
                  }`}>
                    {isOpen ? 'Open' : isInProgress ? 'In Progress' : 'Resolved'}
                  </span>
                </div>

                {/* Description Paragraph */}
                <p className="text-body-md font-body-md text-on-surface-variant mb-4 max-w-3xl leading-relaxed">
                  {c.description}
                </p>

                {/* If attachments exist, show small preview blocks */}
                {c.attachments && c.attachments.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-4 shrink-0">
                    {c.attachments.map((att, idx) => (
                      <div 
                        key={idx}
                        onClick={() => setSelectedComplaint(c)}
                        className="relative w-16 h-16 rounded-lg overflow-hidden border border-outline-variant shrink-0 cursor-pointer hover:scale-105 hover:border-primary transition-all duration-200"
                        title="Click to view full screen"
                      >
                        <img src={att} alt="Attachment" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer Section */}
                <div className="flex items-center justify-between">
                  {/* Left: Tags */}
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded bg-surface-container text-label-sm font-label-sm text-secondary">
                      {meta.category}
                    </span>
                    <span className="px-3 py-1 rounded bg-surface-container text-label-sm font-label-sm text-secondary">
                      {meta.subtag}
                    </span>
                    <span className={`px-3 py-1 rounded bg-surface-container text-label-sm font-label-sm text-secondary`}>
                      {priority} Priority
                    </span>
                  </div>

                  {/* Right: Actions / Resolution Indicators */}
                  <div className="flex items-center gap-4">
                    {isResolved && (
                      <div className="flex items-center gap-2 text-[#15803d] text-label-sm font-label-sm">
                        <CheckCircle2 className="w-[18px] h-[18px] shrink-0" />
                        <span>Resolved on {updatedDateStr}</span>
                      </div>
                    )}
                    <button 
                      onClick={() => setSelectedComplaint(c)}
                      className="text-primary text-label-md font-label-md flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <span>View Details</span>
                      <ChevronRight className="w-[18px] h-[18px] shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>


      {/* Slide-over Dialog Modal for raising a New Complaint */}
      {showForm && (
        <div className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-xl w-full max-w-lg p-6 shadow-2xl relative border border-outline-variant animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-outline-variant shrink-0">
              <div>
                <h3 className="text-headline-md font-headline-md text-on-surface">File a New Complaint</h3>
                <p className="text-label-sm font-label-sm text-secondary mt-0.5">Let us know what needs administrative fixes.</p>
              </div>
              <button 
                onClick={() => setShowForm(false)} 
                className="text-secondary hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container-high transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Scroll Container */}
            <form onSubmit={submit} className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              <div>
                <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block">Complaint Title</label>
                <input 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g. Leaking Shower Pipe, Wi-Fi connectivity" 
                  className="w-full mt-2 border border-outline-variant rounded-lg px-4 py-2.5 font-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface transition-all text-sm text-on-surface"
                  maxLength={150} 
                  required 
                />
              </div>

              <div>
                <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block">Detailed Description</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  placeholder="Provide precise location, block wing details, or a summary of the issue..." 
                  className="w-full mt-2 border border-outline-variant rounded-lg px-4 py-2.5 font-body-md focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface transition-all text-sm text-on-surface"
                  rows={5} 
                  maxLength={4000} 
                  required 
                />
              </div>

              <div>
                <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-2">Upload Photo Attachments (Optional)</label>
                <div className="relative border-2 border-dashed border-outline-variant rounded-lg p-5 flex flex-col items-center justify-center bg-surface hover:bg-surface-container-low transition-colors group cursor-pointer">
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={onFileChange} 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                  />
                  <Camera className="w-8 h-8 text-secondary group-hover:text-primary transition-colors mb-2" />
                  <p className="text-body-md font-body-md text-on-surface font-semibold">Click or drag images here</p>
                  <p className="text-label-sm font-label-sm text-secondary mt-1">Select up to 5 images. Automatically compressed to high-efficiency WebP.</p>
                </div>

                {fileAttachments && fileAttachments.length > 0 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2 shrink-0">
                    {fileAttachments.map((f, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-outline-variant shrink-0">
                        <button 
                          type="button" 
                          onClick={() => removeFileAt(idx)} 
                          className="absolute top-1 right-1 z-20 bg-black/60 text-white rounded-full p-0.5 hover:bg-black transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        <img src={previews[idx]} alt={f.name} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons panel */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant shrink-0">
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  className="px-6 py-3 border border-outline-variant rounded-lg font-label-md text-label-md text-secondary hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="px-6 py-3 bg-portal-primary text-white rounded-lg font-label-md text-label-md shadow-md hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-1.5"
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

      {/* Details Lightbox Popover Details inspection modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-[#0b1c30]/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest rounded-xl w-full max-w-2xl p-6 shadow-2xl relative border border-outline-variant animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 mb-4 border-b border-outline-variant shrink-0">
              <div>
                <span className="text-label-sm font-label-sm bg-surface-container px-2.5 py-1 rounded text-secondary">
                  {typeof selectedComplaint.id === 'string' && selectedComplaint.id.length > 8 
                    ? `Complaint ID: #CMP-${selectedComplaint.id.slice(-4).toUpperCase()}` 
                    : `Complaint ID: #CMP-${selectedComplaint.id}`}
                </span>
                <h3 className="text-headline-md font-headline-md text-on-surface mt-2">{selectedComplaint.title}</h3>
                <p className="text-label-sm font-label-sm text-secondary mt-1">
                  Filed on: {new Date(selectedComplaint.createdAt || selectedComplaint.date || Date.now()).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => setSelectedComplaint(null)} 
                className="text-secondary hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container-high transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scroll Content */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              <div>
                <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider">Current Status</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-label-sm font-label-sm border ${
                    String(selectedComplaint.status || '').toUpperCase() === 'RESOLVED'
                      ? 'bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]'
                      : String(selectedComplaint.status || '').toUpperCase() === 'IN_PROGRESS'
                        ? 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]'
                        : 'bg-[#e0e7ff] text-[#4338ca] border-[#c7d2fe]'
                  }`}>
                    {String(selectedComplaint.status || '').toUpperCase() === 'RESOLVED' 
                      ? 'Resolved' 
                      : String(selectedComplaint.status || '').toUpperCase() === 'IN_PROGRESS' 
                        ? 'In Progress' 
                        : 'Open'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block">Description</label>
                <p className="text-body-md font-body-md text-on-surface-variant mt-1.5 whitespace-pre-wrap leading-relaxed">
                  {selectedComplaint.description}
                </p>
              </div>

              {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                <div>
                  <label className="text-label-md font-label-md text-on-surface-variant uppercase tracking-wider block mb-2">Attached Image Files</label>
                  <div className="grid grid-cols-2 gap-3 mt-1.5">
                    {selectedComplaint.attachments.map((att, idx) => (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-outline-variant group bg-surface">
                        <img 
                          src={att} 
                          alt="Attachment Detail View" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                        />
                        <a 
                          href={att} 
                          download={`complaint-${selectedComplaint.id}-att-${idx}.webp`}
                          className="absolute bottom-2 right-2 bg-black/60 text-white rounded-lg px-2.5 py-1 text-xs font-bold hover:bg-black transition-colors"
                          target="_blank" 
                          rel="noreferrer"
                        >
                          View Full
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {String(selectedComplaint.status || '').toUpperCase() === 'RESOLVED' && (
                <div className="bg-[#f0fdf4] border border-[#bbf7d0] p-4 rounded-xl">
                  <div className="flex gap-2">
                    <CheckCircle2 className="w-5 h-5 text-[#15803d] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-label-md font-label-md text-emerald-800">Issue Resolved Successfully</h4>
                      <p className="text-label-sm font-label-sm text-[#15803d] mt-0.5">
                        This complaint has been reviewed and resolved by the Hostel Warden Administration. Regular inspections are scheduled for wings safety.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-3 mt-4 border-t border-outline-variant shrink-0">
              <button 
                onClick={() => setSelectedComplaint(null)} 
                className="px-6 py-3 bg-portal-primary text-white font-label-md text-label-md rounded-lg shadow-md transition-all hover:opacity-95"
                type="button"
              >
                Close Details
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Complaints;
