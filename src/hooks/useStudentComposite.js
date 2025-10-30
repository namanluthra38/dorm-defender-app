// src/hooks/useStudentComposite.js
import { useQuery } from '@tanstack/react-query';
import api from '@/api/apiClient';

const STUDENT_BASE = import.meta.env.VITE_STUDENT_BASE || 'http://localhost:4000';

async function fetchComposite() {
    const res = await api.get(`${STUDENT_BASE}/students/me/full`);
    return res.data; // expected shape: { student, room, hostel }
}

export default function useStudentComposite(options = {}) {
    // options is an optional partial options object passed-through to useQuery
    return useQuery({
        queryKey: ['studentComposite'],
        queryFn: fetchComposite,
        staleTime: 1000 * 60 * 5,
        retry: 1,
        ...options,
    });
}
