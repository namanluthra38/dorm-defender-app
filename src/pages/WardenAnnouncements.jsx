import React, { useState } from 'react';
import { Megaphone, PlusCircle, Calendar, AlertTriangle, Info, X, Save, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const WardenAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([
    { 
      id: 1, 
      title: 'Orientation schedule', 
      date: '2026-05-20', 
      body: 'Orientation for new students on 1st Nov at 10:00 AM in the main hall.', 
      priority: 'General' 
    },
    { 
      id: 2, 
      title: 'Water outage', 
      date: '2026-05-18', 
      body: 'Water supply will be interrupted for maintenance on 28th Oct from 10:00 to 16:00.', 
      priority: 'Urgent' 
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('General');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error('Please fill in all announcement fields.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const newAnn = {
        id: Date.now(),
        title: title.trim(),
        body: body.trim(),
        date: new Date().toISOString().split('T')[0],
        priority
      };
      
      setAnnouncements(prev => [newAnn, ...prev]);
      setSubmitting(false);
      setShowModal(false);
      setTitle('');
      setBody('');
      setPriority('General');
      toast.success('Announcement published successfully!');
    }, 600);
  };

  return (
    <div className="max-w-[900px] mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Header section */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-outline-variant/30">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Announcements Desk</h1>
          <p className="font-body-md text-on-surface-variant text-sm mt-1">
            Broadcast emergency alerts, schedules, and general notices to your hostel residents.
          </p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 bg-portal-primary hover:bg-portal-primary/95 text-white shadow-lg shadow-portal-primary/20 px-5 py-2.5 rounded-xl text-sm font-semibold active:scale-[0.98] transition-all hover:scale-[1.01]"
        >
          <PlusCircle className="w-4 h-4 shrink-0" />
          <span>New Announcement</span>
        </button>
      </header>

      {/* Feed list */}
      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="security-shadow glass-effect rounded-2xl p-12 border border-outline-variant bg-surface-container-lowest flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <Megaphone className="w-10 h-10 text-on-surface-variant/70 mb-4" />
            <h3 className="font-headline-sm text-on-surface">No announcements</h3>
            <p className="text-sm text-on-surface-variant mt-2">
              You haven't broadcasted any notices yet. Click the button above to publish your first announcement.
            </p>
          </div>
        ) : (
          announcements.map(a => {
            const isUrgent = a.priority === 'Urgent';
            return (
              <article 
                key={a.id}
                className={`security-shadow glass-effect rounded-xl border p-6 bg-surface-container-lowest transition-all hover:border-portal-primary/30 flex gap-4 items-start ${
                  isUrgent 
                    ? 'border-l-4 border-l-rose-500 border-outline-variant/70' 
                    : 'border-l-4 border-l-portal-primary border-outline-variant/70'
                }`}
              >
                {/* Visual Icon indicator */}
                <div className={`p-2.5 rounded-lg border hidden sm:block shrink-0 ${
                  isUrgent 
                    ? 'text-rose-600 bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30' 
                    : 'text-portal-primary bg-primary-fixed border-outline-variant/30'
                }`}>
                  {isUrgent ? <AlertTriangle className="w-5 h-5" /> : <Megaphone className="w-5 h-5" />}
                </div>

                {/* Announcement info */}
                <div className="space-y-2 flex-grow">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-headline-sm text-base text-on-surface font-semibold">{a.title}</h3>
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant font-medium">
                      <Calendar className="w-3.5 h-3.5 text-on-surface-variant/80" />
                      <span>{new Date(a.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                        isUrgent
                          ? 'text-rose-600 bg-rose-50 border-rose-100'
                          : 'text-slate-600 bg-slate-50 border-slate-100'
                      }`}>
                        {a.priority}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap">{a.body}</p>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <form 
            onSubmit={handleSubmit}
            className="bg-surface-container-lowest border border-outline-variant rounded-2xl max-w-lg w-full security-shadow overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-outline-variant/30 bg-surface-container-high/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg border text-portal-primary bg-primary-fixed">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-headline-sm text-base text-on-surface font-semibold">Publish Announcement</h3>
                  <p className="text-xs text-on-surface-variant font-medium">Broadcast a notice to all residents</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full hover:bg-surface-variant/20 text-on-surface-variant transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="p-6 space-y-4 overflow-y-auto text-on-surface text-sm">
              <div className="space-y-1.5">
                <label className="font-bold text-xs uppercase tracking-wider text-on-surface-variant block">Notice Title</label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Scheduled Power Maintenance"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface outline-none focus:border-portal-primary/60 transition-all text-on-surface"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-xs uppercase tracking-wider text-on-surface-variant block">Priority Level</label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center cursor-pointer group">
                    <input 
                      type="radio" 
                      name="priority"
                      checked={priority === 'General'}
                      onChange={() => setPriority('General')}
                      className="form-radio h-4 w-4 border-outline-variant text-portal-primary focus:ring-portal-primary/20 focus:ring-offset-0 transition-all"
                    />
                    <span className="ml-2 group-hover:text-portal-primary font-medium transition-colors">General Notice</span>
                  </label>
                  <label className="inline-flex items-center cursor-pointer group">
                    <input 
                      type="radio" 
                      name="priority"
                      checked={priority === 'Urgent'}
                      onChange={() => setPriority('Urgent')}
                      className="form-radio h-4 w-4 border-outline-variant text-rose-600 focus:ring-rose-500/20 focus:ring-offset-0 transition-all"
                    />
                    <span className="ml-2 group-hover:text-rose-600 font-medium transition-colors">Urgent / Alert</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-xs uppercase tracking-wider text-on-surface-variant block">Announcement details</label>
                <textarea 
                  required
                  rows={5}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Type the detailed description of your announcement..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-outline-variant bg-surface outline-none focus:border-portal-primary/60 transition-all text-on-surface font-body-md leading-relaxed resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-outline-variant/30 bg-surface-container-high/40">
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 rounded-lg border border-outline-variant text-sm font-semibold text-on-surface-variant hover:bg-surface-variant/20 active:scale-[0.98] transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-portal-primary hover:bg-portal-primary/95 text-white shadow-lg active:scale-[0.98] transition-all flex items-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 shrink-0 text-white" />
                    <span>Publish</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default WardenAnnouncements;
