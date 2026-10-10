import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth.jsx';
import { useTheme } from '../hooks/useTheme.jsx';
import { Shield, Sun, Moon, Lock, Search, FileText, CheckCircle2 } from 'lucide-react';

export function PublicLayout({ children }) {
  const { theme, toggleTheme, isDark } = useTheme();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-30 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform duration-200">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                Incognito
                <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Escrow
                </span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 -mt-0.5">
                Independent Whistleblower Platform
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4 text-sm font-medium">
            <Link
              to="/verify"
              className={`px-3 py-1.5 rounded-lg transition-colors duration-150 ${
                location.pathname === '/verify'
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              File a Report
            </Link>

            <Link
              to="/track"
              className={`px-3 py-1.5 rounded-lg transition-colors duration-150 ${
                location.pathname === '/track'
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              Track Status
            </Link>

            <Link
              to="/security"
              className={`px-3 py-1.5 rounded-lg transition-colors duration-150 ${
                location.pathname === '/security'
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              Security Architecture
            </Link>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle light/dark theme"
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-all duration-200"
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <Link
              to="/admin/login"
              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-all text-xs font-semibold"
            >
              Ombudsman Portal
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-6 py-10 animate-fade-in">{children}</div>

      {/* Professional Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/50 dark:bg-slate-950/50 py-8 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>End-to-End Blind Cryptographic Isolation. Protected under Whistleblower Escrow.</span>
          </div>
          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400">
            <span>Metadata Stripped</span>
            <span>•</span>
            <span>Zero IP Logging</span>
            <span>•</span>
            <span>Chaum Blind Signatures</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function AdminLayout({ children, title }) {
  const { logout, user } = useAdminAuth();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">Incognito Escrow</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-sm font-medium text-slate-200">{title || 'Ombudsman Investigation Console'}</span>
          </div>

          <div className="flex items-center gap-3 text-sm">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white transition"
              title="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>

            <span className="px-2.5 py-1 rounded bg-slate-800/80 text-xs font-mono text-emerald-400 border border-slate-700">
              {user?.username || 'ombudsman'} ({user?.role || 'investigator'})
            </span>

            <button
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 hover:bg-slate-800 text-xs font-medium text-slate-200 transition"
            >
              Secure Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 animate-fade-in">{children}</div>
    </div>
  );
}