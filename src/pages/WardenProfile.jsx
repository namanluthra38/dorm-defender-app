import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import useWardenComposite from '@/hooks/useWardenComposite';

const WardenProfile = () => {
  const { user } = useAuth();
  const { data, isLoading: detailsLoading, error: detailsError, refetch } = useWardenComposite();

  // Prefer hook data (fresh), fallback to AuthContext user
  const composite = data ?? null;
  const wardenObj = composite?.warden ?? user ?? {};
  const hostels = composite?.hostels ?? [];

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
    name: wardenObj?.name ?? '-',
    email: wardenObj?.email ?? 'warden@example.com',
    phone: wardenObj?.phone ?? '—',
    employeeId: wardenObj?.employeeId ?? wardenObj?.id ?? '—',
    assignedHostels: hostels.length,
    createdAt: formatDate(wardenObj?.createdAt ?? wardenObj?.created_at)
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold">Profile</h2>
        <p className="text-sm text-gray-500">Manage your profile information</p>
      </div>

      <div className="bg-white border rounded-md p-4 max-w-2xl">
        {detailsLoading && <div className="mb-3 text-sm text-gray-500">Loading warden details…</div>}
        {detailsError && <div className="mb-3 text-sm text-rose-600">Failed to load warden composite: {detailsError.message}</div>}

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
            <p className="text-sm text-gray-500">Phone</p>
            <p className="font-medium">{profile.phone}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Employee ID</p>
            <p className="font-medium">{profile.employeeId}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Assigned Hostels</p>
            <p className="font-medium">{profile.assignedHostels}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Created</p>
            <p className="font-medium">{profile.createdAt}</p>
          </div>
        </div>

        {hostels.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Hostels</h3>
            <ul className="space-y-2">
              {hostels.map((h) => (
                <li key={h.id} className="p-2 border rounded">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{h.name}</p>
                      <p className="text-xs text-gray-400">Rooms: {h.numberOfRooms ?? '-'}</p>
                    </div>
                    <div className="text-sm text-gray-500">{h.isBoysHostel ? 'Boys' : 'Girls'}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button onClick={() => refetch()} className="px-3 py-1 rounded bg-sky-600 text-white text-sm">Refresh</button>
        </div>
      </div>
    </div>
  );
};

export default WardenProfile;

