// src/components/student/StudentDashboard.jsx
import React from 'react';
import useStudentComposite from '@/hooks/useStudentComposite';
import { Building, User, MessageSquare, FileText } from 'lucide-react';

export default function StudentDashboard() {
  const { data: composite, isLoading, error } = useStudentComposite();

  if (isLoading) return <div>Loading dashboard…</div>;
  if (error) return <div className="text-red-600">Failed to load dashboard</div>;

  const student = composite?.student ?? {};
  const room = composite?.room ?? null;
  const hostel = composite?.hostel ?? null;

  const summary = {
    hostelName: hostel?.name ?? '-',
    room: room?.roomNumber ?? '-',
    complaintsOpen: 1,
    announcementTitle: 'No announcements'
  };

  return (
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold">Overview</h2>
          <p className="text-sm text-gray-500">Summary of your hostel account and recent activity</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card title="Hostel" value={summary.hostelName} icon={<Building className="w-6 h-6 text-amber-500" />} />
          <Card title="Room" value={summary.room} icon={<User className="w-6 h-6 text-sky-500" />} />
          <Card title="Open Complaints" value={summary.complaintsOpen} icon={<MessageSquare className="w-6 h-6 text-rose-500" />} />
          <Card title="Latest Announcement" value={summary.announcementTitle} icon={<FileText className="w-6 h-6 text-sky-500" />} />
        </div>

        {/* Activity and lists — keep presentation only */}
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
