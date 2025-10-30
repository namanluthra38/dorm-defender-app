import React from 'react';
import { Building, Users, MessageSquare, FileText, CheckCircle } from 'lucide-react';
import useWardenDetails from '@/hooks/useWardenDetails';

const WardenDashboard = () => {
  const { data: warden, loading, error, refresh } = useWardenDetails();

  // derive summary from warden profile when available, otherwise fall back to defaults
  const summary = {
    hostelsManaged: Array.isArray(warden?.hostels) ? warden.hostels.length : (warden?.hostels ? 1 : 1),
    studentsTotal: warden?.studentsTotal ?? 120,
    openRequests: warden?.openRequests ?? 5,
    announcementTitle: warden?.latestAnnouncement ?? 'Welcome new students — orientation schedule posted'
  };

  const activities = warden?.recentActivity ?? [
    { id: 1, text: 'Approved room change for A-102', time: '1 day ago' },
    { id: 2, text: 'Created announcement: Orientation', time: '3 days ago' }
  ];

  const announcements = warden?.announcements ?? [
    { id: 1, title: 'Orientation: 1st Nov', date: '2025-10-20' },
    { id: 2, title: 'Maintenance: Water supply', date: '2025-10-18' }
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Warden Dashboard</h2>
          <p className="text-sm text-gray-500">Overview of hostels and student activity</p>
          {loading && <div className="text-xs text-gray-400 mt-1">Loading profile…</div>}
          {error && <div className="text-xs text-rose-600 mt-1">Failed to load profile: {error.message}</div>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refresh()} className="px-3 py-2 rounded border text-sm">Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-md p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Hostels</p>
            <p className="text-xl font-semibold">{summary.hostelsManaged}</p>
          </div>
          <Building className="w-6 h-6 text-amber-500" />
        </div>

        <div className="bg-white border rounded-md p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Students</p>
            <p className="text-xl font-semibold">{summary.studentsTotal}</p>
          </div>
          <Users className="w-6 h-6 text-sky-500" />
        </div>

        <div className="bg-white border rounded-md p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Open Requests</p>
            <p className="text-xl font-semibold">{summary.openRequests}</p>
          </div>
          <MessageSquare className="w-6 h-6 text-rose-500" />
        </div>

        <div className="bg-white border rounded-md p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Latest Announcement</p>
            <p className="text-xl font-semibold">{summary.announcementTitle}</p>
          </div>
          <FileText className="w-6 h-6 text-sky-500" />
        </div>
      </div>

      <div className="bg-white border rounded-md p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Recent Activity</h3>
          <p className="text-sm text-gray-500">Showing last 7 days</p>
        </div>
        <ul className="space-y-3">
          {activities.map((a) => (
            <li key={a.id} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
              <div>
                <p className="text-sm">{a.text}</p>
                <p className="text-xs text-gray-400">{a.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white border rounded-md p-4">
          <h4 className="font-semibold mb-3">Recent Announcements</h4>
          <ul className="space-y-2">
            {announcements.map((ann) => (
              <li key={ann.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{ann.title}</p>
                  <p className="text-xs text-gray-400">{ann.date}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border rounded-md p-4">
          <h4 className="font-semibold mb-3">Pending Requests</h4>
          <p className="text-sm text-gray-500">You have {summary.openRequests} open requests to review</p>
        </div>
      </div>
    </div>
  );
};

export default WardenDashboard;
