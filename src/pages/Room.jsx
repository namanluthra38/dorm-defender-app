// src/components/Room.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { Home } from 'lucide-react';
import api from '@/api/apiClient'; // make sure this exists and attaches token

import useStudentComposite from '@/hooks/useStudentComposite';
import { useAuth } from '@/contexts/AuthContext';
import PageContainer from '@/components/layout/PageContainer';
import { toast } from 'sonner';

const REQUEST_BASE = 'http://localhost:4003';

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
  const [leaveExists, setLeaveExists] = useState(null);

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
            const res = await fetch(`http://localhost:4000/students/${id}/name`, {
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
        if (res.ok) {
          setLeaveExists(true);
        } else if (res.status === 404) {
          setLeaveExists(false);
        } else {
          // for other errors, treat as no existing request but log for debugging
          // eslint-disable-next-line no-console
          console.warn('[Room] exist-leave returned', res.status);
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

  // UI rendering follows your original logic (unchanged)
  if (!student && !room) {
    return (
      <PageContainer>
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold">Room Details</h2>
            <p className="text-sm text-gray-500">Your current assigned room and facilities</p>
          </div>
          <div className="bg-white border rounded-md p-6">Loading room details…</div>
        </div>
      </PageContainer>
    );
  }

  if (!room) {
    return (
      <PageContainer>
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold">Room Details</h2>
            <p className="text-sm text-gray-500">Your current assigned room and facilities</p>
          </div>

          <div className="bg-white border rounded-md p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500">Room</p>
                <p className="text-xl font-semibold">—</p>
              </div>
              <Home className="w-6 h-6 text-sky-500" />
            </div>

            <div className="text-sm text-gray-500">You currently have no room assigned. Contact the warden for allocation.</div>
          </div>
        </div>
      </PageContainer>
    );
  }

  const roomNumber = room.roomNumber ?? room.id ?? '—';
  const hostelName = hostel?.name ?? '—';
  const seater = room.totalSeats ?? '—';
  const hostelType = `${seater}-seater${hostel?.hasAC ? ' AC' : ' NON-AC'}`;

  // roommateNames: null = loading, [] = none, otherwise array of names
  let roommateDisplay;
  if (roommateNames === null) {
    roommateDisplay = Array.isArray(room.studentIds) ? room.studentIds.filter(id => String(id) !== String(student?.id)).join(', ') : '—';
  } else if (roommateNames.length === 0) {
    roommateDisplay = '—';
  } else {
    roommateDisplay = roommateNames.join(", ");
  }

  const facilities = room.facilities ?? room.amenities ?? [];

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
        details: { hostelId, roomId: room?.id ?? null },
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

  return (
    <PageContainer>
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold">Room Details</h2>
          <p className="text-sm text-gray-500">Your current assigned room and facilities</p>
        </div>

        <div className="bg-white border rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">Room</p>
              <p className="text-xl font-semibold">{roomNumber}</p>
            </div>
            <Home className="w-6 h-6 text-sky-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Hostel</p>
              <p className="font-medium">{hostelName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Hostel Type</p>
              <p className="font-medium">{hostelType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Roommates</p>

              {/* Use roommateDisplay where possible to avoid unused-variable warnings */}
              {roommateNames === null ? (
                Array.isArray(room.studentIds) && room.studentIds.filter(id => String(id) !== String(student?.id)).length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {room.studentIds.filter(id => String(id) !== String(student?.id)).map((id) => (
                      <li key={String(id)} className="font-medium text-sm text-gray-700">{String(id)}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-medium">—</p>
                )
              ) : roommateDisplay === '—' ? (
                <p className="font-medium">—</p>
              ) : (
                <ul className="list-disc list-inside space-y-1">
                  {roommateNames.map((name, idx) => (
                    <li key={idx} className="font-medium">{name}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Facilities</p>
              <p className="font-medium">{facilities.length ? facilities.join(', ') : '—'}</p>
            </div>
          </div>

          {student && (
            <div className="mt-4 text-sm text-gray-500">
              <div>Assigned to: <span className="font-medium">{student.name ?? student.email ?? student.id}</span></div>
              {student.rollNumber && <div>Roll number: <span className="font-medium">{student.rollNumber}</span></div>}
              {student.phone && <div>Phone: <span className="font-medium">{student.phone}</span></div>}
            </div>
          )}
          {/* Leave Hostel button */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleLeaveRequest}
              disabled={leaveLoading || leaveExists === true}
              className={`ml-2 px-4 py-1 text-white rounded text-sm ${
                leaveLoading ? 'bg-rose-400 cursor-not-allowed' : (leaveExists === true ? 'bg-gray-400 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-700')
              }`}
            >
              {/* if leaveExists true -> show message; if loading request -> show Requesting…; otherwise normal text */}
              {leaveLoading ? 'Requesting…' : (leaveExists === true ? 'Leave request exists' : 'Request Leave')}
            </button>
          </div>
         </div>
       </div>
     </PageContainer>
   );
 };

 export default Room;
