import React from 'react';
import PageContainer from '@/components/layout/PageContainer';

const Announcements = () => {
  const announcements = [
    { id: 1, title: 'Mess timings updated', date: '2025-10-20', body: 'Mess timings will be 7:30-9:30 for breakfast...' },
    { id: 2, title: 'Power shutdown on 28th Oct', date: '2025-10-18', body: 'Power shutdown for maintenance from 10:00 to 16:00.' }
  ];

  return (
    <PageContainer>
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold">Announcements</h2>
          <p className="text-sm text-gray-500">Latest messages from hostel administration</p>
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
    </PageContainer>
  );
};

export default Announcements;
