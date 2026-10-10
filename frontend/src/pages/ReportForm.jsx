import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { PublicLayout } from '../components/Layout.jsx';
import { api } from '../api/client.js';

const CATEGORIES = [
  { value: 'harassment', label: 'Harassment' },
  { value: 'misconduct', label: 'Misconduct' },
  { value: 'safety', label: 'Safety' },
  { value: 'academic', label: 'Academic concern' },
  { value: 'workplace', label: 'Workplace concern' },
  { value: 'other', label: 'Other' },
];

const SEVERITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

function findPotentialIdentifiers(text) {
  const hits = [];
  if (!text) return hits;
  if (/[\w.+-]+@[\w-]+\.[\w.-]+/.test(text)) hits.push('an email address');
  if (/(?:\+?\d[\d\s\-().]{7,}\d)/.test(text)) hits.push('a phone number');
  if (/\b\d{6,}\b/.test(text)) hits.push('a long ID number');
  if (/\b(?:my name is|i am|i'm)\s+[A-Z][a-z]+/i.test(text)) hits.push('your own name');
  return hits;
}

export default function ReportForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const credential = location.state?.credential;

  const [category, setCategory] = useState('misconduct');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const identifierHits = useMemo(() => findPotentialIdentifiers(description), [description]);

  if (!credential) {
    return <Navigate to="/verify" replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');

    if (title.trim().length < 4) {
      setError('Please add a short, descriptive title.');
      return;
    }
    if (description.trim().length < 20) {
      setError('Please provide more detail (at least 20 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const data = await api.submitReport({
        credential,
        category,
        title: title.trim(),
        description: description.trim(),
        severity,
      });
      navigate('/report/success', {
        state: {
          report_id: data.report_id,
          tracking_secret: data.tracking_secret,
        },
        replace: true,
      });
    } catch (err) {
      setError(err.message || 'Submission failed. Your credential may have already been used.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 text-xs text-emerald-400">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Eligibility verified · Identity kept separate
        </div>

        <h1 className="mt-3 text-2xl font-semibold">Submit a report</h1>
        <p className="mt-2 text-sm text-slate-400">
          Describe what happened. Do not include your own name, email, or ID unless it is essential
          to the report.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 outline-none focus:border-emerald-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Report title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Briefly describe your concern"
              maxLength={120}
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">What happened?</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={8}
              maxLength={4000}
              placeholder="Provide the relevant details…"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 outline-none focus:border-emerald-500 resize-y"
            />
            <div className="mt-1 text-xs text-slate-500">
              {description.length}/4000
            </div>

            {identifierHits.length > 0 && (
              <div className="mt-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-900/60 rounded-lg px-3 py-2">
                Your description may contain {identifierHits.join(', ')}. Consider removing
                identifying details before submitting.
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Severity</label>
            <div className="flex gap-2">
              {SEVERITIES.map((s) => (
                <button
                  type="button"
                  key={s.value}
                  onClick={() => setSeverity(s.value)}
                  className={`px-4 py-2 rounded-lg border text-sm ${
                    severity === s.value
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                      : 'border-slate-700 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-950/40 border border-red-900/60 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-medium py-3"
          >
            {submitting ? 'Submitting securely…' : 'Submit securely'}
          </button>

          <p className="text-xs text-slate-500">
            Your credential is used once and is not stored with the report.
          </p>
        </form>
      </div>
    </PublicLayout>
  );
}