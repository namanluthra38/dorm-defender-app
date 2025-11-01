import React from 'react';
import useWardenComposite from '@/hooks/useWardenComposite';
import { Building, Users, MessageSquare, FileText } from 'lucide-react';

export default function WardenDashboard() {
  const { data: composite, isLoading, error, refetch } = useWardenComposite();

  if (isLoading) return <div>Loading dashboard…</div>;
  if (error) return <div className="text-rose-600">Failed to load dashboard</div>;

  const warden = composite?.warden ?? {};
  const hostels = composite?.hostels ?? [];
  const studentsTotal = composite?.studentsTotal ?? warden?.studentsTotal ?? 0;
  const openRequests = composite?.openRequests ?? 0;
  const latestAnnouncement = composite?.latestAnnouncement ?? (composite?.announcements?.[0]?.title ?? 'No announcements');

  const summary = {
    hostelsManaged: hostels.length,
    studentsTotal,
    openRequests,
    announcementTitle: latestAnnouncement
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Warden Overview</h2>
        <p className="text-sm text-gray-500">Summary for your managed hostels and requests</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card title="Hostels" value={summary.hostelsManaged} icon={<Building className="w-6 h-6 text-amber-500" />} />
        <Card title="Students" value={summary.studentsTotal} icon={<Users className="w-6 h-6 text-sky-500" />} />
        <Card title="Open Requests" value={summary.openRequests} icon={<MessageSquare className="w-6 h-6 text-rose-500" />} />
        <Card title="Latest Announcement" value={summary.announcementTitle} icon={<FileText className="w-6 h-6 text-sky-500" />} />
      </div>

      <div className="bg-white border rounded-md p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Managed Hostels</h3>
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="px-3 py-2 rounded border text-sm">Refresh</button>
          </div>
        </div>
        {hostels.length === 0 ? (
          <p className="text-sm text-gray-500">You are not assigned to any hostel.</p>
        ) : (
          <ul className="space-y-2">
            {hostels.map((h) => (
              <li key={h.id} className="p-2 border rounded flex items-center justify-between">
                <div>
                  <p className="font-medium">{h.name}</p>
                  <p className="text-xs text-gray-400">Rooms: {h.numberOfRooms ?? '-'}</p>
                </div>
                <div className="text-sm text-gray-500">{h.isBoysHostel ? 'Boys' : 'Girls'}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white border rounded-md p-4">
          <h4 className="font-semibold mb-3">Recent Announcements</h4>
          <ul className="space-y-2">
            {(composite?.announcements ?? []).map((ann) => (
              <li key={ann.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{ann.title}</p>
                  <p className="text-xs text-gray-400">{ann.date ?? ''}</p>
                </div>
              </li>
            ))}
            {(composite?.announcements ?? []).length === 0 && <li className="text-sm text-gray-500">No announcements</li>}
          </ul>
        </div>

        <div className="bg-white border rounded-md p-4">
          <h4 className="font-semibold mb-3">Pending Requests</h4>
          <p className="text-sm text-gray-500">You have {summary.openRequests} open requests to review</p>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, icon }) {
  return (
    <div className="bg-white border rounded-md p-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
      <div>{icon}</div>
    </div>
  );
}
