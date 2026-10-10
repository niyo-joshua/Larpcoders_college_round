import React from 'react';

export default function StatusBadge({ status, pulse = false }) {
  const map = {
    received: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
    under_review: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
    company_notified: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    investigation_active: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
    resolved: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  };

  const labelMap = {
    received: 'Received & Escrowed',
    under_review: 'Under Ombudsman Review',
    company_notified: 'Company Sanitized Brief Dispatched',
    investigation_active: 'Active Intervention Ongoing',
    resolved: 'Resolved & Closed',
  };

  const label = labelMap[status] || (status ? status.replace(/_/g, ' ') : 'Unknown');

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-medium capitalize transition-colors ${
        map[status] || 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800'
      }`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
      {label}
    </span>
  );
}