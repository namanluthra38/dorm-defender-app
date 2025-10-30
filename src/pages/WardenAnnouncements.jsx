import React from 'react';
import { PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WardenAnnouncements = () => {
  const navigate = useNavigate();
  const announcements = [
    { id: 1, title: 'Orientation schedule', date: '2025-10-20', body: 'Orientation for new students on 1st Nov at 10:00 AM in the main hall.' },
    { id: 2, title: 'Water outage', date: '2025-10-18', body: 'Water supply will be interrupted for maintenance on 28th Oct from 10:00 to 16:00.' }
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Announcements</h2>
          <p className="text-sm text-gray-500">Create and manage announcements for your hostels</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-sky-500 text-white px-3 py-2 rounded-md text-sm" onClick={() => navigate('new')}>
            <PlusCircle className="w-4 h-4" /> New Announcement
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-md p-4">
        <ul className="space-y-4">
          {announcements.map(a => (
            <li key={a.id} className="border-b pb-3">
              <p className="font-medium">{a.title}</p>
              <p className="text-xs text-gray-400">{a.date}</p>
              <p className="text-sm mt-2 text-gray-700">{a.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WardenAnnouncements;

