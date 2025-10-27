// javascript
import React, { useEffect, useState } from 'react';
import { Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Room = () => {
  const { studentComposite, user, token } = useAuth();

  // studentComposite expected shape: { student, room, hostel }
  const room = studentComposite?.room ?? null;
  const student = studentComposite?.student ?? user ?? null;
  const hostel = studentComposite?.hostel ?? null;

  const [roommateNames, setRoommateNames] = useState(null); // null = loading/untouched, [] = none

  useEffect(() => {
    if (!room?.studentIds || room.studentIds.length === 0) {
      setRoommateNames([]);
      return;
    }

    // Exclude current student from roommate list
    const ids = room.studentIds.filter(id => id !== student?.id);

    if (ids.length === 0) {
      setRoommateNames([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        console.debug('Room: fetching names for', ids, 'with token?', !!token);

        const names = await Promise.all(
          ids.map(async (id) => {
            try {
              console.debug('Room: fetching name for', id, 'with token?', !!token);

              // First try: Bearer token in Authorization header, no credentials
              let res = await fetch(`http://localhost:4000/students/${id}/name`, {
                method: 'GET',
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              });

              // If unauthorized and we didn't include credentials, retry with credentials (cookie-based auth)
              if (res.status === 401) {
                console.debug('Room: 401 with bearer token, retrying with credentials for', id);
                try {
                  res = await fetch(`http://localhost:4000/students/${id}/name`, {
                    method: 'GET',
                    credentials: 'include',
                  });
                } catch (innerErr) {
                  console.warn('Room: retry with credentials failed for', id, innerErr);
                }
              }

              if (!res.ok) {
                console.warn('Room: failed to fetch name for', id, 'status', res.status);
                // treat auth/forbidden as missing name (don't throw) so UI can continue showing ids
                return null;
              }

              const text = await res.text();
              if (!text) return null;
              let s = text.trim();
              if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
                s = s.slice(1, -1);
              }
              return s;
            } catch (err) {
              console.error('Room: unexpected error fetching name for', id, err);
              return null;
            }
          })
        );

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
  }, [room?.studentIds, student?.id]);

  if (!student && !room) {
    return (
        <div>
          <div className="mb-4">
            <h2 className="text-2xl font-semibold">Room Details</h2>
            <p className="text-sm text-gray-500">Your current assigned room and facilities</p>
          </div>
          <div className="bg-white border rounded-md p-6">Loading room details…</div>
        </div>
    );
  }

  if (!room) {
    return (
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
    );
  }

  const roomNumber = room.roomNumber ?? room.id ?? '—';
  const hostelName = hostel?.name ?? '—';
  const seater = room.totalSeats ?? '—';
  const hostelType = `${seater}-seater${hostel?.hasAC ? ' AC' : ' NON-AC'}`;

  // roommateNames: null = loading, [] = none, otherwise array of names
  let roommateDisplay;
  if (roommateNames === null) {
    // still loading names — show IDs as temporary fallback
    roommateDisplay = Array.isArray(room.studentIds) ? room.studentIds.join(', ') : '—';
  } else if (roommateNames.length === 0) {
    roommateDisplay = '—';
  } else {
    roommateDisplay = roommateNames.join(", ");
  }

  const facilities = room.facilities ?? room.amenities ?? [];

  return (
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
              {/* Show roommates as a list when names are available; otherwise fall back to ids or — */}
              {roommateNames === null ? (
                // loading: show IDs as a list so layout doesn't jump and to avoid comma-separated display
                Array.isArray(room.studentIds) && room.studentIds.filter(id => id !== student?.id).length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {room.studentIds.filter(id => id !== student?.id).map((id) => (
                      <li key={id} className="font-medium text-sm text-gray-700">{id}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-medium">—</p>
                )
              ) : roommateNames.length === 0 ? (
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
        </div>
      </div>
  );
};

export default Room;

