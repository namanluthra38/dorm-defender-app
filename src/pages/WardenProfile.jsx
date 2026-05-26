import React from 'react';
import useWardenComposite from '@/hooks/useWardenComposite';
import { useWardenAuth } from '@/contexts/WardenAuthContext';
import { User, Mail, Phone, Calendar, Building, ShieldCheck, HelpCircle, Loader2, Sparkles } from 'lucide-react';

const WardenProfile = () => {
  const { user } = useWardenAuth();
  const { data, isLoading: detailsLoading, error: detailsError } = useWardenComposite();

  // Prefer hook data (fresh), fallback to AuthContext user
  const composite = data ?? null;
  const wardenObj = composite?.warden ?? user ?? {};
  const hostels = composite?.hostels ?? [];

  function formatDate(d) {
    if (!d) return '—';
    try {
      const dt = typeof d === 'string' ? new Date(d) : d;
      if (Number.isNaN(dt.getTime())) return d;
      return dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return d;
    }
  }

  const profile = {
    name: wardenObj?.name ?? 'Warden Member',
    email: wardenObj?.email ?? 'warden@example.com',
    phone: wardenObj?.phone ?? '—',
    employeeId: wardenObj?.employeeId ?? wardenObj?.id ?? '—',
    assignedHostel: composite?.hostel.name ?? '—',
    createdAt: formatDate(wardenObj?.createdAt ?? wardenObj?.created_at)
  };

  return (
    <div className="max-w-[700px] mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      
      {/* Header section */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-outline-variant/30">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Warden Profile</h1>
          <p className="font-body-md text-on-surface-variant text-sm mt-0.5">
            Manage your academic residency staff credentials and assigned unit sectors.
          </p>
        </div>
      </header>

      {/* Main Profile Info Card */}
      <div className="bg-surface-container-lowest security-shadow glass-effect rounded-2xl p-6 border border-outline-variant relative overflow-hidden">
        
        {/* Visual design embellishment */}
        <div className="absolute right-0 top-0 w-28 h-28 bg-portal-primary/5 rounded-full blur-2xl -translate-y-8 translate-x-8 pointer-events-none" />

        {detailsLoading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-on-surface-variant">
            <Loader2 className="w-8 h-8 animate-spin text-portal-primary" />
            <p className="text-sm font-label-md">Loading warden details...</p>
          </div>
        )}

        {detailsError && (
          <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span>Failed to load warden details: {detailsError.message}</span>
          </div>
        )}

        {!detailsLoading && (
          <div className="space-y-6">
            
            {/* Top Staff Identity Header */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b border-outline-variant/30 text-center sm:text-left">
              <div className="w-20 h-20 rounded-full bg-portal-primary/10 border-2 border-portal-primary/20 flex items-center justify-center text-portal-primary shrink-0 shadow-inner">
                <User className="w-10 h-10" />
              </div>
                  <h2 className="text-xl font-headline-sm font-bold text-on-surface">{profile.name}</h2>
            </div>

            {/* Profile specifications grid */}
            <div className="space-y-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant">Profile Specifications</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Email */}
                <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low flex items-start gap-3">
                  <Mail className="w-4 h-4 text-portal-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Staff Email</span>
                    <span className="text-sm font-semibold text-on-surface truncate block max-w-[240px] mt-0.5">{profile.email}</span>
                  </div>
                </div>

                {/* Phone */}
                <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low flex items-start gap-3">
                  <Phone className="w-4 h-4 text-portal-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Contact Number</span>
                    <span className="text-sm font-semibold text-on-surface block mt-0.5">{profile.phone}</span>
                  </div>
                </div>

                {/* Assigned Hostel */}
                <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low flex items-start gap-3">
                  <Building className="w-4 h-4 text-portal-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Hostel</span>
                    <span className="text-sm font-semibold text-on-surface block mt-0.5">{profile.assignedHostel}</span>
                  </div>
                </div>

                {/* Warden Since */}
                <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-portal-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Warden Since</span>
                    <span className="text-sm font-semibold text-on-surface block mt-0.5">{profile.createdAt}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Sub-Hostels list managed */}
            {hostels.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant">Allocated Managed Sectors ({hostels.length})</h3>
                <ul className="grid grid-cols-1 gap-3">
                  {hostels.map((h) => (
                    <li 
                      key={h.id} 
                      className="p-4 border border-outline-variant/60 rounded-xl bg-surface flex items-center justify-between gap-4 transition-all hover:border-portal-primary/20 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg border text-portal-primary bg-primary-fixed border-outline-variant/40 shrink-0">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-on-surface leading-snug">{h.name}</p>
                          <span className="text-[10px] text-on-surface-variant font-medium">Capacity load: {h.numberOfRooms ?? '—'} rooms</span>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-portal-primary bg-portal-primary/5 border border-portal-primary/10 px-2.5 py-1 rounded-full">
                        {h.isBoysHostel ? "Boys' Residency" : "Girls' Residency"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
};

export default WardenProfile;
