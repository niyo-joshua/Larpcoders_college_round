import React from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '../components/Layout.jsx';
import { Shield, EyeOff, Lock, FileCheck2, AlertCircle, Building2, ChevronRight, UserCheck } from 'lucide-react';

export default function Landing() {
  return (
    <PublicLayout>
      <section className="max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4 animate-slide-up">
          <Shield className="w-3.5 h-3.5" />
          Independent Whistleblower Escrow Platform
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
          Speak with conviction. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400">
            Protected by cryptographic escrow.
          </span>
        </h1>

        {/* Subhead */}
        <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
          Report workplace harassment, safety mishaps, and ethical violations inside your organization
          without risking your position or identity. An independent ombudsman moderates your concern,
          shields your personal details from company discovery, and intervenes when corrective action is needed.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            to="/verify"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-semibold text-base shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            File an Anonymous Report
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            to="/track"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-white/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white font-medium text-base shadow-sm hover:-translate-y-0.5 transition-all duration-200"
          >
            Track Existing Report
          </Link>
          <Link
            to="/security"
            className="inline-flex items-center gap-2 px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors"
          >
            Security & Proofs →
          </Link>
        </div>

        {/* 3-Tier Ombudsman Trust Model Section */}
        <div className="mt-16 pt-10 border-t border-slate-200 dark:border-slate-800/80">
          <div className="text-center sm:text-left mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              The Three-Tier Whistleblower Escrow Framework
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Designed specifically so employees can report internal wrongdoing with complete safety against retaliation.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Tier 1 */}
            <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="h-10 w-10 rounded-xl bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold mb-4">
                1st
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Independent Moderation
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                You select your company and file anonymously. Our independent ombudsman moderates the report first,
                authoring a sanitized executive brief for company management that completely strips speech mannerisms,
                timestamps, and retaliatory clues.
              </p>
            </div>

            {/* Tier 2 */}
            <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold mb-4">
                2nd
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Intervention in Mishaps
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                In cases of acute danger, safety mishaps, or management inaction, the ombudsman steps in directly.
                The full confidential record is unsealed within the external investigation vault to enforce compliance
                and trigger third-party inspection.
              </p>
            </div>

            {/* Tier 3 */}
            <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold mb-4">
                3rd
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Absolute Whistleblower Shield
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Your personal identity is never stored in the database. Even if the platform or the company’s servers
                are audited or compelled, there is zero cryptographic link between your membership code and the report filed.
              </p>
            </div>
          </div>
        </div>

        {/* Security Pillars Grid */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: UserCheck,
              t: 'Anonymous Membership Check',
              d: 'Eligibility codes prove you belong to the organization without revealing your identity.',
            },
            {
              icon: EyeOff,
              t: 'Chaum Blind Signatures',
              d: 'Mathematical blinding guarantees the issuance authority cannot recognize your submission token.',
            },
            {
              icon: FileCheck2,
              t: 'Duplicate & Spam Prevention',
              d: 'Canonical fingerprinting suppresses duplicate incident floods and bot spam while protecting privacy.',
            },
          ].map((c) => (
            <div
              key={c.t}
              className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-100/50 dark:bg-slate-900/40 p-4 transition-colors"
            >
              <c.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mb-2" />
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{c.t}</div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{c.d}</div>
            </div>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}