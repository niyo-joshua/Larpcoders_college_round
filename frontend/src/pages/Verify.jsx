import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PublicLayout } from '../components/Layout.jsx';
import { api } from '../api/client.js';

export default function Verify() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!code.trim()) {
      setError('Please enter your eligibility code.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.redeemEligibility(code.trim());
      navigate('/report/new', {
        state: { credential: data.credential, expires_in: data.expires_in },
        replace: true,
      });
    } catch (err) {
      setError(err.message || 'Verification failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-semibold">Verify eligibility</h1>
        <p className="mt-2 text-sm text-slate-400">
          Enter the one-time eligibility code you received from your organization. This code is
          exchanged for a short-lived credential — it is not stored on your device.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1" htmlFor="code">
              Eligibility code
            </label>
            <input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="e.g. STU-7K2Q-9P4M"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 outline-none focus:border-emerald-500"
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
            {loading ? 'Verifying…' : 'Verify and continue'}
          </button>
        </form>

        <p className="mt-4 text-xs text-slate-500">
          Don't have a code?{' '}
          <Link to="/" className="text-slate-300 underline decoration-dotted">
            Return home
          </Link>
          .
        </p>
      </div>
    </PublicLayout>
  );
}