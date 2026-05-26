import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HOSTEL_BASE, STUDENT_BASE } from '@/config';
import { ArrowLeft, Loader2, Home, User, Mail, Phone, Calendar, Sparkles, Building, Bookmark } from 'lucide-react';

const safeGetToken = () => {
  try { return localStorage.getItem('authToken'); } catch (e) { return null; }
};

const WardenRoomDetails = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);

      const token = safeGetToken();
      try {
        const url = `${HOSTEL_BASE}/hostels/rooms/${encodeURIComponent(roomId)}`;
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
          setError(`Failed to load room: ${res.status} ${txt ?? ''}`);
          setRoom(null);
          setStudents([]);
          return;
        }

        const data = await res.json();
        setRoom(data);

        // Student IDs extraction
        const rawIds = Array.isArray(data.studentIds) ? data.studentIds : (data.studentIds || []);
        const ids = rawIds
          .map(item => {
            if (!item) return null;
            if (typeof item === 'string') return item;
            if (typeof item === 'object') return item.id || item.studentId || item._id || null;
            return String(item);
          })
          .filter(Boolean);
        if (ids.length === 0) {
          setStudents([]);
          return;
        }

        // Fetch details in parallel
        const promises = ids.map(id =>
          fetch(`${STUDENT_BASE}/students/${encodeURIComponent(id)}/min`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            signal: controller.signal,
          }).then(r => {
            if (!r.ok) throw r;
            return r.json().then(obj => ({ id, ...obj }));
          }).catch(async (err) => {
            try {
              if (err?.status === 404) return { id, name: 'Unknown' };
              const nameResp = await fetch(`${STUDENT_BASE}/students/${encodeURIComponent(id)}/name`, {
                headers: {
                  'Content-Type': 'text/plain',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                signal: controller.signal,
              });
              if (nameResp.ok) {
                const txt = await nameResp.text();
                return { id, name: txt || 'Unknown' };
              }
            } catch (e) {
              // ignore
            }
            return { id, name: 'Unknown' };
          })
        );

        const settled = await Promise.all(promises);
        if (!aborted) setStudents(settled.map(s => s || { id: null, name: 'Unknown' }));

      } catch (e) {
        if (!aborted) setError(e.message ?? String(e));
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    load();
    return () => { aborted = true; controller.abort(); };
  }, [roomId]);

  const occupied = room ? Number(room.filledSeats ?? (room.studentIds ? room.studentIds.length : 0)) : 0;
  const total = room ? Number(room.totalSeats ?? 0) : 0;
  const percent = total ? Math.round((occupied / total) * 100) : 0;
  const isFull = occupied >= total;

  return (
    <div className="max-w-[800px] mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Header back button nav */}
      <header className="flex items-center gap-3 pb-2 border-b border-outline-variant/30">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 rounded-xl border border-outline-variant/75 bg-surface hover:bg-surface-variant/15 active:scale-95 transition-all text-on-surface-variant"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Room Details</h1>
          <p className="font-body-md text-on-surface-variant text-sm mt-0.5">Inspect seat allocation and residents</p>
        </div>
      </header>

      {/* Main room inspection info card */}
      <div className="bg-surface-container-lowest security-shadow glass-effect rounded-2xl p-6 border border-outline-variant">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-on-surface-variant">
            <Loader2 className="w-8 h-8 animate-spin text-portal-primary" />
            <p className="text-sm font-label-md">Loading room details...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-rose-600 gap-2">
            <Building className="w-10 h-10" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        ) : !room ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-on-surface-variant gap-2">
            <Home className="w-10 h-10" />
            <p className="text-sm font-semibold">Room not found.</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Top Room Metadata Board */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/30">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-portal-primary/10 border border-portal-primary/20 flex items-center justify-center text-portal-primary shrink-0 shadow-inner">
                  <Home className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-headline-sm font-bold text-on-surface">Room {room.roomNumber ?? room.id}</h2>
                  <p className="text-xs text-on-surface-variant font-medium mt-0.5">{total}-seater capacity</p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-right">
                <div>
                  <p className="text-xs font-bold text-portal-primary">Occupied Ratio</p>
                  <p className="text-sm font-semibold text-on-surface mt-0.5">{occupied} / {total} seats</p>
                </div>
                <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full border shrink-0 ${
                  isFull 
                    ? 'text-rose-600 bg-rose-50 border-rose-100' 
                    : occupied === 0
                      ? 'text-slate-500 bg-slate-50 border-slate-100'
                      : 'text-portal-primary bg-primary-fixed border-outline-variant/30'
                }`}>
                  {isFull ? 'Full' : occupied === 0 ? 'Empty' : `${total - occupied} Vacant`}
                </span>
              </div>
            </div>

            {/* Visual occupancy bar */}
            <div className="space-y-1.5 bg-surface p-4 rounded-xl border border-outline-variant/40">
              <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
                <span>Total Occupancy Load:</span>
                <span className="font-semibold text-portal-primary">{percent}% Capacity filled</span>
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-2.5 overflow-hidden border border-outline-variant/10">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isFull ? 'bg-rose-500' : 'bg-portal-primary'
                  }`} 
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {/* Room residents details */}
            <div className="space-y-4 pt-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-portal-primary" />
                Allocated Room Residents ({students.length})
              </h3>
              
              {students.length === 0 ? (
                <div className="p-8 text-center text-sm text-on-surface-variant bg-surface rounded-xl border border-dashed border-outline-variant/60">
                  No students are currently residing in this room.
                </div>
              ) : (
                <ul className="grid grid-cols-1 gap-4">
                  {students.map((s, idx) => (
                    <li 
                      key={s.id ?? idx} 
                      className="p-5 border border-outline-variant/60 rounded-xl bg-surface flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-portal-primary/20 shadow-sm"
                    >
                      {/* Left: Resident Profile info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-portal-primary/10 border border-portal-primary/20 flex items-center justify-center text-portal-primary shrink-0">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-on-surface leading-snug">{s.name ?? 'Unknown Student'}</p>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">UID: {s.uid ?? '—'}</span>
                        </div>
                      </div>

                      {/* Right: Resident Contact info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2 text-xs text-on-surface-variant font-medium md:text-right shrink-0">
                        {s.email && (
                          <div className="flex items-center md:justify-end gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-on-surface-variant/70" />
                            <span>{s.email}</span>
                          </div>
                        )}
                        {s.phone && (
                          <div className="flex items-center md:justify-end gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-on-surface-variant/70" />
                            <span>{s.phone}</span>
                          </div>
                        )}
                        {s.graduationYear && (
                          <div className="flex items-center md:justify-end gap-1.5">
                            <Bookmark className="w-3.5 h-3.5 text-on-surface-variant/70" />
                            <span>Graduation: {s.graduationYear} Class</span>
                          </div>
                        )}
                      </div>

                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>
        )}
      </div>

    </div>
  );
};

export default WardenRoomDetails;
