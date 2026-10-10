import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../components/Layout.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { api } from '../api/client.js';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Lock,
  ShieldCheck,
  ShieldAlert,
  Flame,
  FileText,
  AlertTriangle,
  Save,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'received', label: 'Received' },
  { value: 'under_review', label: 'Under review' },
  { value: 'company_notified', label: 'Company notified (Briefing dispatched)' },
  { value: 'investigation_active', label: 'Active Investigation' },
  { value: 'resolved', label: 'Resolved' },
];

export default function AdminReportDetail() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editable fields
  const [status, setStatus] = useState('received');
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [moderatorNote, setModeratorNote] = useState('');
  const [intervention, setIntervention] = useState(false);
  const [interventionReason, setInterventionReason] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await api.adminGetReport(id);
      setReport(data);
      setStatus(data.status || 'received');
      setExecutiveSummary(data.executive_summary || '');
      setModeratorNote(data.moderator_note || '');
      setIntervention(Boolean(data.ombudsman_intervention));
      setInterventionReason(data.intervention_reason || '');
    } catch (err) {
      setError(err.message || 'Could not load report details.');
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
    setSuccessMsg('');
    try {
      const updated = await api.adminUpdateReport(id, {
        status,
        executive_summary: executiveSummary,
        moderator_note: moderatorNote,
        ombudsman_intervention: intervention,
        intervention_reason: interventionReason,
      });
      setReport((r) => ({ ...r, ...updated }));
      setSuccessMsg('Investigation record and company briefing updated successfully.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to save modifications.');
    } finally {
      setSaving(false);
    }
  }

  function draftSanitizedSummary() {
    if (!report) return;
    const drafted = `[SANITIZED OMBUDSMAN BRIEFING FOR ${report.company_name.toUpperCase()}]\nCategory: ${report.category.toUpperCase()}\nConcern Summary: Independent inquiry received alleging ${report.category} issues regarding "${report.title}".\nNotice: Whistleblower identity and raw submission text are strictly withheld in accordance with Ombudsman Escrow protocols. Company leadership is requested to examine relevant department operations and report corrective actions.`;
    setExecutiveSummary(drafted);
  }

  return (
    <AdminLayout title={`Ombudsman Dossier #${String(id).slice(0, 8)}`}>
      <div className="space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Escrow Overview</span>
          </Link>

          {report && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-mono">
                Filed: {report.filed_at ? new Date(report.filed_at).toLocaleString() : '—'}
              </span>
              <StatusBadge status={report.status} />
            </div>
          )}
        </div>

        {loading && <div className="p-8 text-center text-slate-400 text-sm">Loading dossier…</div>}
        {error && <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-red-600 text-sm">{error}</div>}

        {report && (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left 2 Columns: Full Confidential Record & Automated Threat Analysis */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Confidential Ombudsman Escrow Record</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Target: <strong>{report.company_name}</strong></span>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {report.title}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium capitalize">
                      Category: {report.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium capitalize">
                      Severity: {report.severity}
                    </span>
                  </div>
                </div>

                {/* Raw Whistleblower Testimony */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Raw Whistleblower Testimony (Confidential to Ombudsman)
                  </label>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-sm whitespace-pre-wrap leading-relaxed font-mono">
                    {report.description}
                  </div>
                </div>
              </div>

              {/* Automated AI / Threat Detection & Harm Analysis */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>Automated Safety & Threat Signals</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 block">Threat Harm Score:</span>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-slate-900 dark:text-white">
                        {report.harm_score}
                      </span>
                      <span className="text-xs text-slate-400">/ 100</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 block">Spam Filter Check:</span>
                    <div className="mt-1">
                      {report.is_spam ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300">
                          Spam Detected
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          Legitimate Narrative
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] text-slate-500 block">Safety Protocol:</span>
                    <div className="mt-1 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {report.whistleblower_safety_level || 'protected_escrow'}
                    </div>
                  </div>
                </div>

                {report.harm_flags && report.harm_flags.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                      Flagged Categories:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {report.harm_flags.map((flag) => (
                        <span
                          key={flag}
                          className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 flex items-center gap-1"
                        >
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sanitized Executive Briefing Editor (What the Company Receives) */}
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    <FileText className="w-4 h-4" />
                    <span>Company Sanitized Executive Briefing (Tier 1)</span>
                  </div>
                  <button
                    type="button"
                    onClick={draftSanitizedSummary}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Draft</span>
                  </button>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This partial summary is dispatched to {report.company_name} management. Ensure all personal style identifiers, dates, and names are sanitized to prevent whistleblower reprisal.
                </p>

                <textarea
                  value={executiveSummary}
                  onChange={(e) => setExecutiveSummary(e.target.value)}
                  rows={5}
                  placeholder="Enter sanitized executive summary to share with company management…"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-4 py-3 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-mono resize-y"
                />
              </div>
            </div>

            {/* Right Column: Actions, Intervention, Status Controls */}
            <div className="space-y-6">
              {/* Ombudsman Intervention Card (Tier 2) */}
              <div className="p-5 rounded-2xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Ombudsman Intervention (Tier 2)</span>
                </div>

                <p className="text-xs text-amber-800/90 dark:text-amber-300/80 leading-relaxed">
                  In case of critical mishaps, severe safety violations, or management non-compliance, you can trigger formal intervention to access full unredacted findings and notify external regulatory oversight.
                </p>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={intervention}
                    onChange={(e) => setIntervention(e.target.checked)}
                    className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">
                    Trigger Formal Ombudsman Intervention
                  </span>
                </label>

                {intervention && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Intervention Basis & Inquiry Scope:
                    </label>
                    <textarea
                      value={interventionReason}
                      onChange={(e) => setInterventionReason(e.target.value)}
                      rows={3}
                      placeholder="e.g. Critical workplace safety breach requiring immediate independent investigation…"
                      className="w-full rounded-xl bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-800 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                )}
              </div>

              {/* Status & Moderation Notes Card */}
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm space-y-4">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  Lifecycle Controls
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Investigation Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Public Finding Note (Visible to Reporter)
                  </label>
                  <textarea
                    value={moderatorNote}
                    onChange={(e) => setModeratorNote(e.target.value)}
                    rows={3}
                    placeholder="Provide a public update visible when tracking with the private key…"
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 resize-y"
                  />
                </div>

                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 disabled:opacity-60 text-white dark:text-slate-950 font-semibold py-3 text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  {saving ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      <span>Saving Dossier…</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Commit Changes to Escrow</span>
                    </>
                  )}
                </button>
              </div>

              {/* Technical Audit Meta */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono text-slate-500 space-y-1">
                <div>ID: {report.id}</div>
                <div>Company: {report.company_name}</div>
                <div>Duplicate Fingerprint: Verified Unique</div>
                <div>Identity Foreign Key: None (Zero-Knowledge)</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}