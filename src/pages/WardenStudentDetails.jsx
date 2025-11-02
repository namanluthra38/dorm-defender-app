import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { STUDENT_BASE } from '@/config';
import { ArrowLeft } from 'lucide-react';

const safeGetToken = () => {
  try { return localStorage.getItem('authToken'); } catch (e) { return null; }
};

const WardenStudentDetails = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let aborted = false;
    const controller = new AbortController();
    const token = safeGetToken();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${STUDENT_BASE}/students/${encodeURIComponent(studentId)}/min`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        });
        if (aborted) return;
        if (!res.ok) {
          if (res.status === 404) {
            setError('Student not found');
          } else {
            const txt = await res.text().catch(() => null);
            setError(`Failed to load: ${res.status} ${txt ?? ''}`);
          }
          setData(null);
          return;
        }
        const json = await res.json();
        if (!aborted) setData({ id: studentId, ...json });
      } catch (e) {
        if (!aborted) setError(e.message ?? String(e));
      } finally {
        if (!aborted) setLoading(false);
      }
    };

    load();
    return () => { aborted = true; controller.abort(); };
  }, [studentId]);

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded border bg-white">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-2xl font-semibold">Student details</h2>
          <p className="text-sm text-gray-500">Minimal profile for quick reference</p>
        </div>
      </div>

      <div className="bg-white border rounded-md p-4">
        {loading ? (
          <div className="text-sm text-gray-500">Loading…</div>
        ) : error ? (
          <div className="text-sm text-rose-600">{error}</div>
        ) : !data ? (
          <div className="text-sm text-gray-500">No data available.</div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xl font-medium">{data.name ?? 'Unknown'}</p>
              <p className="text-sm text-gray-500">UID: {data.uid ?? '—'}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
              <div><span className="font-medium">Email:</span> {data.email ?? '—'}</div>
              <div><span className="font-medium">Phone:</span> {data.phone ?? '—'}</div>
              <div><span className="font-medium">Graduation Year:</span> {data.graduationYear ?? '—'}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WardenStudentDetails;

