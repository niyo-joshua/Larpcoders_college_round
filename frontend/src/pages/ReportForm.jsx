import React, { useMemo, useState, useEffect } from 'react';
import { useLocation, useNavigate, Navigate, Link } from 'react-router-dom';
import { PublicLayout } from '../components/Layout.jsx';
import { api } from '../api/client.js';
import {
  ShieldAlert,
  Building2,
  Lock,
  Sparkles,
  AlertTriangle,
  Send,
  CheckCircle,
  FileText,
  Info
} from 'lucide-react';

const CATEGORIES = [
  { value: 'harassment', label: 'Harassment & Hostile Environment' },
  { value: 'misconduct', label: 'Executive / Management Misconduct' },
  { value: 'safety', label: 'Workplace & Operational Safety Hazard' },
  { value: 'financial', label: 'Financial Fraud & Embezzlement' },
  { value: 'academic', label: 'Academic / Research Integrity' },
  { value: 'workplace', label: 'Labor Law & Policy Violation' },
  { value: 'other', label: 'Other Serious Concern' },
];

const SEVERITIES = [
  { value: 'low', label: 'Low', desc: 'Minor policy discrepancy' },
  { value: 'medium', label: 'Medium', desc: 'Repeated or significant issue' },
  { value: 'high', label: 'High', desc: 'Critical harm, safety or fraud risk' },
];

const DEFAULT_COMPANIES = [
  'Acme Technologies',
  'Apex Logistics',
  'Nova Health Systems',
  'Global Finance Corp',
];

function findPotentialIdentifiers(text) {
  const hits = [];
  if (!text) return hits;
  if (/[\w.+-]+@[\w-]+\.[\w.-]+/.test(text)) hits.push('an email address');
  if (/(?:\+?\d[\d\s\-().]{7,}\d)/.test(text)) hits.push('a phone number');
  if (/\b\d{6,}\b/.test(text)) hits.push('an employee or ID number');
  if (/\b(?:my name is|i am|i'm)\s+[A-Z][a-z]+/i.test(text)) hits.push('your personal name');
  return hits;
}

export default function ReportForm() {
  const location = useLocation();
  const navigate = useNavigate();

  const credential = location.state?.credential;
  const blindTag = location.state?.blind_tag;
  const blindSignature = location.state?.blind_signature;
  const isBlind = location.state?.is_blind ?? false;

  const [companies, setCompanies] = useState(DEFAULT_COMPANIES);
  const [selectedCompany, setSelectedCompany] = useState(DEFAULT_COMPANIES[0]);
  const [customCompany, setCustomCompany] = useState('');
  const [useCustomCompany, setUseCustomCompany] = useState(false);

  const [category, setCategory] = useState('misconduct');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch available companies
  useEffect(() => {
    async function loadCompanies() {
      try {
        const list = await api.getCompanies();
        if (Array.isArray(list) && list.length > 0) {
          const names = list.map((c) => c.name);
          setCompanies(names);
          setSelectedCompany(names[0]);
        }
      } catch {
        // Fallback to DEFAULT_COMPANIES
      }
    }
    loadCompanies();
  }, []);

  const identifierHits = useMemo(() => findPotentialIdentifiers(description), [description]);

  // If no valid credential was received, redirect to verification
  if (!credential && !(blindTag && blindSignature)) {
    return <Navigate to="/verify" replace />;
  }

  const finalCompany = useCustomCompany ? customCompany.trim() : selectedCompany;

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    if (useCustomCompany && !customCompany.trim()) {
      setError('Please provide the target organization or company name.');
      return;
    }
    if (title.trim().length < 4) {
      setError('Please enter a descriptive report title (minimum 4 characters).');
      return;
    }
    if (description.trim().length < 20) {
      setError('Please provide sufficient incident details (at least 20 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.submitReport({
        credential: credential || undefined,
        blind_tag: blindTag || undefined,
        blind_signature: blindSignature || undefined,
        company_name: finalCompany,
        category,
        title: title.trim(),
        description: description.trim(),
        severity,
      });

      navigate('/report/success', {
        state: {
          report_id: data.report_id,
          tracking_secret: data.tracking_secret,
          company_name: data.company_name,
          filed_at: data.filed_at,
          status: data.status,
          harm_score: data.harm_score,
          harm_flags: data.harm_flags,
        },
        replace: true,
      });
    } catch (err) {
      setError(err.message || 'Submission failed. Your credential or ticket may have expired or already been spent.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto animate-fadeIn">
        {/* Verification Status Pill */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 mb-6">
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>
              {isBlind
                ? 'Chaum RSA Blind Ticket Active — Cryptographically Unlinkable'
                : 'Zero-Knowledge Eligibility Verified — Single-Use Escrow'}
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded">
            Ombudsman Escrow Vault
          </span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Submit Confidential Report
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Provide the details of your concern. Your raw account is held securely in the independent
            Ombudsman Escrow. The target company receives only a sanitized executive briefing to protect you from retaliation.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* Company Selection */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              <Building2 className="w-4 h-4 text-emerald-500" />
              <span>Target Organization</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Select Employer / Organization
              </label>
              {!useCustomCompany ? (
                <div className="space-y-2">
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  >
                    {companies.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setUseCustomCompany(true)}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    + Specify a different organization
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    placeholder="Enter custom company or institution name"
                    className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setUseCustomCompany(false)}
                    className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline"
                  >
                    ← Select from registered companies list
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Incident Details Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              <FileText className="w-4 h-4 text-emerald-500" />
              <span>Incident Information</span>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Report Title
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the issue (e.g. Unaddressed hazardous ventilation in warehouse B)"
                maxLength={120}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Severity */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Severity Level
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {SEVERITIES.map((s) => (
                  <button
                    type="button"
                    key={s.value}
                    onClick={() => setSeverity(s.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      severity === s.value
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="font-semibold text-xs capitalize">{s.label}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Incident Description
                </label>
                <span className="text-[11px] text-slate-400">
                  {description.length}/4000 characters
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={8}
                maxLength={4000}
                placeholder="Describe what occurred, dates, locations, or actions witnessed. Avoid names or details that could point back to you personally unless relevant to the inquiry."
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-y"
              />

              {/* Identifier Warning Pill */}
              {identifierHits.length > 0 && (
                <div className="mt-2.5 flex items-start gap-2 p-3 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <span className="font-semibold">Privacy Advisory:</span> Your description appears to contain{' '}
                    <span className="underline">{identifierHits.join(', ')}</span>. We recommend removing personally
                    identifying specifics to ensure absolute protection.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-sm text-red-700 dark:text-red-300 flex items-start gap-2.5 animate-fadeIn">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 disabled:opacity-60 text-white dark:text-slate-950 font-semibold py-3.5 shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                <span>Encrypting & Depositing into Escrow…</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Confidential Report</span>
              </>
            )}
          </button>

          {/* Privacy Footnote */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Your one-time ticket is burned immediately upon receipt.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Company management will never receive access to your direct wording or identity.</span>
            </div>
          </div>
        </form>
      </div>
    </PublicLayout>
  );
}