import React, { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { REQUEST_BASE } from '@/config';
import { useAuth } from '@/contexts/AuthContext';

const safeGetToken = () => {
  try { return localStorage.getItem('authToken'); } catch (e) { return null; }
};

const MAX_FILES = 5;
const RESIZE_MAX_WIDTH = 600; // px - smaller target to aggressively cut size
const RESIZE_QUALITY = 0.55; // quality for webp/jpg
const ALERT_PAYLOAD_BYTES = 400 * 1024; // 400KB threshold

const Complaints = () => {
  const { studentComplaints, token, refreshStudentComplaints } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fileAttachments, setFileAttachments] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // hydrate complaints from auth context
  useEffect(() => {
    setLoading(true);
    setError(null);
    try {
      if (studentComplaints && Array.isArray(studentComplaints)) setComplaints(studentComplaints);
      else setComplaints([]);
    } catch (e) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, [studentComplaints]);

  const openForm = () => {
    setTitle(''); setDescription(''); setFileAttachments([]); setShowForm(true);
  };

  // Resize & compress an image File to a JPEG data URL
  const resizeFileToDataUrl = (file, maxWidth = RESIZE_MAX_WIDTH, quality = RESIZE_QUALITY) => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          let { width: w, height: h } = img;
          if (w > maxWidth) {
            const ratio = maxWidth / w;
            w = Math.round(w * ratio);
            h = Math.round(h * ratio);
          }
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);
          // Prefer WebP for better compression; fallbacks to jpeg if not supported
          const mime = 'image/webp';
          canvas.toBlob((blob) => {
            if (!blob) {
              URL.revokeObjectURL(url);
              return reject(new Error('Compression failed'));
            }
            const reader = new FileReader();
            reader.onload = () => {
              URL.revokeObjectURL(url);
              resolve(reader.result);
            };
            reader.onerror = (err) => { URL.revokeObjectURL(url); reject(err); };
            reader.readAsDataURL(blob);
          }, mime, quality);
        } catch (err) {
          URL.revokeObjectURL(url);
          reject(err);
        }
      };
      img.onerror = (err) => { URL.revokeObjectURL(url); reject(err); };
      img.src = url;
    });
  };

  const onFileChange = (e) => {
    const files = Array.from(e.target.files || [])
      .filter(f => f && f.type && f.type.startsWith('image/'))
      .slice(0, MAX_FILES);
    setFileAttachments(files);
  };

  // manage previews and revoke old object URLs
  useEffect(() => {
    // revoke previous
    previews.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} });
    const urls = fileAttachments.map(f => URL.createObjectURL(f));
    setPreviews(urls);
    return () => { urls.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) {} }); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileAttachments]);

  const removeFileAt = (idx) => setFileAttachments(prev => prev.filter((_, i) => i !== idx));

  const submit = async (e) => {
    e?.preventDefault();
    if (submitting) return;
    if (!title || !description) { alert('Title and description are required'); return; }

    setSubmitting(true);
    try {
      const tokenToUse = token ?? safeGetToken();

      let attachments = [];
      if (fileAttachments && fileAttachments.length > 0) {
        // compress/resize each file
        const converted = [];
        for (const f of fileAttachments) {
          try {
            const dataUrl = await resizeFileToDataUrl(f);
            converted.push(dataUrl);
          } catch (err) {
            console.warn('Failed to process image', f.name, err);
          }
        }
        attachments = converted;
      }

      // Log sizes and optionally warn user if still large
      try {
        const sizes = attachments.map(a => (typeof a === 'string' ? a.length : 0));
        const total = sizes.reduce((s, v) => s + v, 0);
        console.info('Generated attachment sizes (chars):', sizes, 'total:', total);
        // approximate bytes from base64 chars (1 char ~1 byte in JS string) / maybe slightly different
        if (total > ALERT_PAYLOAD_BYTES) {
          const kb = Math.round(total / 1024);
          if (!confirm(`Total attachments payload is ~${kb} KB after compression. Continue sending?`)) {
            setSubmitting(false);
            return;
          }
        }
      } catch (e) { /* ignore logging errors */ }

      const body = { title, description, attachments };
      const res = await fetch(`${REQUEST_BASE}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(tokenToUse ? { Authorization: `Bearer ${tokenToUse}` } : {}) },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        alert('Failed to create complaint: ' + (txt || res.status));
        setSubmitting(false);
        return;
      }

      const created = await res.json();
      try { await refreshStudentComplaints(); } catch (e) { setComplaints(prev => [created, ...prev]); }
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
            <div className="mb-3">
              <label className="text-sm font-medium">Attach images from device</label>
              <input type="file" accept="image/*" multiple onChange={onFileChange} className="w-full mt-1" />
              {fileAttachments && fileAttachments.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-auto">
                  {fileAttachments.map((f, idx) => (
                    <div key={idx} className="relative w-20 h-20 rounded overflow-hidden border">
                      <button type="button" onClick={() => removeFileAt(idx)} className="absolute top-0 right-0 z-10 bg-white/80 rounded-bl px-1 text-xs">✕</button>
                      <img src={previews[idx]} alt={f.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">You can attach images from your device; images will be resized & compressed before upload to reduce size.</p>
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
