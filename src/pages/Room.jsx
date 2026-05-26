// src/pages/Room.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Home, LogOut, Users, UserPlus, Loader2, Building } from 'lucide-react';
import api from '@/api/studentClient'; // make sure this exists and attaches token

import useStudentComposite from '@/hooks/useStudentComposite';
import { useAuth } from '@/contexts/AuthContext';
import PageContainer from '@/components/layout/PageContainer';
import { toast } from 'sonner';
import { REQUEST_BASE, STUDENT_BASE } from '@/config';

const Room = () => {
  const { user, token: authToken } = useAuth(); // still useful for fallback; token may be provided by AuthContext
  const { data: studentComposite } = useStudentComposite({ enabled: !!user });
  // composite shape: { student, room, hostel }
  const room = studentComposite?.room ?? null;
  const student = studentComposite?.student ?? user ?? null;
  const hostel = studentComposite?.hostel ?? null;

  const [roommateNames, setRoommateNames] = useState(null); // null = loading/untouched, [] = none
  const [leaveLoading, setLeaveLoading] = useState(false);
  // new: whether a pending leave request exists for this student
  // null = unknown/loading, false = no pending leave, true = pending leave exists
  const [leaveExists, setLeaveExists] = useState(false);

  // helper to derive studentId used across the component
  const getStudentId = useCallback(() => {
    return student?.id ?? studentComposite?.student?.id ?? user?.id ?? null;
  }, [student, studentComposite, user]);

  useEffect(() => {
    // debug quick check
    // eslint-disable-next-line no-console
    console.debug('[Room] user:', user, 'studentComposite:', studentComposite);

    if (!room?.studentIds || room.studentIds.length === 0) {
      setRoommateNames([]); // no roommates
      return;
    }

    // Exclude current student from roommate list using string comparison
    const ids = room.studentIds.filter(id => String(id) !== String(student?.id));
    if (ids.length === 0) {
      setRoommateNames([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setRoommateNames(null); // mark loading
        // Get token from localStorage as a fallback if api client doesn't attach it
        const token = (() => {
          try { return localStorage.getItem('authToken'); } catch (e) { return null; }
        })();

        // helper to fetch a single name
        const fetchName = async (id) => {
          // prefer axios api client (it should attach Authorization header automatically)
          if (api && typeof api.get === 'function') {
            try {
              const res = await api.get(`/students/${id}/name`);
              // axios will return string in data or quoted string; handle both
              if (!res || !res.data) return null;
              return typeof res.data === 'string' ? res.data.replace(/^"(.*)"$/, '$1') : String(res.data);
            } catch (err) {
              // fallback to fetch with explicit header
              // eslint-disable-next-line no-console
              console.debug('[Room] api.get failed, falling back to fetch for', id, err?.response?.status);
            }
          }

          // fallback: raw fetch with explicit Authorization header
          const headers = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;
          try {
            const res = await fetch(`${STUDENT_BASE}/students/${id}/name`, {
              method: 'GET',
              headers,
            });
            if (!res.ok) {
              // eslint-disable-next-line no-console
              console.warn('[Room] fetch name failed', id, res.status);
              return null;
            }
            const text = await res.text();
            if (!text) return null;
            let s = text.trim();
            if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
              s = s.slice(1, -1);
            }
            return s;
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error('[Room] unexpected fetch error for', id, e);
            return null;
          }
        };

        const names = await Promise.all(ids.map(fetchName));
        if (cancelled) return;
        const parsed = names.filter(Boolean);
        setRoommateNames(parsed);
      } catch (err) {
        if (!cancelled) setRoommateNames([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [room?.studentIds, student?.id, studentComposite, user]);

  // new effect: check whether a pending leave request exists for this student
  useEffect(() => {
    let cancelled = false;
    const studentId = getStudentId();
    if (!studentId) {
      setLeaveExists(false);
      return;
    }

    (async () => {
      try {
        setLeaveExists(null); // loading
        const token = authToken ?? (() => { try { return localStorage.getItem('authToken'); } catch (e) { return null; } })();
        const url = `${REQUEST_BASE}/requests/exist-leave?studentId=${encodeURIComponent(studentId)}`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (cancelled) return;

        // IMPORTANT: res.ok is true for any 2xx (including 204). We only want to treat 200 as "exists".
        if (res.status === 200) {
          setLeaveExists(true);
        } else if (res.status === 204) {
          // No existing leave
          setLeaveExists(false);
        } else {
          // For other statuses treat as no existing leave but log for debugging
          // eslint-disable-next-line no-console
          console.warn('[Room] exist-leave returned unexpected status', res.status);
          setLeaveExists(false);
        }
      } catch (e) {
        // network / unexpected - do not block UI, treat as no existing leave but keep warning
        // eslint-disable-next-line no-console
        console.error('[Room] failed to check exist-leave', e);
        if (!cancelled) setLeaveExists(false);
      }
    })();

    return () => { cancelled = true; };
  }, [getStudentId, authToken]);

  const handleLeaveRequest = async () => {
    // prefer token from auth context, fallback to localStorage
    const token = authToken ?? (() => { try { return localStorage.getItem('authToken'); } catch (e) { return null; } })();

    // Determine studentId & hostelId
    const studentId = getStudentId();
    const hostelId = hostel?.id ?? student?.hostelId ?? room?.hostelId ?? null;

    if (!studentId) {
      toast.error('Cannot create leave request: no student id available');
      return;
    }

    if (!hostelId) {
      toast.error('Cannot create leave request: hostel id not available');
      return;
    }

    setLeaveLoading(true);
    try {
      const body = {
        type: 'HOSTEL_LEAVE',
        studentId,
        hostelId,
        details: { roomId: room?.id ?? null },
      };

      const res = await fetch(`${REQUEST_BASE}/requests/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        toast.error(`Leave request failed: ${res.status} ${txt ?? ''}`);
        return;
      }

      toast.success('Leave request submitted successfully');
      // mark leave exists to disable button
      setLeaveExists(true);
    } catch (err) {
      toast.error(err?.message ?? String(err));
    } finally {
      setLeaveLoading(false);
    }
  };

  // Helper to determine colorful avatar backgrounds based on roommate names
  const getAvatarBg = (name = '') => {
    const c = name ? name.charAt(0).toUpperCase() : 'A';
    if ('AEIOU'.includes(c)) return 'bg-primary-fixed text-primary';
    if ('BCDFG'.includes(c)) return 'bg-emerald-100 text-emerald-800';
    if ('HJKLM'.includes(c)) return 'bg-amber-100 text-amber-800';
    if ('NPQRS'.includes(c)) return 'bg-indigo-100 text-indigo-800';
    return 'bg-rose-100 text-rose-800';
  };

  // UI rendering fallback if !student && !room
  if (!student && !room) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-xl border border-outline-variant security-shadow max-w-[900px] mx-auto">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-label-md font-label-md text-secondary mt-4">Loading room details...</p>
        </div>
      </PageContainer>
    );
  }

  // UI rendering fallback if !room (no room allocated)
  if (!room) {
    return (
      <PageContainer>
        <div className="max-w-[900px] mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
          <header className="flex flex-col gap-1 mb-2">
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface">Room Details</h1>
              <p className="text-sm text-secondary font-body-md mt-0.5">Review your assigned hostel room, building wing, and roommates.</p>
            </div>
          </header>

          <div className="security-shadow glass-effect rounded-xl overflow-hidden bg-surface-container-lowest p-8 flex flex-col gap-4 border border-outline-variant">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-label-sm font-label-sm text-secondary uppercase tracking-wider">Room</p>
                <p className="text-headline-md font-headline-md text-on-surface mt-1">—</p>
              </div>
            </div>
            <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed">
              You currently have no room assigned. Please contact the Hostel Warden Administration for allocation.
            </p>
          </div>
        </div>
      </PageContainer>
    );
  }

  // Active room data calculations
  const roomNumber = room.roomNumber ?? room.id ?? '—';
  const hostelName = hostel?.name ?? '—';
  const seater = room.totalSeats ?? 0;
  const hostelType = `${seater}-seater${hostel?.hasAC ? ' AC' : ' NON-AC'}`;

  // Roommate list count vs vacant slots count calculation
  const roommateCount = roommateNames !== null
    ? roommateNames.length
    : (Array.isArray(room.studentIds)
      ? room.studentIds.filter(id => String(id) !== String(student?.id)).length
      : 0);

  const vacantCount = Math.max(0, Number(seater || 0) - roommateCount);

  return (
    <PageContainer>
      <div className="max-w-[900px] mx-auto flex flex-col gap-6 animate-in fade-in duration-300">

        {/* Header Section (With rich premium styling details) */}
        <header className="flex flex-col gap-1 pb-2 border-b border-outline-variant/30">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Room Details</h1>
            <p className="text-sm text-secondary font-body-md mt-0.5">Review your assigned hostel room, building wing, and roommates.</p>
          </div>
        </header>



        {/* Dynamic Two-Column Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Panel: Room Info */}
          <section className="lg:col-span-2 flex flex-col gap-6">
            <div className="security-shadow glass-effect rounded-xl overflow-hidden bg-surface-container-lowest p-8 flex flex-col gap-8">

              {/* Header inside Panel */}
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">Current Room</span>
                  <span className="font-headline-lg text-[48px] leading-tight text-primary mt-1 font-bold">{roomNumber}</span>
                </div>
              </div>

              {/* Grid details border split with premium micro-icons */}
              <div className="grid grid-cols-2 gap-8 border-y border-outline-variant/30 py-8">

                {/* Wing field */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary-fixed/60 text-primary shrink-0">
                    <Building className="w-5.5 h-5.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">Hostel Wing</span>
                    <span className="font-headline-md text-headline-md text-on-surface font-semibold">{hostelName}</span>
                  </div>
                </div>

                {/* Seater field */}
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                    <Users className="w-5.5 h-5.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">Accommodation Type</span>
                    <span className="font-body-lg text-body-lg text-secondary font-medium">{hostelType}</span>
                  </div>
                </div>

              </div>

              {/* Action Buttons Section */}
              <div className="flex justify-end">
                <button
                  onClick={handleLeaveRequest}
                  disabled={leaveLoading || leaveExists === true}
                  className={`w-full md:w-auto text-white font-label-md text-label-md px-8 py-3.5 rounded-lg flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all group ${leaveLoading
                    ? 'bg-rose-400 cursor-not-allowed opacity-80'
                    : leaveExists === true
                      ? 'bg-gray-400 cursor-not-allowed shadow-none'
                      : 'bg-[#da3737] hover:bg-[#c22d2d] shadow-[#da3737]/20 hover:scale-[1.01]'
                    }`}
                >
                  <LogOut className="w-5 h-5 shrink-0 text-white" />
                  <span>{leaveLoading ? 'Processing...' : (leaveExists === true ? 'Hostel Leave Request Sent' : 'Request Hostel Leave')}</span>
                </button>
              </div>

            </div>
          </section>

          {/* Right Panel: Roommates */}
          <section className="lg:col-span-1">
            <div className="security-shadow glass-effect rounded-xl overflow-hidden bg-surface-container-lowest p-6 h-full flex flex-col gap-6">

              {/* Card Header inside Panel */}
              <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-4">
                <Users className="w-5 h-5 text-secondary" />
                <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Roommates</h3>
              </div>

              {/* Roommate details & vacant indicator slots list */}
              <div className="flex flex-col gap-4">
                {roommateNames === null ? (
                  // Roommates Loading state
                  <div className="flex flex-col items-center justify-center py-10 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <p className="text-xs text-secondary font-label-sm">Loading roommates...</p>
                  </div>
                ) : (
                  <>
                    {/* Empty fallback */}
                    {roommateNames.length === 0 && vacantCount === 0 && (
                      <div className="text-label-sm font-label-sm text-secondary py-4 text-center">
                        No roommates assigned.
                      </div>
                    )}

                    {/* Roommates actual list */}
                    {roommateNames.map((name, idx) => {
                      const initial = name ? name.charAt(0).toUpperCase() : 'U';
                      const avatarBg = getAvatarBg(name);
                      const subtitle = idx === 0 ? 'Senior Resident' : 'Room Resident';

                      return (
                        <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container transition-colors group">
                          <div className="relative shrink-0">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${avatarBg}`}>
                              {initial}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface-container-lowest rounded-full animate-pulse"></div>
                          </div>
                          <div className="flex flex-col">
                            <p className="font-label-md text-label-md text-on-surface">{name}</p>
                            <p className="font-label-sm text-label-sm text-on-surface-variant">{subtitle}</p>
                          </div>
                        </div>
                      );
                    })}

                    {/* Vacant slots dynamically calculated based on capacity and roommates length */}
                    {Array.from({ length: vacantCount }).map((_, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-3 rounded-xl border border-dashed border-outline-variant/40 opacity-40 hover:opacity-50 transition-opacity">
                        <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant shrink-0">
                          <UserPlus className="w-5 h-5 text-secondary" />
                        </div>
                        <p className="font-label-sm text-label-sm text-secondary">Vacant Slot</p>
                      </div>
                    ))}
                  </>
                )}
              </div>

            </div>
          </section>

        </div>

      </div>
    </PageContainer>
  );
};

export default Room;
