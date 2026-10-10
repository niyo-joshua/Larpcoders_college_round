import React, { useState } from 'react';
import { PublicLayout } from '../components/Layout.jsx';
import { api } from '../api/client.js';

const STATUS_LABEL = {
  received: 'Received',
  under_review: 'Under review',
  resolved: 'Resolved',
};

export default function Track() {
  const [reportId, setReportId] = useState('');
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!reportId.trim() || !secret.trim()) {
      setError('Please enter both the report ID and the tracking secret.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.trackReport({
        report_id: reportId.trim(),
        tracking_secret: secret.trim(),
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Could not find that report.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-xl mx-auto">
        <h1 className="text-2xl font-semibold">Track a report</h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter the report ID and the tracking secret you received when you submitted.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Report ID</label>
            <input
              value={reportId}
              onChange={(e) => setReportId(e.target.value)}
              autoComplete="off"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 outline-none focus:border-emerald-500 font-mono text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Tracking secret</label>
            <input
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              autoComplete="off"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 outline-none focus:border-emerald-500 font-mono text-sm"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-medium py-2.5"
          >
            {loading ? 'Checking…' : 'Check status'}
          </button>
        </form>

        {result && (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="text-xs text-slate-500">Status</div>
            <div className="mt-1 text-lg font-semibold">
              {STATUS_LABEL[result.status] || result.status}
            </div>
            {result.updated_at && (
              <div className="mt-2 text-xs text-slate-500">
                Last updated: {new Date(result.updated_at).toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>
    </PublicLayout>
  );
}