import React from 'react';
import { User, DollarSign, MessageSquare, FileText, CheckCircle } from 'lucide-react';

const StudentDashboard = () => {
  const summary = {
    room: 'A-302',
    due: 1250.0,
    complaintsOpen: 1,
    announcementTitle: 'Mess menu updated for next week'
  };

  const activities = [
    { id: 1, text: 'Payment received: INR 3,000', time: '2 days ago' },
    { id: 2, text: 'Complaint resolved: Broken table', time: '3 days ago' }
  ];

  const announcements = [
    { id: 1, title: 'Mess timings updated', date: '2025-10-20' },
    { id: 2, title: 'Power shutdown on 28th Oct', date: '2025-10-18' }
  ];

  const complaints = [
    { id: 'C-101', title: 'Water leakage in bathroom', status: 'Open', date: '2025-10-15' }
  ];

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Overview</h2>
        <p className="text-sm text-gray-500">Summary of your hostel account and recent activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-md p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Room</p>
            <p className="text-xl font-semibold">{summary.room}</p>
          </div>
          <User className="w-6 h-6 text-sky-500" />
        </div>

        <div className="bg-white border rounded-md p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Due Amount</p>
            <p className="text-xl font-semibold">₹{summary.due.toFixed(2)}</p>
          </div>
          <DollarSign className="w-6 h-6 text-amber-500" />
        </div>

        <div className="bg-white border rounded-md p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Open Complaints</p>
            <p className="text-xl font-semibold">{summary.complaintsOpen}</p>
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
          <h4 className="font-semibold mb-3">Recent Complaints</h4>
          <ul className="space-y-2">
            {complaints.map((c) => (
              <li key={c.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-gray-400">{c.date} • {c.status}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
