import React, { useMemo, useState } from 'react';
import { Download, Calendar, ArrowRight, TrendingUp, Users, Percent, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

const sampleRecords = [
  { id: 1, date: '2026-05-25', present: 115, total: 120 },
  { id: 2, date: '2026-05-24', present: 118, total: 120 },
  { id: 3, date: '2026-05-23', present: 117, total: 120 }
];

const WardenAttendance = () => {
  const [records, setRecords] = useState(sampleRecords);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('05');

  const filtered = useMemo(() => {
    return records.filter(r => {
      const [year, month] = r.date.split('-');
      return year === selectedYear && month === selectedMonth;
    });
  }, [records, selectedYear, selectedMonth]);

  const exportCSV = () => {
    try {
      const rows = ['date,present,total,percent', ...filtered.map(r => `${r.date},${r.present},${r.total},${Math.round((r.present / r.total) * 100)}`)];
      const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${selectedYear}_${selectedMonth}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Attendance CSV exported successfully!');
    } catch (e) {
      toast.error('Failed to export CSV: ' + e.message);
    }
  };

  const overall = useMemo(() => {
    if (!filtered.length) return { present: 0, total: 0, percent: 0 };
    const present = filtered.reduce((s, r) => s + r.present, 0);
    const total = filtered.reduce((s, r) => s + r.total, 0);
    return { present, total, percent: Math.round((present / total) * 100) };
  }, [filtered]);

  return (
    <div className="max-w-[900px] mx-auto flex flex-col gap-6 animate-in fade-in duration-300">

      {/* Header section */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-outline-variant/30">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Attendance Registry</h1>
          <p className="font-body-md text-on-surface-variant text-sm mt-1">
            Track student check-in summaries, filter daily logs, and generate reports.
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold active:scale-[0.98] transition-all border ${filtered.length === 0
              ? 'bg-surface-container-high border-outline-variant/60 text-on-surface-variant/50 cursor-not-allowed'
              : 'bg-portal-primary hover:bg-portal-primary/95 text-white border-transparent shadow-lg shadow-portal-primary/20 hover:scale-[1.01]'
            }`}
        >
          <Download className="w-4 h-4 shrink-0" />
          <span>Export CSV</span>
        </button>
      </header>

      {/* Date Year + Month Picking Dock */}
      <div className="security-shadow glass-effect rounded-xl p-4 bg-surface-container-lowest border border-outline-variant/70 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-portal-primary" />
            <span className="font-bold text-xs uppercase tracking-wider text-on-surface-variant">Filter Period</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-on-surface-variant">Year</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="border border-outline-variant bg-surface rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-portal-primary/60 transition-all text-on-surface cursor-pointer font-semibold"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-on-surface-variant">Month</label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="border border-outline-variant bg-surface rounded-lg px-2.5 py-1.5 text-xs outline-none focus:border-portal-primary/60 transition-all text-on-surface cursor-pointer font-semibold"
            >
              <option value="01">January</option>
              <option value="02">February</option>
              <option value="03">March</option>
              <option value="04">April</option>
              <option value="05">May</option>
              <option value="06">June</option>
              <option value="07">July</option>
              <option value="08">August</option>
              <option value="09">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          </div>
        </div>


      </div>

      {/* Attendance Logs list */}
      <div className="bg-surface-container-lowest security-shadow glass-effect rounded-2xl p-6 border border-outline-variant">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant/80 mb-4 border border-outline-variant/30">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-headline-sm text-on-surface">No records found</h3>
            <p className="text-sm text-on-surface-variant mt-2">
              No attendance records found for the chosen date range. Try widening your filter parameters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant mb-2">Daily Attendance Entries</h3>

            <ul className="space-y-4">
              {filtered.map(r => {
                const percent = Math.round((r.present / r.total) * 100);

                return (
                  <li
                    key={r.id}
                    className="p-5 rounded-xl border border-outline-variant/60 bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-portal-primary/20"
                  >
                    {/* Log Date details */}
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg border text-portal-primary bg-primary-fixed border-outline-variant/40">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-on-surface">
                          {new Date(r.date).toLocaleDateString('en-US', { dateStyle: 'medium' })}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-0.5">
                          Present: <span className="font-bold text-on-surface">{r.present}</span> / Total Capacity: {r.total} students
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar & Percentage display */}
                    <div className="flex items-center gap-4 sm:w-48 justify-between">
                      <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden border border-outline-variant/10">
                        <div
                          className="bg-portal-primary h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-portal-primary whitespace-nowrap min-w-[32px] text-right">
                        {percent}%
                      </span>
                    </div>

                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

    </div>
  );
};

export default WardenAttendance;
