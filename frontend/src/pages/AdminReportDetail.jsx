import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../components/Layout.jsx';
import { api } from '../api/client.js';

const STATUS_OPTIONS = [
  { value: 'received', label: 'Received' },
  { value: 'under_review', label: 'Under review' },
  { value: 'resolved', label: 'Resolved' },
];

export default function AdminReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await api.adminGetReport(id);
      setReport(data);
      setStatus(data.status || 'received');
      setNote(data.moderator_note || '');
    } catch (err) {
      setError(err.message || 'Could not load report.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function save() {
    setSaving(true);
    setError('');
    try {
      const updated = await api.adminUpdateReport(id, {
        status,
        moderator_note: note,
      });
      setReport((r) => ({ ...r, ...updated }));
    } catch (err) {
      setError(err.message || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout title={`Report #${String(id).slice(0, 8)}`}>
      <div className="mb-4">
        <Link to="/admin" className="text-sm text-slate-400 hover:text-white">
          ← Back to overview
        </Link>
      </div>

      {loading && <div className="text-slate-400">Loading…</div>}
      {error && <div className="text-red-400">{error}</div>}

      {report && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="text-xs text-slate-500 uppercase tracking-widest">Report content</div>
              <h2 className="mt-2 text-xl font-semibold">{report.title}</h2>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-0.5 rounded-full border border-slate-700 capitalize">
                  {report.category}
                </span>
                <span className="px-2 py-0.5 rounded-full border border-slate-700 capitalize">
                  Severity: {report.severity}
                </span>
              </div>
              <p className="mt-4 text-slate-200 whitespace-pre-wrap leading-relaxed">
                {report.description}
              </p>
            </div>

            <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-4 text-sm text-amber-200">
              This record contains no submitter identity. Moderation should focus on content and
              behavior only.
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-xs text-slate-500 uppercase tracking-widest">Moderation</div>

              <label className="block text-sm text-slate-300 mt-3 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              <label className="block text-sm text-slate-300 mt-3 mb-1">Moderator note</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm resize-y"
                placeholder="Internal note (not shown to reporter)"
              />

              <button
                onClick={save}
                disabled={saving}
                className="mt-3 w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-medium py-2"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs text-slate-400 space-y-1">
              <div><span className="text-slate-500">Report ID:</span> {report.id}</div>
              <div><span className="text-slate-500">Received:</span> {report.created_at ? new Date(report.created_at).toLocaleString() : '—'}</div>
              <div><span className="text-slate-500">Updated:</span> {report.updated_at ? new Date(report.updated_at).toLocaleString() : '—'}</div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}