import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import useStudentDetails from '@/hooks/useStudentDetails';

const StudentProfile = () => {
  const { user } = useAuth();
  const { data, loading: detailsLoading, error: detailsError, refresh } = useStudentDetails();

  const studentObj = data?.student ?? user ?? {};

  // Helper: format dates safely
  function formatDate(d) {
    if (!d) return '—';
    try {
      const dt = typeof d === 'string' ? new Date(d) : d;
      if (Number.isNaN(dt.getTime())) return d;
      return dt.toLocaleDateString();
    } catch (e) {
      return d;
    }
  }

  const profile = {
    name: studentObj?.name ?? '-',
    email: studentObj?.email ?? 'student@example.com',
    graduationYear: studentObj?.graduationYear ?? studentObj?.graduation_year ?? '—',
    uid: studentObj?.uid ?? '—',
    address: studentObj?.address ?? '—',
    dateOfBirth: formatDate(studentObj?.dateOfBirth ?? studentObj?.date_of_birth),
    gender: studentObj?.gender ?? '—',
    phone: studentObj?.phone ?? '—'
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Profile</h2>
        <p className="text-sm text-gray-500">Manage your profile information</p>
      </div>

      <div className="bg-white border rounded-md p-4 max-w-2xl">
        {detailsLoading && <div className="mb-3 text-sm text-gray-500">Loading student details…</div>}
        {detailsError && <div className="mb-3 text-sm text-rose-600">Failed to load student: {detailsError.message}</div>}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Name</p>
            <p className="font-medium">{profile.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p className="font-medium">{profile.email}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Graduation Year</p>
            <p className="font-medium">{profile.graduationYear}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">UID</p>
            <p className="font-medium">{profile.uid}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Address</p>
            <p className="font-medium">{profile.address}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Date of Birth</p>
            <p className="font-medium">{profile.dateOfBirth}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Gender</p>
            <p className="font-medium">{profile.gender}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium">{profile.phone}</p>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={() => refresh()} className="px-3 py-1 rounded bg-sky-600 text-white text-sm">Refresh</button>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
