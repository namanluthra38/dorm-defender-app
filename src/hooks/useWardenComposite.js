// src/hooks/useWardenComposite.js
import { useQuery } from '@tanstack/react-query';
import api from '@/api/wardenClient';

async function fetchComposite() {
    const res = await api.get(`/wardens/me/full`);
    return res.data; // expected shape: { warden, room, hostel }
}

export default function useWardenComposite(options = {}) {
    // options is an optional partial options object passed-through to useQuery
    return useQuery({
        queryKey: ['wardenComposite'],
        queryFn: fetchComposite,
        staleTime: 1000 * 60 * 5,
        retry: 1,
        ...options,
    });
}


