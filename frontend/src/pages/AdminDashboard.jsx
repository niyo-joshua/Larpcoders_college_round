import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../components/Layout.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { api } from '../api/client.js';
import { useAdminAuth } from '../hooks/useAdminAuth.jsx';
import {
  ShieldAlert,
  Building2,
  Lock,
  Eye,
  AlertTriangle,
  FileText,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  Flame,
  ShieldCheck,
  CheckCircle2,
  Users,
  Phone,
  UserCheck
} from 'lucide-react';


const STATUSES = [
  { value: '', label: 'All statuses' },
  { value: 'received', label: 'Received' },
  { value: 'under_review', label: 'Under review' },
  { value: 'company_notified', label: 'Company notified' },
  { value: 'investigation_active', label: 'Investigation active' },
  { value: 'resolved', label: 'Resolved' },
];

export default function AdminDashboard() {
  const { user } = useAdminAuth();
  const isModerator = user?.role === 'moderator';

  const [viewMode, setViewMode] = useState('ombudsman'); // 'ombudsman' or 'company_view'
  const [reports, setReports] = useState([]);
  const [companyReports, setCompanyReports] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('Acme Technologies');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ status: '', category: '', company: '' });

  const KNOWN_COMPANIES = [
    'Acme Technologies',
    'Apex Logistics',
    'Nova Health Systems',
    'Global Finance Corp',
  ];

  async function loadOmbudsmanReports() {
    setLoading(true);
    setError('');
    try {
      const data = await api.adminListReports(filter);
      setReports(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      setError(err.message || 'Could not load escrow reports.');
    } finally {
      setLoading(false);
    }
  }

  async function loadCompanyReports(company) {
    setLoading(true);
    setError('');
    try {
      const data = await api.adminCompanyReports(company);
      setCompanyReports(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Could not load company briefings.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (viewMode === 'ombudsman') {
      loadOmbudsmanReports();
    } else {
      loadCompanyReports(selectedCompany);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, filter.status, filter.category, filter.company, selectedCompany]);

  const counts = reports.reduce(
    (acc, r) => {
      acc.total += 1;
      if (r.ombudsman_intervention) acc.interventions += 1;
      if (r.harm_score >= 50) acc.highHarm += 1;
      if (r.status === 'resolved') acc.resolved += 1;
      return acc;
    },
    { total: 0, interventions: 0, highHarm: 0, resolved: 0 }
  );

  return (
    <AdminLayout title="Escrow Operations & Moderation Console">
      <div className="space-y-6 animate-fadeIn">
        {/* Tier Switcher Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                3-Tier Ombudsman Governance Model
              </span>
              {isModerator ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700">
                  <UserCheck className="w-3 h-3 text-emerald-600" />
                  Moderator Clearance: Reporter Phone Numbers Visible
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-300 dark:border-slate-700">
                  <Lock className="w-3 h-3 text-slate-500" />
                  Administrator Session: Reporter Phone Numbers Masked
                </span>
              )}
            </div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
              {viewMode === 'ombudsman'
                ? 'Ombudsman Escrow Vault (Full Confidential Jurisdiction)'
                : 'Company Representative Perspective (Sanitized Briefings Only)'}
            </div>
          </div>


          <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-200 dark:bg-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('ombudsman')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'ombudsman'
                  ? 'bg-white dark:bg-slate-950 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Ombudsman Vault</span>
            </button>
            <button
              onClick={() => setViewMode('company_view')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === 'company_view'
                  ? 'bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Company Preview</span>
            </button>
          </div>
        </div>

        {viewMode === 'ombudsman' ? (
          <>
            {/* KPI Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <Stat label="Total Escrowed Reports" value={counts.total} icon={<FileText className="w-4 h-4 text-emerald-500" />} />
              <Stat
                label="Active Interventions"
                value={counts.interventions}
                icon={<ShieldAlert className="w-4 h-4 text-amber-500" />}
                highlight={counts.interventions > 0}
              />
              <Stat
                label="High Harm Flags"
                value={counts.highHarm}
                icon={<Flame className="w-4 h-4 text-red-500" />}
              />
              <Stat
                label="Resolved Inquiries"
                value={counts.resolved}
                icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
              />
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <Filter className="w-3.5 h-3.5 text-emerald-500" />
                <span>Filters:</span>
              </div>

              <select
                value={filter.status}
                onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
                className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              >
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              <select
                value={filter.category}
                onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value }))}
                className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              >
                <option value="">All categories</option>
                <option value="harassment">Harassment</option>
                <option value="misconduct">Misconduct</option>
                <option value="safety">Safety</option>
                <option value="financial">Financial fraud</option>
                <option value="academic">Academic</option>
                <option value="workplace">Workplace</option>
                <option value="other">Other</option>
              </select>

              <input
                value={filter.company}
                onChange={(e) => setFilter((f) => ({ ...f, company: e.target.value }))}
                placeholder="Filter by company…"
                className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 font-mono"
              />

              <button
                onClick={loadOmbudsmanReports}
                className="ml-auto px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            {/* Reports Table */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-sm">
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  Whistleblower personal identities are mathematically absent from this ledger.
                </span>
                <span>{reports.length} records</span>
              </div>

              {loading && <div className="p-8 text-center text-slate-400 text-sm">Loading escrow records…</div>}
              {error && <div className="p-8 text-center text-red-500 text-sm">{error}</div>}

              {!loading && !error && reports.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No escrow reports match the specified criteria.
                </div>
              )}

              {!loading && !error && reports.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950/40 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-medium">
                      <tr>
                        <th className="px-4 py-3">Report & Company</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Severity & Threat</th>
                        <th className="px-4 py-3">Employee Contact</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Intervention</th>
                        <th className="px-4 py-3">Filed At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {reports.map((r) => (
                        <tr
                          key={r.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors"
                        >
                          <td className="px-4 py-3.5">
                            <Link
                              to={`/admin/reports/${r.id}`}
                              className="font-mono text-emerald-600 dark:text-emerald-400 hover:underline font-semibold block"
                            >
                              #{String(r.id).slice(0, 8)}
                            </Link>
                            <div className="font-medium text-slate-900 dark:text-white truncate max-w-xs mt-0.5">
                              {r.title}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3" />
                              <span>{r.company_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 capitalize text-slate-700 dark:text-slate-300">
                            {r.category}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="capitalize font-medium text-slate-800 dark:text-slate-200">
                              {r.severity}
                            </span>
                            {r.harm_score > 0 && (
                              <div className="mt-1 flex items-center gap-1">
                                <span
                                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                                    r.harm_score >= 50
                                      ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300'
                                      : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                  }`}
                                >
                                  Harm: {r.harm_score}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {isModerator ? (
                              r.reporter_phone ? (
                                <span className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                  <Phone className="w-3 h-3 text-emerald-500" />
                                  {r.reporter_phone}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs italic">Unspecified</span>
                              )
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                <Lock className="w-3 h-3 text-slate-400" />
                                <span>Masked (Moderator Only)</span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={r.status} />
                          </td>
                          <td className="px-4 py-3.5">
                            {r.ombudsman_intervention ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                                <ShieldAlert className="w-3 h-3 text-amber-500" />
                                Active
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">Standard</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 text-xs font-mono whitespace-nowrap">
                            {r.filed_at ? new Date(r.filed_at).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                </div>
              )}
            </div>
          </>
        ) : (
          /* Company Management Preview Perspective */
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 space-y-3">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-semibold text-sm">
                <Building2 className="w-4 h-4 text-indigo-500" />
                <span>Sanitized Corporate Briefings Console</span>
              </div>
              <p className="text-xs text-indigo-800 dark:text-indigo-300 leading-relaxed">
                This preview shows exactly what the company executive team is granted access to. Whistleblower raw narrative,
                stylometric markers, and submission metadata are fully shielded. The company only sees the sanitized executive brief
                authorized by the Ombudsman.
              </p>

              {/* Company Selector */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-indigo-900 dark:text-indigo-200">
                  Select Organization:
                </span>
                {KNOWN_COMPANIES.map((comp) => (
                  <button
                    key={comp}
                    onClick={() => setSelectedCompany(comp)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      selectedCompany === comp
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-400'
                    }`}
                  >
                    {comp}
                  </button>
                ))}
              </div>
            </div>

            {loading && <div className="p-8 text-center text-slate-400 text-sm">Loading briefings…</div>}
            {error && <div className="p-8 text-center text-red-500 text-sm">{error}</div>}

            {!loading && !error && companyReports.length === 0 && (
              <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 text-center text-slate-400 text-sm">
                No reports or briefings currently dispatched for {selectedCompany}.
              </div>
            )}

            {!loading && !error && companyReports.length > 0 && (
              <div className="space-y-4">
                {companyReports.map((cr) => (
                  <div
                    key={cr.id}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                          Dispatched Briefing #{String(cr.id).slice(0, 8)}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                          {cr.title}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={cr.status} />
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-4">
                      <span>Category: <strong className="capitalize text-slate-700 dark:text-slate-300">{cr.category}</strong></span>
                      <span>Severity: <strong className="capitalize text-slate-700 dark:text-slate-300">{cr.severity}</strong></span>
                      <span>Filed: <strong className="text-slate-700 dark:text-slate-300">{cr.filed_at ? new Date(cr.filed_at).toLocaleString() : '—'}</strong></span>
                    </div>

                    <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-800">
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Sanitized Executive Summary Dispatched by Ombudsman:</span>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                        {cr.executive_summary || 'Review pending: sanitized summary will appear once approved by Ombudsman.'}
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 italic">
                      Notice: Full whistleblower testimony and technical metadata are restricted by independent Ombudsman Escrow protocols.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Stat({ label, value, icon, highlight }) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm transition-all ${
        highlight
          ? 'border-amber-400/50 bg-amber-500/5 dark:bg-amber-500/10'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
      }`}
    >
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}