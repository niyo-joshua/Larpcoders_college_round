import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PublicLayout } from '../components/Layout.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { api } from '../api/client.js';
import {
  Search,
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileText,
  Activity,
  ShieldAlert,
  CheckCircle2,
  Lock
} from 'lucide-react';

export default function Track() {
  const location = useLocation();
  const defaultReportId = location.state?.defaultReportId || '';
  const defaultSecret = location.state?.defaultSecret || '';

  const [reportId, setReportId] = useState(defaultReportId);
  const [secret, setSecret] = useState(defaultSecret);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Auto-search if defaults were passed
  useEffect(() => {
    if (defaultReportId && defaultSecret) {
      executeTrack(defaultReportId, defaultSecret);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function executeTrack(rId, sec) {
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const data = await api.trackReport({
        report_id: rId.trim(),
        tracking_secret: sec.trim(),
      });
      setResult(data);
    } catch (err) {
      setError(
        err.message ||
          'Report not found. Please verify that your Report Reference ID and Tracking Secret are correct.'
      );
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!reportId.trim() || !secret.trim()) {
      setError('Please provide both your Report ID and your Tracking Secret.');
      return;
    }
    executeTrack(reportId, secret);
  }

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto animate-fadeIn">
        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Search className="w-3.5 h-3.5" />
            Confidential Inquiry Tracker
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Track Report Investigation
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Check the progress of your confidential disclosure. See ombudsman findings, intervention status, and the sanitized briefing shared with company management.
          </p>
        </div>

        {/* Tracking Form */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 shadow-sm mb-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="reportId"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Report Reference ID (UUID)
              </label>
              <input
                id="reportId"
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
                autoComplete="off"
                placeholder="e.g. 7c9e6679-7425-40de-944b-e07fc1f90ae7"
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm text-slate-900 dark:text-white font-mono placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="secret"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Tracking Secret (Private Key)
              </label>
              <input
                id="secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                type="password"
                autoComplete="off"
                placeholder="e.g. sec_4f2b9a7..."
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm text-slate-900 dark:text-white font-mono placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 disabled:opacity-60 text-white dark:text-slate-950 font-semibold py-3 shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  <span>Querying Escrow Ledger…</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Verify and Retrieve Status</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Result Display */}
        {result && (
          <div className="space-y-5 animate-slideUp">
            {/* Ombudsman Intervention Banner if triggered */}
            {result.ombudsman_intervention && (
              <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Formal Ombudsman Intervention Active</h4>
                  <p className="mt-1 text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                    Due to the severity or nature of this concern, the independent Ombudsman has exercised
                    supervisory authority to initiate a priority external inquiry. Full record details are preserved
                    in confidential escrow to ensure whistleblower safety.
                  </p>
                </div>
              </div>
            )}

            {/* Main Status Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 shadow-sm space-y-5">
              {/* Top Meta Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    Current Lifecycle State
                  </span>
                  <div className="mt-1">
                    <StatusBadge status={result.status} />
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    Target Organization
                  </span>
                  <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900 dark:text-white">
                    <Building2 className="w-4 h-4 text-emerald-500" />
                    <span>{result.company_name}</span>
                  </div>
                </div>
              </div>

              {/* Title & Category */}
              <div>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium capitalize">
                  Category: {result.category}
                </span>
                <h3 className="mt-2.5 text-lg font-bold text-slate-900 dark:text-white">
                  {result.title}
                </h3>
              </div>

              {/* Accurate Timestamps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">Accurate Filed Timestamp:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {result.filed_at ? new Date(result.filed_at).toLocaleString() : '—'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Clock className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[11px]">Last Investigation Update:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {result.updated_at ? new Date(result.updated_at).toLocaleString() : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sanitized Executive Briefing (Partial Report provided to Company) */}
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  <FileText className="w-4 h-4 text-emerald-500" />
                  <span>Sanitized Executive Summary (Shared with {result.company_name})</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-mono whitespace-pre-wrap">
                  {result.executive_summary ||
                    'Ombudsman moderation in progress. A sanitized executive brief has not yet been dispatched to company management.'}
                </div>
              </div>

              {/* Moderator / Ombudsman Note */}
              {result.moderator_note && (
                <div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Ombudsman Communication / Finding</span>
                  </div>
                  <p className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200">
                    {result.moderator_note}
                  </p>
                </div>
              )}

              {/* Whistleblower Protection Guarantee */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  Your raw submission details and identity remain exclusively locked inside the Ombudsman Escrow Vault.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}