import React, { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { REQUEST_BASE } from '@/config';
import { useAuth } from '@/contexts/AuthContext';

const safeGetToken = () => {
  try { return localStorage.getItem('authToken'); } catch (e) { return null; }
};

const Complaints = () => {
  const { studentComposite } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentsInput, setAttachmentsInput] = useState(''); // comma separated
  const [submitting, setSubmitting] = useState(false);

  const studentId = studentComposite?.student?.id ?? studentComposite?.studentId ?? null;

  useEffect(() => {
    let aborted = false;
    const load = async () => {
      if (!studentId) return;
      setLoading(true); setError(null);
      try {
        const token = safeGetToken();
        const url = `${REQUEST_BASE}/complaints/student/${encodeURIComponent(studentId)}`;
        const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        if (!res.ok) {
          const txt = await res.text().catch(() => null);
          if (!aborted) setError(`Failed to load complaints: ${res.status} ${txt ?? ''}`);
          return;
        }
        const data = await res.json();
        if (!aborted) setComplaints(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!aborted) setError(e.message ?? String(e));
      } finally { if (!aborted) setLoading(false); }
    };
    load();
    return () => { aborted = true; };
  }, [studentId]);

  const openForm = () => {
    setTitle(''); setDescription(''); setAttachmentsInput(''); setShowForm(true);
  };

  const submit = async (e) => {
    e?.preventDefault();
    if (submitting) return;
    if (!title || !description) { alert('Title and description are required'); return; }
    setSubmitting(true);
    try {
      const token = safeGetToken();
      const attachments = attachmentsInput.split(',').map(s => s.trim()).filter(Boolean);
      const body = { title, description, attachments };
      const res = await fetch(`${REQUEST_BASE}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(txt || `Failed to create complaint: ${res.status}`);
      }
      const created = await res.json();
      // prepend to list
      setComplaints(prev => [created, ...prev]);
      setShowForm(false);
    } catch (err) {
      alert('Failed to create complaint: ' + (err?.message ?? String(err)));
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">My Complaints</h2>
          <p className="text-sm text-gray-500">Complaints you have raised</p>
        </div>
        <button className="flex items-center gap-2 bg-rose-500 text-white px-3 py-2 rounded-md text-sm" onClick={openForm}>
          <PlusCircle className="w-4 h-4" /> New Complaint
        </button>
      </div>

      <div className="bg-white border rounded-md p-4">
        {loading ? (
          <div className="text-sm text-gray-500">Loading complaints…</div>
        ) : error ? (
          <div className="text-sm text-rose-600">{error}</div>
        ) : complaints.length === 0 ? (
          <div className="text-sm text-gray-500">You have not filed any complaints yet.</div>
        ) : (
          <ul className="space-y-3">
            {complaints.map(c => (
              <li key={c.id || c._id || JSON.stringify(c)} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-gray-400">{new Date(c.createdAt || c.date || Date.now()).toLocaleString()} • {String(c.status)}</p>
                  <p className="text-sm text-gray-700 mt-2">{c.description}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={submit} className="bg-white rounded-md w-full max-w-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">New Complaint</h3>
              <button type="button" onClick={() => setShowForm(false)} className="text-gray-500">Close</button>
            </div>
            <div className="mb-3">
              <label className="text-sm font-medium">Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded px-3 py-2 mt-1" maxLength={150} required />
            </div>
            <div className="mb-3">
              <label className="text-sm font-medium">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded px-3 py-2 mt-1" rows={6} maxLength={4000} required />
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium">Attachments (comma-separated URLs)</label>
              <input value={attachmentsInput} onChange={e => setAttachmentsInput(e.target.value)} className="w-full border rounded px-3 py-2 mt-1" placeholder="https://... , https://..." />
            </div>
            <div className="flex items-center justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button type="submit" disabled={submitting} className="px-4 py-2 bg-rose-600 text-white rounded">{submitting ? 'Submitting…' : 'Submit Complaint'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Complaints;
