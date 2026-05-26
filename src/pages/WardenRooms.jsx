import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Pen, Home, Users, ChevronRight, BarChart3, Filter } from 'lucide-react';
import useWardenLists from '@/hooks/useWardenLists';

const WardenRooms = () => {
  const navigate = useNavigate();
  const { rooms = [], isLoading } = useWardenLists();

  const [query, setQuery] = useState('');
  const [minOccupancy, setMinOccupancy] = useState('');
  const [minTotalSeats, setMinTotalSeats] = useState('');
  const [maxTotalSeats, setMaxTotalSeats] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (Array.isArray(rooms) ? rooms : []).filter(r => {
      // r.filledSeats and r.totalSeats expected from backend
      if (minOccupancy && Number(r.filledSeats) < Number(minOccupancy)) return false;
      if (minTotalSeats && Number(r.totalSeats ?? 0) < Number(minTotalSeats)) return false;
      if (maxTotalSeats && Number(r.totalSeats ?? 0) > Number(maxTotalSeats)) return false;
      if (!q) return true;
      const hay = `${r.roomNumber ?? r.id} ${(r.studentIds || []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rooms, query, minOccupancy, minTotalSeats, maxTotalSeats]);

  // Overall calculations
  const summary = useMemo(() => {
    const list = Array.isArray(rooms) ? rooms : [];
    const totalRooms = list.length;
    const totalCapacity = list.reduce((s, r) => s + Number(r.totalSeats ?? 0), 0);
    const totalFilled = list.reduce((s, r) => s + Number(r.filledSeats ?? (r.studentIds ? r.studentIds.length : 0)), 0);
    const avgOccupancy = totalCapacity ? Math.round((totalFilled / totalCapacity) * 100) : 0;
    return { totalRooms, totalCapacity, totalFilled, avgOccupancy };
  }, [rooms]);

  return (
    <div className="max-w-[1100px] mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Header section */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-outline-variant/30">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Hostel Rooms Command</h1>
          <p className="font-body-md text-on-surface-variant text-sm mt-1">
            Monitor room occupancy rates, seating counts, and student residency allocations at a glance.
          </p>
        </div>

        {/* Live Search */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/70" />
          <input 
            type="text" 
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search rooms by number..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm outline-none focus:border-portal-primary/60 transition-all text-on-surface"
          />
        </div>
      </header>

      {/* Summary statistics bar */}
      {!isLoading && rooms.length > 0 && (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Rooms */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 shadow-sm transition-all">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-portal-primary">Total Rooms</p>
            <p className="text-3xl font-bold text-on-surface mt-3">{summary.totalRooms}</p>
          </div>

          {/* Occupied Seats */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 shadow-sm transition-all">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-500">Occupied Seats</p>
            <p className="text-3xl font-bold text-on-surface mt-3">{summary.totalFilled} seats</p>
          </div>

          {/* Total Seater Capacity */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 shadow-sm transition-all">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-500">Total Seater Capacity</p>
            <p className="text-3xl font-bold text-on-surface mt-3">{summary.totalCapacity} seats</p>
          </div>

          {/* Avg Occupancy Rate */}
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/60 shadow-sm transition-all">
            <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">Avg Occupancy Rate</p>
            <p className="text-3xl font-bold text-on-surface mt-3">{summary.avgOccupancy}% filled</p>
          </div>
        </section>
      )}

      {/* Bento Room filter panel */}
      <div className="security-shadow glass-effect rounded-xl p-4 bg-surface-container-lowest border border-outline-variant/70 flex flex-wrap items-center gap-4 text-xs text-on-surface font-semibold">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-portal-primary" />
          <span className="font-bold text-xs uppercase tracking-wider text-on-surface-variant">Room Parameters</span>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-on-surface-variant">Min Occupied</label>
          <input 
            type="number" 
            value={minOccupancy} 
            onChange={e => setMinOccupancy(e.target.value)} 
            placeholder="e.g. 1" 
            className="border border-outline-variant bg-surface rounded-lg px-2 py-1.5 w-16 outline-none focus:border-portal-primary/60 transition-all text-on-surface text-center" 
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-on-surface-variant">Min Seater</label>
          <input 
            type="number" 
            value={minTotalSeats} 
            onChange={e => setMinTotalSeats(e.target.value)} 
            placeholder="e.g. 2" 
            className="border border-outline-variant bg-surface rounded-lg px-2 py-1.5 w-16 outline-none focus:border-portal-primary/60 transition-all text-on-surface text-center" 
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-on-surface-variant">Max Seater</label>
          <input 
            type="number" 
            value={maxTotalSeats} 
            onChange={e => setMaxTotalSeats(e.target.value)} 
            placeholder="e.g. 4" 
            className="border border-outline-variant bg-surface rounded-lg px-2 py-1.5 w-16 outline-none focus:border-portal-primary/60 transition-all text-on-surface text-center" 
          />
        </div>

        {(minOccupancy || minTotalSeats || maxTotalSeats) && (
          <button 
            onClick={() => { setMinOccupancy(''); setMinTotalSeats(''); setMaxTotalSeats(''); }}
            className="ml-auto text-rose-500 hover:text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-lg px-3 py-1.5 transition-all text-[10px] font-bold uppercase tracking-wider"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Grid Content list */}
      <div className="bg-surface-container-lowest security-shadow glass-effect rounded-2xl p-6 border border-outline-variant">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
            <Loader2 className="w-8 h-8 animate-spin text-portal-primary" />
            <p className="text-sm font-label-md">Loading rooms inventory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto">
            <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant/80 mb-4 border border-outline-variant/30">
              <Home className="w-6 h-6" />
            </div>
            <h3 className="font-headline-sm text-on-surface">No rooms found</h3>
            <p className="text-sm text-on-surface-variant mt-2">
              We couldn't find any rooms that match the selected occupancy filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filtered.map(r => {
              const occupied = Number(r.filledSeats ?? (r.studentIds ? r.studentIds.length : 0));
              const total = Number(r.totalSeats ?? 0);
              const percent = total ? Math.round((occupied / total) * 100) : 0;
              const isFull = occupied >= total;
              
              return (
                <article 
                  key={r.id}
                  onClick={() => navigate(`/warden/rooms/${r.id}`)}
                  className="security-shadow glass-effect rounded-xl border border-outline-variant bg-surface p-5 hover:border-portal-primary/40 card-shadow-hover transition-all duration-300 flex flex-col justify-between cursor-pointer animate-in zoom-in-95"
                >
                  <div>
                    {/* Header Room badge info */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="p-2.5 rounded-lg border text-portal-primary bg-primary-fixed border-outline-variant/30 shrink-0 shadow-sm">
                          <Home className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-on-surface leading-tight">Room {r.roomNumber ?? r.id}</h3>
                          <span className="text-[10px] text-on-surface-variant font-medium">{total}-seater capacity</span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                        isFull 
                          ? 'text-rose-600 bg-rose-50 border-rose-100' 
                          : occupied === 0
                            ? 'text-slate-500 bg-slate-50 border-slate-100'
                            : 'text-portal-primary bg-primary-fixed border-outline-variant/30'
                      }`}>
                        {isFull ? 'Full' : occupied === 0 ? 'Empty' : `${total - occupied} Left`}
                      </span>
                    </div>

                    {/* Progress indicators filled seats bar */}
                    <div className="space-y-1.5 mb-5">
                      <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium">
                        <span>Occupancy Ratio:</span>
                        <span className="font-semibold text-portal-primary">{occupied} / {total} filled</span>
                      </div>
                      <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden border border-outline-variant/10">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isFull ? 'bg-rose-500' : 'bg-portal-primary'
                          }`} 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions details trigger */}
                  <div className="border-t border-outline-variant/20 pt-4 mt-auto">
                    <button 
                      onClick={(e) => { e.stopPropagation(); navigate(`/warden/rooms/${r.id}`); }}
                      className="w-full flex items-center justify-center gap-1 bg-portal-primary hover:bg-portal-primary/95 text-white font-semibold text-xs py-2.5 rounded-lg active:scale-[0.98] transition-all hover:scale-[1.01] shadow-md shadow-portal-primary/10"
                    >
                      <span>Room Members</span>
                      <ChevronRight className="w-4 h-4 shrink-0 text-white/80" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default WardenRooms;
