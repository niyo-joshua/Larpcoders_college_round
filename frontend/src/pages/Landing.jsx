import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../components/Layout.jsx';

export default function Landing() {
  return (
    <PublicLayout>
      <section className="max-w-3xl">
        <p className="text-emerald-400 text-sm font-medium tracking-widest uppercase">
          Speak without being seen
        </p>
        <h1 className="mt-3 text-4xl md:text-5xl font-semibold leading-tight">
          A safer way to raise a concern.
        </h1>
        <p className="mt-5 text-slate-300 text-lg">
          Share a report anonymously. Your eligibility is verified, but your identity is never
          attached to what you submit — and administrators cannot retrieve it.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/verify"
            className="px-5 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-medium"
          >
            Start a report →
          </Link>
          <Link
            to="/track"
            className="px-5 py-3 rounded-lg border border-slate-700 hover:border-slate-500"
          >
            Track an existing report
          </Link>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              t: 'Verified access',
              d: 'Only eligible members can submit. One-time credentials prevent reuse.',
            },
            {
              t: 'Unlinkable reports',
              d: 'Reports never store your member ID, email, or the credential used.',
            },
            {
              t: 'Admin privacy',
              d: 'Administrators review and moderate reports without seeing who sent them.',
            },
          ].map((c) => (
            <div key={c.t} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="text-sm font-semibold text-slate-100">{c.t}</div>
              <div className="mt-1 text-sm text-slate-400">{c.d}</div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs text-slate-500">
          Note: this prototype demonstrates privacy separation and replay prevention. It does not
          yet provide cryptographic unlinkability — see the Security page for details.
        </p>
      </section>
    </PublicLayout>
  );
}