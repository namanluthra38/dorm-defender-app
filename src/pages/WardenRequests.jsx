import React, { useMemo, useState } from 'react';

const sampleRequests = [
  { id: 'R-301', student: 'Alice Johnson', type: 'Room change', status: 'Pending', details: 'Requesting room change to A-102 due to medical reasons.' },
  { id: 'R-302', student: 'Bob Smith', type: 'Leave request', status: 'Approved', details: 'Leave for personal reasons from 2025-11-01 to 2025-11-05.' }
];

const WardenRequests = () => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requests, setRequests] = useState(sampleRequests);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter(r => {
      if (statusFilter !== 'all' && r.status.toLowerCase() !== statusFilter) return false;
      if (!q) return true;
      return (r.id + ' ' + r.student + ' ' + r.type + ' ' + r.details).toLowerCase().includes(q);
    });
  }, [requests, query, statusFilter]);

  const updateStatus = (id, newStatus) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Requests</h2>
          <p className="text-sm text-gray-500">Review student requests and approve or deny them</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center bg-gray-100 rounded-md px-3 py-1">
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search requests" className="bg-transparent outline-none text-sm" />
          </div>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <label className="text-sm text-gray-500">Filter:</label>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-sm border rounded px-2 py-1">
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
        </select>
      </div>

      <div className="bg-white border rounded-md p-4">
        {filtered.length === 0 ? (
          <div className="text-sm text-gray-500">No requests found for the chosen filter/search.</div>
        ) : (
          <ul className="space-y-3">
            {filtered.map(r => (
              <li key={r.id} className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{r.type} — {r.student}</p>
                  <p className="text-xs text-gray-400">{r.id} • {r.status}</p>
                  <p className="text-sm text-gray-700 mt-2">{r.details}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-xs text-gray-500">Actions</div>
                  <div className="flex gap-2">
                    <button onClick={() => updateStatus(r.id, 'Approved')} className="px-3 py-1 rounded bg-emerald-600 text-white text-sm">Approve</button>
                    <button onClick={() => updateStatus(r.id, 'Denied')} className="px-3 py-1 rounded bg-rose-600 text-white text-sm">Deny</button>
                    <button onClick={() => alert('Open request details modal')} className="px-3 py-1 rounded border text-sm">Details</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WardenRequests;

