import React, { useMemo, useState } from 'react';
import { Home, Search, Pen } from 'lucide-react';

const sampleRooms = [
  { id: 'A-101', type: '2-seater', occupancy: 2, total: 2 },
  { id: 'A-102', type: '3-seater', occupancy: 2, total: 3 },
  { id: 'B-201', type: '1-seater', occupancy: 1, total: 1 }
];

const WardenRooms = () => {
  const [query, setQuery] = useState('');
  const [rooms, setRooms] = useState(sampleRooms);
  const [minOccupancy, setMinOccupancy] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rooms.filter(r => {
      if (minOccupancy && Number(r.occupancy) < Number(minOccupancy)) return false;
      if (!q) return true;
      return (r.id + ' ' + r.type).toLowerCase().includes(q);
    });
  }, [rooms, query, minOccupancy]);

  const openManage = (id) => {
    alert(`Open management for room ${id} (implement modal/API)`);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Rooms</h2>
          <p className="text-sm text-gray-500">Manage rooms, occupancy and facilities</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center bg-gray-100 rounded-md px-3 py-1">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by room id or type" className="bg-transparent outline-none text-sm" />
          </div>
          <button onClick={() => alert('Open add room flow')} className="flex items-center gap-2 bg-sky-500 text-white px-3 py-2 rounded-md text-sm">
            <Pen className="w-4 h-4" /> Edit Rooms
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <label className="text-sm text-gray-500">Min occupancy:</label>
        <input type="number" value={minOccupancy} onChange={e => setMinOccupancy(e.target.value)} className="text-sm border rounded px-2 py-1 w-24" placeholder="e.g. 1" />
      </div>

      <div className="bg-white border rounded-md p-4">
        {filtered.length === 0 ? (
          <div className="text-sm text-gray-500">No rooms match your filters.</div>
        ) : (
          <ul className="space-y-3">
            {filtered.map(r => (
              <li key={r.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.id} <span className="text-xs text-gray-400">• {r.type}</span></p>
                  <p className="text-xs text-gray-400">Occupancy: {r.occupancy}/{r.total}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openManage(r.id)} className="px-3 py-1 rounded bg-amber-500 text-white text-sm">Manage</button>
                  <button onClick={() => alert('View room details')} className="px-3 py-1 rounded border text-sm">Details</button>
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

