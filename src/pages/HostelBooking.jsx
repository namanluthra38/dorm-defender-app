
// filepath: c:\Users\naman\HostelProject\hhfrontend\src\pages\HostelBooking.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Simple hostel booking page: lists hostels and allows making a "Request Allocation"
const HostelBooking = () => {
  const { token, user, studentComposite } = useAuth();
  const [hostels, setHostels] = useState(null); // null = loading, [] = none
  const [error, setError] = useState(null);
  const [loadingRequests, setLoadingRequests] = useState({}); // hostelId -> boolean

  // Default hostel service base — adjust if your hostel-service runs on a different port
  const HOSTEL_BASE = 'http://localhost:4001';
  const REQUEST_BASE = 'http://localhost:4003';

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

  const handleRequestAllocation = async (hostelId) => {
    // student id: prefer composite student, fallback to user
    const studentId = studentComposite?.student?.id ?? user?.id ?? null;
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

      const res = await fetch(`${REQUEST_BASE}/requests`, {
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

      // success - optionally read response
      // const respJson = await res.json().catch(() => null);
      alert('Request allocation submitted successfully');
    } catch (err) {
      setError(err?.message ?? String(err));
    } finally {
      setLoadingRequests(prev => ({ ...prev, [hostelId]: false }));
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Hostel Booking</h2>
        <p className="text-sm text-gray-500">Browse available hostels and request allocation</p>
      </div>

      {error && (
        <div className="mb-4 text-red-600">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hostels === null ? (
          <div className="col-span-full bg-white border rounded-md p-6">Loading hostels…</div>
        ) : hostels.length === 0 ? (
          <div className="col-span-full bg-white border rounded-md p-6">No hostels available</div>
        ) : (
          hostels.map((h) => (
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
                <button
                  className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 disabled:opacity-60"
                  onClick={() => handleRequestAllocation(h.id)}
                  disabled={!!loadingRequests[h.id]}
                >
                  {loadingRequests[h.id] ? 'Requesting…' : 'Request Allocation'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HostelBooking;

