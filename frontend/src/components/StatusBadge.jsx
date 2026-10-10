import React from 'react';

export default function StatusBadge({ status }) {
  const map = {
    received: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
    under_review: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    resolved: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  };
  const label = status ? status.replace('_', ' ') : 'unknown';
  return (
    <span
      className={`px-2 py-0.5 rounded-full border text-xs capitalize ${
        map[status] || 'border-slate-700 text-slate-300'
      }`}
    >
      {label}
    </span>
  );
}