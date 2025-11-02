import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HOSTEL_BASE, STUDENT_BASE } from '@/config';
import { ArrowLeft } from 'lucide-react';

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

        // student ids may be in studentIds or studentIds array
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

        // fetch min-details for each student in parallel (resilient)
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
            // fallback: try name-only endpoint for at least a name
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

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded border bg-white">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-2xl font-semibold">Room details</h2>
            <p className="text-sm text-gray-500">Students residing in this room</p>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-md p-4">
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : error ? (
          <div className="text-sm text-rose-600">{error}</div>
        ) : !room ? (
          <div className="text-sm text-gray-500">Room not found.</div>
        ) : (
          <div>
            <div className="mb-4">
              <p className="font-medium">Room {room.roomNumber ?? room.id} <span className="text-xs text-gray-400">• {room.totalSeats ?? '—'} seats</span></p>
              <p className="text-xs text-gray-400">Occupied: {room.filledSeats ?? (room.studentIds ? room.studentIds.length : 0)}/{room.totalSeats ?? '—'}</p>
            </div>

            {students.length === 0 ? (
              <div className="text-sm text-gray-500">No students found for this room.</div>
            ) : (
              <ul className="space-y-3">
                {students.map((s, idx) => (
                  <li key={s.id ?? idx} className="p-3 border rounded flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{s.name ?? 'Unknown'}</p>
                      <p className="text-sm text-gray-500">UID: {s.uid ?? '—'} • {s.email ?? '—'}</p>
                    </div>
                    <div className="mt-2 md:mt-0 text-sm text-gray-600">
                      <div>Graduation Year: {s.graduationYear ?? '—'}</div>
                      <div>Phone: {s.phone ?? '—'}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WardenRoomDetails;
