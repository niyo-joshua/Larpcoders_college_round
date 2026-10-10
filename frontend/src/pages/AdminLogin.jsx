import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicLayout } from '../components/Layout.jsx';
import { api } from '../api/client.js';
import { useAdminAuth } from '../hooks/useAdminAuth.jsx';

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
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-sm mx-auto">
        <h1 className="text-2xl font-semibold">Administrator login</h1>
        <p className="mt-2 text-sm text-slate-400">
          For moderators reviewing reports. Administrators never see who submitted a report.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2.5 outline-none focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
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
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </PublicLayout>
  );
}