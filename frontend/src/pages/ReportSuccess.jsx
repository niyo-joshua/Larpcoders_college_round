import React, { useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { PublicLayout } from '../components/Layout.jsx';
import {
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Lock,
  Building2,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export default function ReportSuccess() {
  const location = useLocation();
  const { report_id, tracking_secret, company_name, filed_at } = location.state || {};
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  if (!report_id) return <Navigate to="/" replace />;

  const formattedDate = filed_at
    ? new Date(filed_at).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : new Date().toLocaleString();

  async function copyToClipboard(text, setter) {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch {
      /* clipboard fallback */
    }
  }

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(
        `Organization: ${company_name || 'Confidential'}\nReport ID: ${report_id}\nTracking Secret: ${tracking_secret}\nFiled At: ${formattedDate}`
      );
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      /* clipboard fallback */
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-xl mx-auto animate-fadeIn">
        {/* Success Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-3 ring-8 ring-emerald-50 dark:ring-emerald-900/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Report Securely Escrowed
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Your submission has been cryptographically severed from your eligibility credential and deposited
            into the independent Ombudsman Escrow.
          </p>
        </div>

        {/* Essential Tracking Credentials Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 sm:p-7 shadow-sm space-y-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              Private Access Keys
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Save these now</span>
          </div>

          {/* Target Company & Timestamp meta */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" /> Target Org:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block truncate">
                {company_name || 'Acme Technologies'}
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" /> Filing Timestamp:
              </span>
              <span className="font-semibold text-slate-900 dark:text-white mt-0.5 block truncate">
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Report ID */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">Report Reference ID</span>
              <button
                type="button"
                onClick={() => copyToClipboard(report_id, setCopiedId)}
                className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium text-[11px]"
              >
                {copiedId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedId ? 'Copied' : 'Copy ID'}
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-sm text-slate-900 dark:text-white break-all">
              {report_id}
            </div>
          </div>

          {/* Tracking Secret */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Tracking Secret (Private Key)
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(tracking_secret, setCopiedSecret)}
                className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium text-[11px]"
              >
                {copiedSecret ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedSecret ? 'Copied' : 'Copy secret'}
              </button>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-sm text-emerald-600 dark:text-emerald-400 break-all select-all font-bold">
              {tracking_secret}
            </div>
          </div>

          {/* Warning */}
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <span className="font-semibold">Irrecoverable Key:</span> Because this platform stores only a SHA-256 hash of your tracking secret, it cannot be reset or recovered. Store it in a safe place.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={copyAll}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-900 dark:text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              {copiedAll ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copiedAll ? 'All Details Copied!' : 'Copy All Details'}</span>
            </button>
            <Link
              to="/track"
              state={{ defaultReportId: report_id, defaultSecret: tracking_secret }}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <span>Track Investigation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Protection Summary */}
        <div className="mt-6 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
          <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>How your report is handled:</span>
          </div>
          <p>
            1. The independent Ombudsman reviews your submission for validity and prepares a sanitized partial summary for {company_name || 'the company'}.
          </p>
          <p>
            2. In critical incidents requiring external inquiry, the Ombudsman uses the full escrow record to intervene.
          </p>
          <p>
            3. Your personal identity remains unlinked and mathematically shielded at all times.
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}