import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Pen } from 'lucide-react';
import useWardenLists from '@/hooks/useWardenLists';

const WardenRooms = () => {
  const navigate = useNavigate();
  const { rooms = [], isLoading } = useWardenLists();

  const [query, setQuery] = useState('');
  const [minOccupancy, setMinOccupancy] = useState('');
  const [minTotalSeats, setMinTotalSeats] = useState('');
  const [maxTotalSeats, setMaxTotalSeats] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (Array.isArray(rooms) ? rooms : []).filter(r => {
      // r.filledSeats and r.totalSeats expected from backend
      if (minOccupancy && Number(r.filledSeats) < Number(minOccupancy)) return false;
      if (minTotalSeats && Number(r.totalSeats ?? 0) < Number(minTotalSeats)) return false;
      if (maxTotalSeats && Number(r.totalSeats ?? 0) > Number(maxTotalSeats)) return false;
      if (!q) return true;
      const hay = `${r.roomNumber ?? r.id} ${(r.studentIds || []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rooms, query, minOccupancy, minTotalSeats, maxTotalSeats]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Rooms</h2>
          <p className="text-sm text-gray-500">Rooms in your hostel — see occupancy at a glance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center bg-gray-100 rounded-md px-3 py-1">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by room number"
              className="bg-transparent outline-none text-sm"
            />
          </div>
          <button onClick={() => alert('Open edit rooms (not implemented)')} className="flex items-center gap-2 bg-sky-500 text-white px-3 py-2 rounded-md text-sm">
            <Pen className="w-4 h-4" /> Edit Rooms
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Min occupied seats:</label>
          <input type="number" value={minOccupancy} onChange={e => setMinOccupancy(e.target.value)} className="text-sm border rounded px-2 py-1 w-24" placeholder="e.g. 1" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Min total seats:</label>
          <input type="number" value={minTotalSeats} onChange={e => setMinTotalSeats(e.target.value)} className="text-sm border rounded px-2 py-1 w-24" placeholder="e.g. 4" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">Max total seats:</label>
          <input type="number" value={maxTotalSeats} onChange={e => setMaxTotalSeats(e.target.value)} className="text-sm border rounded px-2 py-1 w-24" placeholder="e.g. 6" />
        </div>
      </div>

      <div className="bg-white border rounded-md p-4">
        {isLoading ? (
          <div className="text-sm text-gray-500">Loading rooms…</div>
        ) : filtered.length === 0 ? (
          <div className="text-sm text-gray-500">No rooms found for your hostel.</div>
        ) : (
          <ul className="space-y-3">
            {filtered.map(r => (
              <li key={r.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Room {r.roomNumber ?? r.id} <span className="text-xs text-gray-400">• {r.totalSeats ?? '—'} seats</span></p>
                  <p className="text-xs text-gray-400">Occupied: {r.filledSeats ?? (r.studentIds ? r.studentIds.length : 0)}/{r.totalSeats ?? '—'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/warden/rooms/${r.id}`)} className="px-3 py-1 rounded bg-sky-600 text-white text-sm">Details</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WardenRooms;
