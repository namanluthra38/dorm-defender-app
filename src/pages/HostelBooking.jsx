// filepath: c:\Users\naman\HostelProject\hhfrontend\src\pages\HostelBooking.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Simple hostel booking page: lists hostels and allows making a "Request Allocation"
const HostelBooking = () => {
  const { token, user, studentComposite, logout } = useAuth();
  const navigate = useNavigate();
  const [hostels, setHostels] = useState(null); // null = loading, [] = none
  const [error, setError] = useState(null);
  const [loadingRequests, setLoadingRequests] = useState({}); // hostelId -> boolean
  const [pendingRequests, setPendingRequests] = useState({}); // hostelId -> boolean (exists)

  // Student-specific state
  const [student, setStudent] = useState(studentComposite?.student ?? null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  // Default service bases — adjust if your services run on different ports
  const HOSTEL_BASE = 'http://localhost:4001';
  const REQUEST_BASE = 'http://localhost:4003';
  const STUDENT_BASE = 'http://localhost:4000';

  // Fetch hostels
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        setHostels(null);
        const res = await fetch(`${HOSTEL_BASE}/hostels`, {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) {
          const txt = await res.text().catch(() => null);
          if (!cancelled) setError(`Failed to load hostels: ${res.status} ${txt ?? ''}`);
          if (!cancelled) setHostels([]);
          return;
        }
        const data = await res.json();
        if (!cancelled) setHostels(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message ?? String(err));
          setHostels([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  // Fetch the current student (use composite endpoint to get a student object reliably)
  useEffect(() => {
    let cancelled = false;
    const loadStudent = async () => {
      try {
        // if we already have a student from studentComposite, use it
        if (studentComposite?.student) {
          setStudent(studentComposite.student);
          return;
        }

        if (!token) return; // no auth — nothing to fetch
        setLoadingStudent(true);
        const res = await fetch(`${STUDENT_BASE}/students/me/full`, {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!res.ok) {
          // treat failure as no-student (do not block booking page entirely)
          const txt = await res.text().catch(() => null);
          if (!cancelled) setError(`Failed to load student profile: ${res.status} ${txt ?? ''}`);
          return;
        }

        const composite = await res.json().catch(() => null);
        if (!cancelled) setStudent(composite?.student ?? null);
      } catch (err) {
        if (!cancelled) setError(err?.message ?? String(err));
      } finally {
        if (!cancelled) setLoadingStudent(false);
      }
    };

    loadStudent();

    return () => { cancelled = true; };
  }, [token, studentComposite]);

  // When we have a student id and the hostels list, check per-hostel whether a pending request exists
  useEffect(() => {
    let cancelled = false;

    const studentId = student?.id ?? studentComposite?.student?.id ?? user?.id ?? null;
    if (!studentId || !hostels || hostels.length === 0) {
      // reset pendings if no data
      setPendingRequests({});
      return;
    }

    const checkAll = async () => {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const promises = hostels.map(async (h) => {
        try {
          const url = `${REQUEST_BASE}/requests/exist?studentId=${encodeURIComponent(studentId)}&hostelId=${encodeURIComponent(h.id)}`;
          const res = await fetch(url, { method: 'GET', headers });
          if (res.status === 200) return [h.id, true];
          if (res.status === 404) return [h.id, false];
          // other codes: treat as no pending but log
          const txt = await res.text().catch(() => null);
          console.warn('Unexpected response checking request existence for', h.id, res.status, txt);
          return [h.id, false];
        } catch (err) {
          console.warn('Error checking request existence for', h.id, err);
          return [h.id, false];
        }
      });

      const results = await Promise.all(promises);
      if (!cancelled) {
        const map = results.reduce((acc, [id, val]) => ({ ...acc, [id]: val }), {});
        setPendingRequests(map);
      }
    };

    checkAll();

    return () => { cancelled = true; };
  }, [hostels, student, token, studentComposite, user]);

  // Redirect students who already have a hostel to the dashboard
  useEffect(() => {
    // Wait until we've finished trying to load the student composite/profile
    const compositeStudent = studentComposite?.student ?? student;
    if (loadingStudent) return;
    if (!compositeStudent) return; // no student data yet

    const hasHostel = !!compositeStudent.hostelId;
    if (hasHostel) {
      // navigate to student dashboard (replace so back button doesn't return to booking)
      navigate('/student', { replace: true });
    }
  }, [studentComposite, student, loadingStudent, navigate]);

  const handleRequestAllocation = async (hostelId) => {
    // student id: prefer composite student, fallback to user
    const studentId = student?.id ?? studentComposite?.student?.id ?? user?.id ?? null;
    if (!studentId) {
      setError('Cannot make request: no logged-in student id available');
      return;
    }

    setLoadingRequests(prev => ({ ...prev, [hostelId]: true }));
    setError(null);

    try {
      const body = {
        type: 'HOSTEL_JOIN',
        studentId,
        details: { hostelId },
      };

      const res = await fetch(`${REQUEST_BASE}/requests/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        setError(`Request failed: ${res.status} ${txt ?? ''}`);
        return;
      }

      // Mark locally as pending so UI updates immediately
      setPendingRequests(prev => ({ ...prev, [hostelId]: true }));
      toast.success('Request allocation submitted successfully');
    } catch (err) {
      setError(err?.message ?? String(err));
    } finally {
      setLoadingRequests(prev => ({ ...prev, [hostelId]: false }));
    }
  };

  const handleLogout = () => {
    try { logout(); } catch (e) { /* ignore */ }
    navigate('/login');
  };



  // Filter hostels based on student's gender if available
  const getVisibleHostels = () => {
    if (!hostels) return hostels; // still loading
    if (!student || !student.gender) return hostels; // no gender info -> show all

    const gender = String(student.gender).trim().toLowerCase();
    if (gender.startsWith('m')) {
      // male student -> show boys hostels only
      return hostels.filter(h => !!h.isBoysHostel);
    }
    if (gender.startsWith('f')) {
      // female student -> show girls hostels only
      return hostels.filter(h => !h.isBoysHostel);
    }
    // unknown gender label -> return all
    return hostels;
  };

  const visibleHostels = getVisibleHostels();

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="ml-8 text-2xl font-semibold">Hostel Booking</h2>
          <p className="ml-8 text-sm text-gray-500">Browse available hostels and request allocation</p>
        </div>

        <div className="flex items-left ">

          <button
            onClick={handleLogout}
            className="mr-8 px-5 py-1 bg-rose-600 text-white rounded text-sm hover:bg-rose-700"
          >
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-red-600">{error}</div>
      )}

      {loadingStudent && (
        <div className="mb-4 text-gray-600">Loading your profile…</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-10 mr-10 ">
        {visibleHostels === null ? (
          <div className="col-span-full bg-white border rounded-md p-6">Loading hostels…</div>
        ) : visibleHostels.length === 0 ? (
          <div className="col-span-full bg-white border rounded-md p-6">No hostels available for your profile</div>
        ) : (
          visibleHostels.map((h) => (
            <div key={h.id} className="bg-white border rounded-md p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">{h.name ?? '—'}</h3>
                  <div className="text-sm text-gray-500">{h.isBoysHostel ? 'Boys' : 'Girls'}</div>
                </div>

                <div className="text-sm text-gray-500 mb-1">Rooms: <span className="font-medium text-gray-800">{h.numberOfRooms ?? '—'}</span></div>
                <div className="text-sm text-gray-500 mb-1">Charges / semester: <span className="font-medium text-gray-800">{h.chargesPerSemester ?? '—'}</span></div>
                <div className="text-sm text-gray-500">AC: <span className="font-medium text-gray-800">{h.hasAC ? 'Yes' : 'No'}</span></div>
              </div>

              <div className="mt-4">
                {pendingRequests[h.id] ? (
                  <button className="px-4 py-2 bg-gray-400 text-white rounded" disabled>Request Pending</button>
                ) : (
                  <button
                    className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-60"
                    onClick={() => handleRequestAllocation(h.id)}
                    disabled={!!loadingRequests[h.id]}
                  >
                    {loadingRequests[h.id] ? 'Requesting…' : 'Request Allocation'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HostelBooking;
