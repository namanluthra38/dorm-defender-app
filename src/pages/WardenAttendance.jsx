import React, { useMemo, useState } from 'react';
import { Download, Calendar } from 'lucide-react';

const sampleRecords = [
  { id: 1, date: '2025-10-25', present: 115, total: 120 },
  { id: 2, date: '2025-10-24', present: 118, total: 120 },
  { id: 3, date: '2025-10-23', present: 117, total: 120 }
];

const WardenAttendance = () => {
  const [records, setRecords] = useState(sampleRecords);
  const [fromDate, setFromDate] = useState('2025-10-23');
  const [toDate, setToDate] = useState('2025-10-25');

  const filtered = useMemo(() => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    return records.filter(r => {
      const d = new Date(r.date);
      return d >= from && d <= to;
    });
  }, [records, fromDate, toDate]);

  const exportCSV = () => {
    const rows = ['date,present,total,percent', ...filtered.map(r => `${r.date},${r.present},${r.total},${Math.round((r.present / r.total) * 100)}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const overall = useMemo(() => {
    if (!filtered.length) return { present: 0, total: 0, percent: 0 };
    const present = filtered.reduce((s, r) => s + r.present, 0);
    const total = filtered.reduce((s, r) => s + r.total, 0);
    return { present, total, percent: Math.round((present / total) * 100) };
  }, [filtered]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Attendance</h2>
          <p className="text-sm text-gray-500">View attendance summaries and export records</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 bg-amber-500 text-white px-3 py-2 rounded-md text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="mb-4 bg-white border rounded-md p-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <label className="text-sm text-gray-500">From</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">To</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
        </div>
        <div className="ml-auto text-sm text-gray-600">
          Overall: <span className="font-medium">{overall.present}/{overall.total}</span> ({overall.percent}%)
        </div>
      </div>

      <div className="bg-white border rounded-md p-4">
        {filtered.length === 0 ? (
          <div className="text-sm text-gray-500">No attendance records for the selected range.</div>
        ) : (
          <ul className="space-y-3">
            {filtered.map(r => (
              <li key={r.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{r.date}</p>
                  <p className="text-xs text-gray-400">Present: {r.present} / {r.total}</p>
                </div>
                <div className="text-sm text-gray-500">{Math.round((r.present / r.total) * 100)}%</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WardenAttendance;

