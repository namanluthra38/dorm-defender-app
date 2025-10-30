import React, { useMemo, useState } from 'react';
import { Users, PlusCircle, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const sampleStudents = [
  { id: 'S-101', name: 'Alice Johnson', room: 'A-101', email: 'alice@example.com' },
  { id: 'S-102', name: 'Bob Smith', room: 'A-102', email: 'bob@example.com' },
  { id: 'S-103', name: 'Charlie Rao', room: 'B-201', email: 'charlie@example.com' }
];

const WardenStudents = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [students] = useState(sampleStudents);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(s => (s.name + ' ' + s.id + ' ' + s.room + ' ' + s.email).toLowerCase().includes(q));
  }, [query, students]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Students</h2>
          <p className="text-sm text-gray-500">Search and manage students in your hostels</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center bg-gray-100 rounded-md px-3 py-1">
            <Search className="w-4 h-4 text-gray-400 mr-2" />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name, id or room" className="bg-transparent outline-none text-sm" />
          </div>
          <button className="flex items-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-md text-sm" onClick={() => navigate('students/new')}>
            <PlusCircle className="w-4 h-4" /> Add Student
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-md p-4">
        {filtered.length === 0 ? (
          <div className="text-sm text-gray-500">No students found. Try a different search or add a new student.</div>
        ) : (
          <ul className="divide-y">
            {filtered.map(s => (
              <li key={s.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{s.name} <span className="text-xs text-gray-400">({s.id})</span></p>
                  <p className="text-xs text-gray-400">{s.email} • Room: {s.room}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/warden/students/${s.id}`)} className="px-3 py-1 rounded bg-sky-500 text-white text-sm">View</button>
                  <button onClick={() => alert('Open edit student modal')} className="px-3 py-1 rounded border text-sm">Edit</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default WardenStudents;

