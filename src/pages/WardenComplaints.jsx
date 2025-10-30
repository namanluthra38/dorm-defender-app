import React, { useMemo, useState } from 'react';
import { MessageSquare, PlusCircle } from 'lucide-react';

const sampleComplaints = [
  { id: 'C-201', title: 'Leaking roof in C-block', status: 'Open', date: '2025-10-22', details: 'Water leaking from ceiling in room C-203.' },
  { id: 'C-198', title: 'Mess food quality', status: 'Under Review', date: '2025-10-10', details: 'Multiple students reported stale food.' }
];

const WardenComplaints = () => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [complaints, setComplaints] = useState(sampleComplaints);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return complaints.filter(c => {
      if (statusFilter !== 'all' && c.status.toLowerCase() !== statusFilter) return false;
      if (!q) return true;
      return (c.title + ' ' + c.id + ' ' + c.details).toLowerCase().includes(q);
    });
  }, [complaints, query, statusFilter]);

  const markResolved = (id) => {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'Resolved' } : c));
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Complaints</h2>
          <p className="text-sm text-gray-500">Overview of student complaints — you can mark items resolved or open investigations</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center bg-gray-100 rounded-md px-3 py-1">
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search complaints" className="bg-transparent outline-none text-sm" />
          </div>
          <button className="flex items-center gap-2 bg-rose-500 text-white px-3 py-2 rounded-md text-sm" onClick={() => alert('Open new complaint flow')}>
            <PlusCircle className="w-4 h-4" /> New Complaint
          </button>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <label className="text-sm text-gray-500">Filter:</label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border rounded px-2 py-1">
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="under review">Under Review</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="bg-white border rounded-md p-4">
        {filtered.length === 0 ? (
          <div className="text-sm text-gray-500">No complaints match the filter/search.</div>
        ) : (
          <ul className="space-y-3">
            {filtered.map(c => (
              <li key={c.id} className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-gray-400">{c.date} • {c.status}</p>
                  <p className="text-sm text-gray-700 mt-2">{c.details}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {c.status !== 'Resolved' ? (
                    <button onClick={() => markResolved(c.id)} className="px-3 py-1 rounded bg-green-600 text-white text-sm">Mark Resolved</button>
                  ) : (
                    <div className="text-xs text-gray-500">Resolved</div>
                  )}
                  <button onClick={() => alert('Open complaint details modal')} className="px-3 py-1 rounded border text-sm">Details</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WardenComplaints;

