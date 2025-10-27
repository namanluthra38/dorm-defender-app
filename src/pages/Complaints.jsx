import React from 'react';
import { MessageSquare, PlusCircle } from 'lucide-react';

const Complaints = () => {
  const complaints = [
    { id: 'C-101', title: 'Water leakage in bathroom', status: 'Open', date: '2025-10-15' },
    { id: 'C-099', title: 'Broken study table', status: 'Resolved', date: '2025-09-30' }
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Complaints</h2>
          <p className="text-sm text-gray-500">View and manage your complaints</p>
        </div>
        <button className="flex items-center gap-2 bg-rose-500 text-white px-3 py-2 rounded-md text-sm" onClick={() => alert('Open complaint modal')}>
          <PlusCircle className="w-4 h-4" /> New Complaint
        </button>
      </div>

      <div className="bg-white border rounded-md p-4">
        <ul className="space-y-3">
          {complaints.map(c => (
            <li key={c.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{c.title}</p>
                <p className="text-xs text-gray-400">{c.date} • {c.status}</p>
              </div>
              <div className="text-sm text-gray-500">{c.id}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Complaints;
