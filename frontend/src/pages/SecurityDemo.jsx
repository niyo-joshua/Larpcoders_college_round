import React, { useState } from 'react';
import { PublicLayout } from '../components/Layout.jsx';
import { api } from '../api/client.js';

const CHECKLIST = [
  'Invalid credential rejected',
  'Credential replay rejected',
  'Concurrent replay rejected',
  'No identity in report records',
  'Admin routes protected',
  'Tracking secret protected',
  'Logs reviewed',
  'Errors reveal no secrets',
];

export default function SecurityDemo() {
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);

  function append(line) {
    setLog((l) => [...l, { t: new Date().toLocaleTimeString(), line }]);
  }

  async function testValid() {
    setBusy(true);
    append('Testing valid credential against /api/reports…');
    try {
      const { credential } = await api.redeemEligibility('STU-DEMO-0001');
      await api.submitReport({
        credential,
        category: 'misconduct',
        title: 'Demo valid submission',
        description: 'This is a demonstration submission from the security page.',
        severity: 'low',
      });
      append('✔ Accepted (as expected).');
    } catch (err) {
      append(`✘ Unexpected rejection: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function testForged() {
    setBusy(true);
    append('Testing forged credential…');
    try {
      await api.submitReport({
        credential: 'forged.invalid.signature',
        category: 'misconduct',
        title: 'Forged credential test',
        description: 'This submission should be rejected.',
        severity: 'low',
      });
      append('✘ Forged credential was accepted — investigate.');
    } catch (err) {
      append(`✔ Rejected as expected: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function testReplay() {
    setBusy(true);
    append('Testing credential replay…');
    try {
      const { credential } = await api.redeemEligibility('STU-DEMO-0001');
      await api.submitReport({
        credential,
        category: 'safety',
        title: 'First use of one-time credential',
        description: 'First submission with the one-time credential.',
        severity: 'low',
      });
      append('First submission accepted.');
      try {
        await api.submitReport({
          credential,
          category: 'safety',
          title: 'Replay attempt',
          description: 'Second submission with the same credential.',
          severity: 'low',
        });
        append('✘ Replay was accepted — investigate.');
      } catch (err) {
        append(`✔ Replay rejected as expected: ${err.message}`);
      }
    } catch (err) {
      append(`First submission failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold">Security demonstration</h1>
        <p className="mt-2 text-sm text-slate-400">
          Live checks against the backend. Results depend on your credential service implementation.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            disabled={busy}
            onClick={testValid}
            className="px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-500 disabled:opacity-60 text-sm"
          >
            Test valid credential
          </button>
          <button
            disabled={busy}
            onClick={testForged}
            className="px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-500 disabled:opacity-60 text-sm"
          >
            Test forged credential
          </button>
          <button
            disabled={busy}
            onClick={testReplay}
            className="px-4 py-2 rounded-lg border border-slate-700 hover:border-slate-500 disabled:opacity-60 text-sm"
          >
            Test credential replay
          </button>
        </div>

        <div className="mt-6 rounded-xl border border-slate-800 bg-black/40 p-4 font-mono text-xs text-slate-200 min-h-[160px]">
          {log.length === 0 && <div className="text-slate-500">No tests run yet.</div>}
          {log.map((entry, i) => (
            <div key={i} className="py-0.5">
              <span className="text-slate-500">[{entry.t}]</span> {entry.line}
            </div>
          ))}
        </div>

        <div className="mt-8">
          <div className="text-xs uppercase tracking-widest text-slate-500">Acceptance checklist</div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-sm text-slate-300">
            {CHECKLIST.map((c) => (
              <li key={c} className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {c}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
          <div className="font-medium text-slate-200">Known limitations</div>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>
              A signed token that encodes a member ID is not unlinkable. This prototype separates
              identity from reports but does not provide cryptographic unlinkability.
            </li>
            <li>
              Coarse timestamps reduce correlation risk but do not eliminate it.
            </li>
            <li>
              Stronger privacy requires an anonymous-credential or blind-signature scheme.
            </li>
          </ul>
        </div>
      </div>
    </PublicLayout>
  );
}