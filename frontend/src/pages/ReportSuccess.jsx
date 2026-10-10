import React, { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { PublicLayout } from '../components/Layout.jsx';

export default function ReportSuccess() {
  const location = useLocation();
  const { report_id, tracking_secret } = location.state || {};
  const [copied, setCopied] = useState(false);

  if (!report_id) return <Navigate to="/" replace />;

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(
        `Report ID: ${report_id}\nTracking secret: ${tracking_secret}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-xl mx-auto">
        <div className="text-emerald-400 text-xs uppercase tracking-widest">
          Report received
        </div>
        <h1 className="mt-2 text-2xl font-semibold">Thank you for speaking up.</h1>
        <p className="mt-3 text-sm text-slate-400">
          Save the details below. They will be shown <strong>only once</strong>. You will need both
          the report ID and the tracking secret to check the status of your report.
        </p>

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
          <div>
            <div className="text-xs text-slate-500">Report ID</div>
            <div className="mt-1 font-mono text-sm break-all">{report_id}</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Tracking secret</div>
            <div className="mt-1 font-mono text-sm break-all">{tracking_secret}</div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={copyAll}
            className="px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-500"
          >
            {copied ? 'Copied ✓' : 'Copy both'}
          </button>
          <Link
            to="/track"
            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium"
          >
            Track this report
          </Link>
        </div>

        <p className="mt-6 text-xs text-slate-500">
          We do not store your tracking secret in plaintext and cannot recover it for you.
        </p>
      </div>
    </PublicLayout>
  );
}