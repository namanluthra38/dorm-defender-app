import React from 'react';
import useWardenComposite from '@/hooks/useWardenComposite';
import useWardenLists from '@/hooks/useWardenLists';
import { Building, Users, MessageSquare, FileText } from 'lucide-react';

export default function WardenDashboard() {
  const { data: composite, isLoading, error, refetch } = useWardenComposite();
  const { requests, rooms, students, isLoading: listsLoading, isError: listsError, refetchAll } = useWardenLists();

  const loading = isLoading || listsLoading;
  if (loading) return <div>Loading dashboard…</div>;
  if (error || listsError) return <div className="text-rose-600">Failed to load dashboard</div>;

  const warden = composite?.warden ?? {};
  const hostels = composite?.hostels ?? [];

  // remove primary-hostel behavior and instead look for hostel with id === 0
  const hostelZero = hostels.find(h => String(h.id) === '0' || Number(h.id) === 0);
  const hostelZeroName = hostelZero ? (hostelZero.name ?? hostelZero.id) : null;

  // Prefer live lists data for counts; fall back to composite/warden totals when lists are not available
  const studentsCount = Array.isArray(students) ? students.length : (composite?.studentsTotal ?? warden?.studentsTotal ?? 0);
  const roomsCount = Array.isArray(rooms) ? rooms.length : 0;
  const openRequests = Array.isArray(requests) ? requests.filter(r => String(r.status || '').toLowerCase() === 'pending').length : (composite?.openRequests ?? 0);
  const latestAnnouncement = composite?.latestAnnouncement ?? (composite?.announcements?.[0]?.title ?? 'No announcements');

  const summary = {
    hostelsManaged: hostels.length,
    studentsTotal: studentsCount,
    openRequests,
    roomsTotal: roomsCount,
    announcementTitle: latestAnnouncement,
  };

  const wardenDisplayName = warden?.name ?? warden?.fullName ?? warden?.email ?? 'Warden';
  const wardenInitial = (wardenDisplayName && wardenDisplayName.length > 0) ? wardenDisplayName.charAt(0).toUpperCase() : 'W';
  const hostelName = composite.hostel.name ??  'No hostel assigned';
  return (
    <div>
      {/* Hostel header + small warden profile */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Warden Overview</h2>
          <p className="text-sm text-gray-500">Summary for your managed hostels and requests</p>

        </div>
        <div className="flex items-center gap-3 bg-white border rounded-md p-2">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">{wardenInitial}</div>
          <div>
            <p className="text-sm font-medium">{wardenDisplayName}</p>
            {warden?.email && <p className="text-xs text-gray-400">{warden.email}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card title="Hostel" value={hostelName} icon={<Building className="w-6 h-6 text-amber-500" />} />
        <Card title="Students" value={summary.studentsTotal} icon={<Users className="w-6 h-6 text-sky-500" />} />
        <Card title="Open Requests" value={summary.openRequests} icon={<MessageSquare className="w-6 h-6 text-rose-500" />} />
        <Card title="Rooms" value={summary.roomsTotal} icon={<FileText className="w-6 h-6 text-sky-500" />} />
      </div>

      <div className="bg-white border rounded-md p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Managed Hostels</h3>
          <div className="flex items-center gap-2">
            <button onClick={async () => { await refetch(); await refetchAll(); }} className="px-3 py-2 rounded border text-sm">Refresh</button>
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
