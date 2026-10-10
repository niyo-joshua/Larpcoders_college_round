import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PublicLayout } from '../components/Layout.jsx';
import { api } from '../api/client.js';
import { blindMessage, unblindSignature } from '../api/blindSignature.js';
import { ShieldCheck, Lock, Sparkles, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';

export default function Verify() {
  const [code, setCode] = useState('');
  const [useBlindSig, setUseBlindSig] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stepStatus, setStepStatus] = useState('');
  const navigate = useNavigate();

  const DEMO_CODES = [
    { code: 'STU-7K2Q-9P4M', label: 'Acme Tech Employee' },
    { code: 'EMP-4H8J-2N6R', label: 'Apex Logistics Staff' },
    { code: 'CORP-SAFE-2026', label: 'Global Finance Corp' },
  ];

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    const cleanCode = code.trim();
    if (!cleanCode) {
      setError('Please enter your membership or employee eligibility code.');
      return;
    }

    setLoading(true);

    try {
      if (useBlindSig) {
        // Chaum RSA Blind Signature Flow
        setStepStatus('Fetching public cryptographic parameters…');
        const pubParams = await api.getBlindPublicKey();

        setStepStatus('Generating client-side random ticket & blinding…');
        const ticketTag = 'ticket_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        const { blindedMessageHex, rHex } = await blindMessage(ticketTag, pubParams.n, pubParams.e);

        setStepStatus('Requesting blind signature from ombudsman authority…');
        const blindRes = await api.blindSign({
          eligibility_code: cleanCode,
          blinded_message: blindedMessageHex,
        });

        setStepStatus('Unblinding cryptographic signature locally…');
        const unblindedSig = unblindSignature(blindRes.blinded_signature, rHex, pubParams.n);

        navigate('/report/new', {
          state: {
            blind_tag: ticketTag,
            blind_signature: unblindedSig,
            is_blind: true,
            expires_in: 900,
          },
          replace: true,
        });
      } else {
        // Standard Ed25519 single-use signed token flow
        setStepStatus('Verifying eligibility code…');
        const data = await api.redeemEligibility(cleanCode);
        navigate('/report/new', {
          state: { credential: data.credential, expires_in: data.expires_in, is_blind: false },
          replace: true,
        });
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your eligibility code.');
    } finally {
      setLoading(false);
      setStepStatus('');
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center sm:text-left mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Lock className="w-3.5 h-3.5" />
            Zero-Knowledge Verification
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Verify Member Eligibility
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Enter your internal company or campus eligibility code. Verification proves you are an authorized member
            without attaching your identity to any report.
          </p>
        </div>

        {/* Verification Form Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 sm:p-8 shadow-sm">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                htmlFor="code"
              >
                Eligibility or Employee Code
              </label>
              <input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="e.g. STU-7K2Q-9P4M or EMP-4H8J-2N6R"
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono text-sm"
              />
            </div>

            {/* Quick Demo Code Fill Pills */}
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-emerald-500" />
                Quick demo codes (click to fill):
              </div>
              <div className="flex flex-wrap gap-2">
                {DEMO_CODES.map((item) => (
                  <button
                    type="button"
                    key={item.code}
                    onClick={() => setCode(item.code)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-100/70 dark:bg-slate-800/60 hover:border-emerald-500 text-slate-700 dark:text-slate-300 font-mono transition-colors"
                  >
                    {item.code} <span className="text-[10px] text-slate-500">({item.label})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cryptographic Scheme Selector */}
            <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useBlindSig}
                  onChange={(e) => setUseBlindSig(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Use Chaum RSA Blind Signature (Cryptographic Unlinkability)
                  </span>
                  <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                    Mathematically blinds your ticket before sending. The server signs it without ever seeing the
                    underlying ticket data.
                  </p>
                </div>
              </label>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 disabled:opacity-60 text-white dark:text-slate-950 font-semibold py-3 shadow-md transition-all text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  <span>{stepStatus || 'Verifying credentials…'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify and Proceed to Report</span>
                </>
              )}
            </button>
          </form>

          {/* Privacy Note */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Your code is verified in-memory and immediately discarded.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Zero client IP address or browser fingerprints are recorded.</span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          Already filed a report?{' '}
          <Link to="/track" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
            Track status with your private secret
          </Link>
        </p>
      </div>
    </PublicLayout>
  );
}