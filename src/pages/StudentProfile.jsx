import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import useStudentDetails from '@/hooks/useStudentDetails';
import PageContainer from '@/components/layout/PageContainer';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Building, 
  Loader2, 
  Sparkles, 
  MapPin, 
  GraduationCap, 
  Compass, 
  UserCheck, 
  Bed
} from 'lucide-react';

const StudentProfile = () => {
  const { user, studentComposite } = useAuth();
  const { data, loading: detailsLoading, error: detailsError } = useStudentDetails();

  // Prefer hook data (fresh), fallback to AuthContext composite
  const composite = data ?? studentComposite ?? null;
  const studentObj = composite?.student ?? user ?? {};
  const roomObj = composite?.room ?? null;
  const hostelObj = composite?.hostel ?? null;

  // Helper: format dates safely
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
    name: studentObj?.name ?? 'Resident Student',
    email: studentObj?.email ?? 'student@example.com',
    graduationYear: studentObj?.graduationYear ?? studentObj?.graduation_year ?? '—',
    uid: studentObj?.uid ?? '—',
    address: studentObj?.address ?? '—',
    dateOfBirth: formatDate(studentObj?.dateOfBirth ?? studentObj?.date_of_birth),
    gender: studentObj?.gender ?? '—',
    phone: studentObj?.phone ?? '—',
    hostelName: hostelObj?.name ?? '—',
    roomLabel: roomObj?.roomNumber ?? roomObj?.number ?? roomObj?.id ?? studentObj?.roomId ?? '—'
  };

  return (
    <PageContainer>
      <div className="max-w-[700px] mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
        
        {/* Header section */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-outline-variant/30">
          <div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface">Student Profile</h1>
            <p className="font-body-md text-on-surface-variant text-sm mt-0.5">
              Review your academic residency enrollment records and assigned hostel room details.
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
              <p className="text-sm font-label-md">Loading student details...</p>
            </div>
          )}

          {detailsError && (
            <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-semibold flex items-center gap-2">
              <User className="w-5 h-5 shrink-0" />
              <span>Failed to load student details: {detailsError.message}</span>
            </div>
          )}

          {!detailsLoading && (
            <div className="space-y-6">
              
              {/* Top Student Identity Header */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b border-outline-variant/30 text-center sm:text-left">
                <div className="w-20 h-20 rounded-full bg-portal-primary/10 border-2 border-portal-primary/20 flex items-center justify-center text-portal-primary shrink-0 shadow-inner">
                  <User className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-headline-sm font-bold text-on-surface">{profile.name}</h2>
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider">UID / Student Code: {profile.uid}</p>
                </div>
              </div>

              {/* Profile specifications grid */}
              <div className="space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant">Profile Specifications</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Email */}
                  <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low flex items-start gap-3">
                    <Mail className="w-4 h-4 text-portal-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Registered Email</span>
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

                  {/* Graduation Year */}
                  <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low flex items-start gap-3">
                    <GraduationCap className="w-4 h-4 text-portal-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Graduation Batch</span>
                      <span className="text-sm font-semibold text-on-surface block mt-0.5">{profile.graduationYear} Class</span>
                    </div>
                  </div>

                  {/* DOB */}
                  <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-portal-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Date of Birth</span>
                      <span className="text-sm font-semibold text-on-surface block mt-0.5">{profile.dateOfBirth}</span>
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low flex items-start gap-3">
                    <Compass className="w-4 h-4 text-portal-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Gender Profile</span>
                      <span className="text-sm font-semibold text-on-surface block mt-0.5 capitalize">{profile.gender}</span>
                    </div>
                  </div>

                  {/* Assigned Room */}
                  <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low flex items-start gap-3">
                    <Bed className="w-4 h-4 text-portal-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Assigned Room</span>
                      <span className="text-sm font-semibold text-on-surface block mt-0.5">{profile.roomLabel}</span>
                    </div>
                  </div>

                </div>

                {/* Address block (full width) */}
                <div className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low flex items-start gap-3 mt-4">
                  <MapPin className="w-4 h-4 text-portal-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider block">Residential Address</span>
                    <span className="text-sm font-semibold text-on-surface block mt-0.5 leading-relaxed">{profile.address}</span>
                  </div>
                </div>

              </div>

              {/* Hostels & Housing summary details if assigned */}
              {hostelObj && (
                <div className="space-y-3 pt-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-on-surface-variant">Allocated Residency Sector</h3>
                  <div className="p-4 border border-outline-variant/60 rounded-xl bg-surface flex items-center justify-between gap-4 transition-all hover:border-portal-primary/20 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg border text-portal-primary bg-primary-fixed border-outline-variant/40 shrink-0">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-on-surface leading-snug">{profile.hostelName}</p>
                        <span className="text-[10px] text-on-surface-variant font-medium">Residence wing block allocations</span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-portal-primary bg-portal-primary/5 border border-portal-primary/10 px-2.5 py-1 rounded-full">
                      {hostelObj.isBoysHostel ? "Boys' Residency" : "Girls' Residency"}
                    </span>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </PageContainer>
  );
};

export default StudentProfile;
