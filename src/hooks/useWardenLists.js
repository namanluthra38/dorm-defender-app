import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWardenAuth } from '@/contexts/WardenAuthContext';
import useWardenComposite from '@/hooks/useWardenComposite';
import { REQUEST_BASE, HOSTEL_BASE, STUDENT_BASE } from '@/config';

const safeGetToken = () => {
  try { return localStorage.getItem('authToken'); } catch (e) { return null; }
};

async function fetchJson(url, token) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json();
}

export default function useWardenLists() {
  const queryClient = useQueryClient();
  const { data: composite, isLoading: compositeLoading } = useWardenComposite();
  const token = safeGetToken();

  const hostelId = (() => {
    if (composite?.hostels && composite.hostels.length > 0) return composite.hostels[0].id;
    return (composite?.warden?.hostelId ?? null);
  })();

  const requestsQuery = useQuery({
    queryKey: ['warden','requests', hostelId],
    queryFn: async () => await fetchJson(`${REQUEST_BASE}/requests/hostel/${encodeURIComponent(hostelId)}`, token),
    enabled: !!hostelId,
    initialData: () => queryClient.getQueryData(['warden','requests', hostelId]) ?? undefined,
    staleTime: 1000 * 60, // 1 minute
  });

  const roomsQuery = useQuery({
    queryKey: ['warden','rooms', hostelId],
    queryFn: async () => await fetchJson(`${HOSTEL_BASE}/hostels/rooms/hostel/${encodeURIComponent(hostelId)}`, token),
    enabled: !!hostelId,
    initialData: () => queryClient.getQueryData(['warden','rooms', hostelId]) ?? undefined,
    staleTime: 1000 * 60,
  });

  const studentsQuery = useQuery({
    queryKey: ['warden','students', hostelId],
    queryFn: async () => await fetchJson(`${STUDENT_BASE}/students/hostel/${encodeURIComponent(hostelId)}`, token),
    enabled: !!hostelId,
    initialData: () => queryClient.getQueryData(['warden','students', hostelId]) ?? undefined,
    staleTime: 1000 * 60,
  });

  const isLoading = compositeLoading || requestsQuery.isLoading || roomsQuery.isLoading || studentsQuery.isLoading;
  const isError = requestsQuery.isError || roomsQuery.isError || studentsQuery.isError;

  const refetchAll = async () => {
    await Promise.all([requestsQuery.refetch(), roomsQuery.refetch(), studentsQuery.refetch()]);
  };

  return {
    hostelId,
    requests: requestsQuery.data ?? [],
    rooms: roomsQuery.data ?? [],
    students: studentsQuery.data ?? [],
    isLoading,
    isError,
    refetchAll,
    requestsQuery,
    roomsQuery,
    studentsQuery,
  };
}

