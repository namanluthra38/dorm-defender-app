import React, { useMemo, useState, useEffect } from 'react';
import { Search, X, Loader2, User, Building, Phone, Mail, ArrowRight, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useWardenLists from '@/hooks/useWardenLists';

const WardenStudents = () => {
  const navigate = useNavigate();
  const { students = [], rooms = [], isLoading } = useWardenLists();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Normalize students by attaching roomNumber using rooms from the hook
  const normalizedStudents = useMemo(() => {
    const roomMap = (Array.isArray(rooms) ? rooms : []).reduce((acc, room) => {
      if (room && room.id) acc[String(room.id)] = room.roomNumber;
      return acc;
    }, {});
    return (Array.isArray(students) ? students : []).map(s => ({
      ...s,
      roomNumber: s.roomId ? roomMap[String(s.roomId)] ?? s.roomNumber : s.roomNumber
    }));
  }, [students, rooms]);

  // Debounce the query to avoid frequent re-filtering while user types
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const filtered = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    const list = normalizedStudents.slice();
    
    // Sort by roomNumber if present (numeric), else by roomId/string
    list.sort((a, b) => {
      const ar = a.roomId || a.room || '';
      const br = b.roomId || b.room || '';
      const an = parseInt(String(a.roomNumber ?? a.room ?? '').replace(/[^0-9]/g, ''), 10);
      const bn = parseInt(String(b.roomNumber ?? b.room ?? '').replace(/[^0-9]/g, ''), 10);
      if (!isNaN(an) && !isNaN(bn)) return an - bn;
      if (!isNaN(an) && isNaN(bn)) return -1;
      if (isNaN(an) && !isNaN(bn)) return 1;
      return String(ar).localeCompare(String(br));
    });
    
    if (!q) return list;
    return list.filter(s => {
      const hay = `${s.name ?? ''} ${s.uid ?? s.id ?? ''} ${s.roomNumber ?? s.roomId ?? s.room ?? ''} ${s.email ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [normalizedStudents, debouncedQuery]);

  return (
    <div className="max-w-[1000px] mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-outline-variant/30">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Residency Directory</h1>
          <p className="font-body-md text-on-surface-variant text-sm mt-1">
            Search, filter, and review student profiles residing in your allocated hostels.
          </p>
        </div>

        {/* Branded Search input */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/70" />
          <input 
            type="text" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, UID, room..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-portal-primary/60 transition-all text-on-surface"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-on-surface-variant/80 hover:bg-surface-variant/15 rounded-full transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Stats Board */}
      {!isLoading && students.length > 0 && (
        <div className="flex items-center gap-3 self-start bg-surface-container-high/40 border border-outline-variant/30 px-4 py-2 rounded-xl text-xs font-semibold text-on-surface-variant">
          <UserCheck className="w-4 h-4 text-portal-primary" />
          <span>Active Registry Directory: <span className="font-bold text-on-surface">{filtered.length} students</span> filtered ({students.length} total)</span>
        </div>
      )}

      {/* Directory Grid */}
      <div className="bg-surface-container-lowest security-shadow glass-effect rounded-2xl p-6 border border-outline-variant">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
            <Loader2 className="w-8 h-8 animate-spin text-portal-primary" />
            <p className="text-sm font-label-md">Loading registry directory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant/80 mb-4 border border-outline-variant/30">
              <User className="w-6 h-6" />
            </div>
            <h3 className="font-headline-sm text-on-surface">No students found</h3>
            <p className="text-sm text-on-surface-variant mt-2">
              We couldn't find any residents matching your active search query criteria.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(s => (
              <li 
                key={s.id}
                className="security-shadow glass-effect rounded-xl border border-outline-variant bg-surface p-5 hover:border-portal-primary/30 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top profile banner */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-portal-primary/10 border border-portal-primary/20 flex items-center justify-center text-portal-primary shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-on-surface line-clamp-1 leading-snug">{s.name}</h3>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">UID: {s.uid ?? s.id}</span>
                    </div>
                  </div>

                  {/* Student location and contacts */}
                  <div className="space-y-2 text-xs text-on-surface-variant font-medium mb-4">
                    <div className="flex items-center gap-2 text-portal-primary font-bold bg-portal-primary/5 border border-portal-primary/10 rounded-lg p-2.5">
                      <Building className="w-3.5 h-3.5 shrink-0" />
                      <span>Allocated: {s.roomNumber ? `Room ${s.roomNumber}` : s.roomId ? `Room ID: ${s.roomId}` : 'Unassigned'}</span>
                    </div>
                    {s.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-on-surface-variant/70 shrink-0" />
                        <span className="truncate">{s.email}</span>
                      </div>
                    )}
                    {s.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-on-surface-variant/70 shrink-0" />
                        <span>{s.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Inspect Action */}
                <div className="border-t border-outline-variant/20 pt-4 mt-auto">
                  <button 
                    onClick={() => navigate(`/warden/students/${s.id}`)}
                    className="w-full flex items-center justify-center gap-1.5 bg-portal-primary hover:bg-portal-primary/95 text-white font-semibold text-xs py-2.5 rounded-lg active:scale-[0.98] shadow-md shadow-portal-primary/10 transition-all hover:scale-[1.01]"
                  >
                    <span>View Full Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
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
