import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '../components/Layout.jsx';
import { api } from '../api/client.js';
import { useAdminAuth } from '../hooks/useAdminAuth.jsx';
import { Lock, ShieldCheck, KeyRound, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.adminLogin({ username, password });
      login(data.token, data.user || { username });
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  }

  function fillAdmin() {
    setUsername('admin');
    setPassword('incognito123');
  }

  function fillModerator() {
    setUsername('moderator');
    setPassword('moderator123');
  }

  return (
    <PublicLayout>
      <div className="max-w-md mx-auto animate-fadeIn">
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mb-3 ring-8 ring-emerald-50 dark:ring-emerald-900/20">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Escrow Authority & Moderation
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            Sign in as an Administrator (reports oversight) or as a Moderator (direct liaison with access to verified reporter phone numbers).
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 sm:p-7 shadow-sm">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Username / Identifier
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="e.g. admin or moderator"
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••••••"
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 disabled:opacity-60 text-white dark:text-slate-950 font-semibold py-3 text-sm flex items-center justify-center gap-2 shadow-md transition-all"
            >
              {loading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  <span>Authenticating…</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate to Console</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Quick demo accounts (click to fill):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={fillAdmin}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:border-emerald-500 text-left transition-colors"
              >
                <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-emerald-500" />
                  <span>Admin Login</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  admin / incognito123
                </div>
                <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                  (Phone numbers masked)
                </div>
              </button>

              <button
                type="button"
                onClick={fillModerator}
                className="p-2.5 rounded-xl border border-emerald-300/60 dark:border-emerald-700/60 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-500 text-left transition-colors"
              >
                <div className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-emerald-500" />
                  <span>Moderator Login</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                  moderator / moderator123
                </div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium mt-1">
                  (Can see employee phones)
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}