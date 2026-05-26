import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { STUDENT_BASE } from '@/config';
import { ArrowLeft, Loader2, User, Mail, Phone, Calendar, Bookmark, ShieldAlert, MapPin, Sparkles } from 'lucide-react';

const safeGetToken = () => {
  try { return localStorage.getItem('authToken'); } catch (e) { return null; }
};

const WardenStudentDetails = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();
    const token = safeGetToken();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${STUDENT_BASE}/students/${encodeURIComponent(studentId)}/min`;
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
          if (res.status === 404) {
            setError('Student not found');
          } else {
            const txt = await res.text().catch(() => null);
            setError(`Failed to load: ${res.status} ${txt ?? ''}`);
          }
          setData(null);
          return;
        }
        const json = await res.json();
        if (!aborted) setData({ id: studentId, ...json });
      } catch (e) {
        if (!aborted) setError(e.message ?? String(e));
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    load();
    return () => { aborted = true; controller.abort(); };
  }, [studentId]);

  return (
    <div className="max-w-[700px] mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Header back button nav */}
      <header className="flex items-center gap-3 pb-2 border-b border-outline-variant/30">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 rounded-xl border border-outline-variant/75 bg-surface hover:bg-surface-variant/15 active:scale-95 transition-all text-on-surface-variant"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Student Profile</h1>
          <p className="font-body-md text-on-surface-variant text-sm mt-0.5">Academic Residency composite record file</p>
        </div>
      </header>

      {/* Main profile card */}
      <div className="bg-surface-container-lowest security-shadow glass-effect rounded-2xl p-6 border border-outline-variant relative overflow-hidden">
        
        {/* Visual design embellishment */}
        <div className="absolute right-0 top-0 w-28 h-28 bg-portal-primary/5 rounded-full blur-2xl -translate-y-8 translate-x-8 pointer-events-none" />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-on-surface-variant">
            <Loader2 className="w-8 h-8 animate-spin text-portal-primary" />
            <p className="text-sm font-label-md">Fetching student profile details...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-rose-600 gap-2">
            <ShieldAlert className="w-10 h-10" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-on-surface-variant gap-2">
            <User className="w-10 h-10" />
            <p className="text-sm font-semibold">No student data found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Student Hero block */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b border-outline-variant/30 text-center sm:text-left">
              <div className="w-20 h-20 rounded-full bg-portal-primary/10 border-2 border-portal-primary/20 flex items-center justify-center text-portal-primary shrink-0 shadow-inner">
                <User className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h2 className="text-xl font-headline-sm font-bold text-on-surface">{data.name ?? 'Unknown'}</h2>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">UID / ID Code: {data.uid ?? '—'}</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-portal-primary/10 border border-portal-primary/20 text-portal-primary mt-1">
                  <span>Authorized Student Resident</span>
                </div>
              </div>
            </div>

            {/* Profile parameters bento grid */}
            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant">Profile Specifications</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Email */}
                <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low flex items-start gap-3">
                  <Mail className="w-4 h-4 text-portal-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Registered Email</span>
                    <span className="text-sm font-semibold text-on-surface truncate block max-w-[240px] mt-0.5">{data.email ?? '—'}</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low flex items-start gap-3">
                  <Phone className="w-4 h-4 text-portal-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Contact Number</span>
                    <span className="text-sm font-semibold text-on-surface block mt-0.5">{data.phone ?? '—'}</span>
                  </div>
                </div>

                {/* Graduation Year */}
                <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low flex items-start gap-3">
                  <Bookmark className="w-4 h-4 text-portal-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Graduation Batch</span>
                    <span className="text-sm font-semibold text-on-surface block mt-0.5">{data.graduationYear ?? '—'} Class</span>
                  </div>
                </div>

                {/* DOB or default wing details */}
                <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-portal-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Date of Birth</span>
                    <span className="text-sm font-semibold text-on-surface block mt-0.5">
                      {data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString('en-US', { dateStyle: 'long' }) : '—'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Address */}
              {data.address && (
                <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low flex items-start gap-3 mt-4">
                  <MapPin className="w-4 h-4 text-portal-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Residential Address</span>
                    <span className="text-sm font-semibold text-on-surface block mt-0.5 leading-relaxed">{data.address}</span>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

      </div>

    </div>
  );
};

export default WardenStudentDetails;
