// src/components/student/StudentDashboard.jsx
import React from 'react';
import useStudentComposite from '@/hooks/useStudentComposite';
import { Building, User, MessageSquare, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentDashboard() {
  const { data: composite, isLoading, error } = useStudentComposite();
  const { studentComplaints } = useAuth();

  if (isLoading) return <div>Loading dashboard…</div>;
  if (error) return <div className="text-red-600">Failed to load dashboard</div>;

  const student = composite?.student ?? {};
  const room = composite?.room ?? null;
  const hostel = composite?.hostel ?? null;

  const complaints = studentComplaints ?? [];
  const complaintsOpen = complaints.filter(c => {
    const s = (c?.status ?? '').toString().toUpperCase();
    return s === 'OPEN' || s === 'IN_PROGRESS' || s === 'PENDING';
  }).length;

  const summary = {
    hostelName: hostel?.name ?? '-',
    room: room?.roomNumber ?? '-',
    complaintsOpen: complaintsOpen,
    announcementTitle: 'No announcements'
  };

  return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Overview</h2>
            <p className="text-sm text-gray-500">Summary of your hostel account and recent activity</p>
          </div>
          <div className="flex items-center gap-3 bg-white border rounded-md p-2">
            {/* Student profile small card */}
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">{(student?.name || student?.fullName || student?.email || 'S').charAt(0).toUpperCase()}</div>
            <div>
              <p className="text-sm font-medium">{student?.name ?? student?.fullName ?? student?.email ?? 'Student'}</p>
              {student?.email && <p className="text-xs text-gray-400">{student.email}</p>}
              <p className="text-xs text-gray-400">{hostel?.name ? `${hostel.name} • ${room?.roomNumber ?? '-'}` : (room?.roomNumber ? `Room ${room.roomNumber}` : '')}</p>
            </div>
          </div>
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
