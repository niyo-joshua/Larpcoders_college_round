import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth.jsx';

export function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <header className="border-b border-slate-800/60">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_12px] shadow-emerald-400/60" />
            <span className="font-semibold tracking-wide">Incognito</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-300">
            <Link to="/track" className="hover:text-white">Track a report</Link>
            <Link to="/security" className="hover:text-white">Security</Link>
            <Link
              to="/admin/login"
              className="px-3 py-1.5 rounded-md border border-slate-700 hover:border-slate-500 hover:text-white"
            >
              Admin
            </Link>
          </nav>
        </div>
      </header>
      <div className="max-w-5xl mx-auto px-6 py-10">{children}</div>
      <footer className="max-w-5xl mx-auto px-6 py-8 text-xs text-slate-500">
        This is a privacy-preserving reporting prototype. No identity is attached to submitted reports.
      </footer>
    </div>
  );
}

export function AdminLayout({ children, title }) {
  const { logout, user } = useAdminAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800/60 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-widest text-emerald-400">Incognito</span>
            <span className="text-slate-600">/</span>
            <span className="text-sm text-slate-300">{title || 'Admin'}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-slate-400">{user?.username || 'admin'}</span>
            <button
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
              className="px-3 py-1.5 rounded-md border border-slate-700 hover:border-slate-500 text-slate-200"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-6 py-8">{children}</div>
    </div>
  );
}