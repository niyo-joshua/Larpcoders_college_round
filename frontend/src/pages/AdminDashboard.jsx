import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../components/Layout.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { api } from '../api/client.js';

const STATUSES = ['', 'received', 'under_review', 'resolved'];

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ status: '', category: '' });

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await api.adminListReports(filter);
      setReports(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(err.message || 'Could not load reports.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.status, filter.category]);

  const counts = reports.reduce(
    (acc, r) => {
      acc.total += 1;
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    { total: 0 }
  );

  return (
    <AdminLayout title="Reports overview">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Total" value={counts.total} />
        <Stat label="Received" value={counts.received || 0} />
        <Stat label="Under review" value={counts.under_review || 0} />
        <Stat label="Resolved" value={counts.resolved || 0} />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={filter.status}
          onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
          className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All statuses'}</option>
          ))}
        </select>

        <select
          value={filter.category}
          onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))}
          className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          <option value="harassment">Harassment</option>
          <option value="misconduct">Misconduct</option>
          <option value="safety">Safety</option>
          <option value="academic">Academic</option>
          <option value="workplace">Workplace</option>
          <option value="other">Other</option>
        </select>

        <button
          onClick={load}
          className="ml-auto px-3 py-2 rounded-lg border border-slate-700 hover:border-slate-500 text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-4 py-2 bg-slate-900/60 text-xs text-slate-400 border-b border-slate-800">
          No submitter identities are displayed. Reports contain no member identifiers.
        </div>

        {loading && <div className="p-6 text-slate-400 text-sm">Loading reports…</div>}
        {error && <div className="p-6 text-red-400 text-sm">{error}</div>}

        {!loading && !error && reports.length === 0 && (
          <div className="p-6 text-slate-400 text-sm">No reports match these filters.</div>
        )}

        {!loading && !error && reports.length > 0 && (
          <table className="w-full text-sm">
            <thead className="bg-slate-900/40 text-slate-400">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Report</th>
                <th className="text-left px-4 py-2 font-medium">Category</th>
                <th className="text-left px-4 py-2 font-medium">Severity</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Received</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-t border-slate-800 hover:bg-slate-900/40">
                  <td className="px-4 py-3">
                    <Link to={`/admin/reports/${r.id}`} className="text-emerald-300 hover:underline">
                      #{String(r.id).slice(0, 8)}
                    </Link>
                    <div className="text-slate-400 text-xs truncate max-w-xs">{r.title}</div>
                  </td>
                  <td className="px-4 py-3 capitalize">{r.category}</td>
                  <td className="px-4 py-3 capitalize">{r.severity}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 text-slate-400">
                    {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}