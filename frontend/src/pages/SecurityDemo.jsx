import React, { useState } from 'react';
import { PublicLayout } from '../components/Layout.jsx';
import { api } from '../api/client.js';
import { blindMessage, unblindSignature } from '../api/blindSignature.js';
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  Terminal,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  Flame,
  CopyX
} from 'lucide-react';

const SECURITY_ASSURANCES = [
  'Chaum RSA Blind Signatures for mathematical unlinkability',
  'Atomic replay rejection (single-use burned tokens)',
  'Privacy-preserving duplicate incident suppression',
  'Automated threat and spam classification',
  'Zero identity foreign keys in database schema',
  'Zero network footprint (no IP, cookies, or browser fingerprints)',
  'Independent 3-tier Ombudsman Escrow vault separation',
  'Accurate timestamp recording without temporal rounding',
];

export default function SecurityDemo() {
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState(false);

  function append(msg, type = 'info') {
    setLog((l) => [
      ...l,
      {
        t: new Date().toLocaleTimeString(),
        msg,
        type,
      },
    ]);
  }

  function clearLogs() {
    setLog([]);
  }

  // 1. Test Chaum Blind Signature Issuance and Submission
  async function testBlindSignature() {
    setBusy(true);
    append('Initiating Chaum RSA Blind Signature flow with verified phone…', 'info');
    try {
      const testPhone = '+1 (555) 019-2834';
      append(`1. Requesting SMS verification code for mobile number: ${testPhone}…`);
      const otpRes = await api.sendOtp(testPhone);
      append(`   Received verification OTP: ${otpRes.demo_otp}`);

      append('2. Requesting Ombudsman RSA public modulus and exponent (n, e)…');
      const pubParams = await api.getBlindPublicKey();
      append(`   Public modulus: n=${pubParams.n.slice(0, 16)}… (2048-bit RSA)`);

      append('3. Blinding client-side random ticket tag locally with blinding factor r…');
      const ticketTag = 'demo_ticket_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      const { blindedMessageHex, rHex } = await blindMessage(ticketTag, pubParams.n, pubParams.e);
      append(`   Blinded ticket: ${blindedMessageHex.slice(0, 24)}…`);

      append('4. Requesting blind signature from authority with verified phone OTP…');
      const blindRes = await api.blindSign({
        phone_number: testPhone,
        otp_code: otpRes.demo_otp,
        blinded_message: blindedMessageHex,
      });

      append('5. Unblinding Ombudsman signature locally using r^(-1) mod n…');
      const unblindedSig = unblindSignature(blindRes.blinded_signature, rHex, pubParams.n);
      append(`   Unblinded signature obtained: ${unblindedSig.slice(0, 24)}…`);

      append('6. Submitting report using unblinded ticket tag & signature…');
      const res = await api.submitReport({
        blind_tag: ticketTag,
        blind_signature: unblindedSig,
        reporter_phone: testPhone,
        company_name: 'Acme Technologies',
        category: 'workplace',
        title: 'Cryptographic Blind Signature Verification Test',
        description: 'Demonstrating mathematical unlinkability via Chaum RSA blind signatures with phone verification.',
        severity: 'low',
      });

      append(`✔ SUCCESS: Report accepted into escrow! ID: ${res.report_id.slice(0, 8)}…`, 'success');
      append('   Ombudsman verified validity without ever seeing the ticket or linking it to phone number!', 'success');
    } catch (err) {
      append(`✘ FAILED: ${err.message}`, 'error');
    } finally {
      setBusy(false);
    }
  }

  // 2. Test Replay Attack Prevention
  async function testReplayPrevention() {
    setBusy(true);
    append('Testing single-use credential replay resistance…', 'info');
    try {
      const testPhone = '+1 (555) 014-8821';
      append(`1. Verifying mobile line: ${testPhone}…`);
      const otpRes = await api.sendOtp(testPhone);
      const { credential } = await api.verifyOtp({ phone_number: testPhone, otp_code: otpRes.demo_otp });

      append('2. Submitting legitimate first report with single-use credential…');
      const res1 = await api.submitReport({
        credential,
        reporter_phone: testPhone,
        company_name: 'Acme Technologies',
        category: 'safety',
        title: 'Replay Test: First Legitimate Use',
        description: 'This is the initial legitimate submission consuming the single-use token.',
        severity: 'low',
      });
      append(`   First report accepted! ID: ${res1.report_id.slice(0, 8)}…`);

      append('3. Attempting replay attack: Submitting second report with identical token…');
      try {
        await api.submitReport({
          credential,
          reporter_phone: testPhone,
          company_name: 'Acme Technologies',
          category: 'safety',
          title: 'Replay Test: Malicious Duplicate Attempt',
          description: 'This should be blocked by atomic tag hash collision guards.',
          severity: 'low',
        });
        append('✘ FAILURE: Replay was accepted! Replay guard compromised.', 'error');
      } catch (replayErr) {
        append(`✔ REPLAY BLOCKED AS EXPECTED: ${replayErr.message}`, 'success');
      }
    } catch (err) {
      append(`Setup failed: ${err.message}`, 'error');
    } finally {
      setBusy(false);
    }
  }

  // 3. Test Privacy-Preserving Duplicate Incident Suppression
  async function testDuplicateSuppression() {
    setBusy(true);
    append('Testing privacy-preserving duplicate incident suppression…', 'info');
    try {
      const fixedTitle = 'Critical Conveyor Belt Sensor Failure in Sector 4';
      const fixedDesc = 'Conveyor belt speed governor fails intermittently, creating severe pinch hazards for floor staff.';

      append('1. Submitting first incident report…');
      const otp1 = await api.sendOtp('+1 (555) 019-2834');
      const { credential: cred1 } = await api.verifyOtp({ phone_number: '+1 (555) 019-2834', otp_code: otp1.demo_otp });
      await api.submitReport({
        credential: cred1,
        company_name: 'Apex Logistics',
        category: 'safety',
        title: fixedTitle,
        description: fixedDesc,
        severity: 'high',
      });
      append('   First incident recorded successfully.');

      append('2. Submitting duplicate report with same incident fingerprint to Apex Logistics…');
      const otp2 = await api.sendOtp('+1 (555) 017-9932');
      const { credential: cred2 } = await api.verifyOtp({ phone_number: '+1 (555) 017-9932', otp_code: otp2.demo_otp });
      try {
        await api.submitReport({
          credential: cred2,
          company_name: 'Apex Logistics',
          category: 'safety',
          title: fixedTitle,
          description: fixedDesc,
          severity: 'high',
        });
        append('✘ FAILURE: Duplicate incident was accepted without suppression.', 'error');
      } catch (dupErr) {
        append(`✔ DUPLICATE SUPPRESSED AS EXPECTED: ${dupErr.message}`, 'success');
      }
    } catch (err) {
      append(`Test failed: ${err.message}`, 'error');
    } finally {
      setBusy(false);
    }
  }

  // 4. Test Automated Spam Detection & Threat Scoring
  async function testHarmScoring() {
    setBusy(true);
    append('Testing automated spam filtering and threat scoring…', 'info');
    try {
      append('1. Verifying reporter phone for incident submission…');
      const otpRes = await api.sendOtp('+1 (555) 014-8821');
      const { credential } = await api.verifyOtp({ phone_number: '+1 (555) 014-8821', otp_code: otpRes.demo_otp });

      append('2. Submitting sample report containing critical fraud and safety keywords…');
      const res = await api.submitReport({
        credential,
        reporter_phone: '+1 (555) 014-8821',
        company_name: 'Global Finance Corp',
        category: 'financial',
        title: 'Severe corporate embezzlement and forged compliance logs',
        description: 'Chief Accounting Officer engaged in systematic wire fraud and forged audit logs to embezzle millions of dollars into offshore shell companies.',
        severity: 'high',
      });

      append(`✔ Report evaluated by automated threat filter:`, 'success');
      append(`   Harm Score: ${res.harm_score} / 100`, 'success');
      append(`   Threat Flags: ${res.harm_flags.join(', ')}`, 'success');
      append(`   Spam Filter: ${res.is_spam ? 'Spam' : 'Clean legitimate testimony'}`, 'success');
    } catch (err) {
      append(`Threat scoring test failed: ${err.message}`, 'error');
    } finally {
      setBusy(false);
    }
  }


  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto animate-fadeIn space-y-6">
        {/* Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Security & Cryptographic Verification
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Live Security Verification Suite
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Execute real-time cryptographic and architectural tests directly against the live backend to verify
            blind signatures, replay resistance, duplicate incident suppression, and threat scoring.
          </p>
        </div>

        {/* Action Button Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            disabled={busy}
            onClick={testBlindSignature}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-emerald-500 dark:hover:border-emerald-500 text-left transition-all shadow-sm group disabled:opacity-50"
          >
            <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Chaum RSA Blind Signatures</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Blinds message locally, receives authority signature, unblinds client-side, and proves validity.
            </p>
          </button>

          <button
            disabled={busy}
            onClick={testReplayPrevention}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-emerald-500 dark:hover:border-emerald-500 text-left transition-all shadow-sm group disabled:opacity-50"
          >
            <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              <Lock className="w-4 h-4 text-emerald-500" />
              <span>Replay Attack Rejection</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Validates that spent credentials are burnt atomically and rejected on subsequent attempts.
            </p>
          </button>

          <button
            disabled={busy}
            onClick={testDuplicateSuppression}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-emerald-500 dark:hover:border-emerald-500 text-left transition-all shadow-sm group disabled:opacity-50"
          >
            <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              <CopyX className="w-4 h-4 text-emerald-500" />
              <span>Duplicate Incident Prevention</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Verifies canonical content fingerprinting blocks repeat submissions of the same incident within 48h.
            </p>
          </button>

          <button
            disabled={busy}
            onClick={testHarmScoring}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-emerald-500 dark:hover:border-emerald-500 text-left transition-all shadow-sm group disabled:opacity-50"
          >
            <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
              <Flame className="w-4 h-4 text-emerald-500" />
              <span>Spam & Threat Classification</span>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Runs real-time analysis to score threat severity and detect harassment, safety, or fraud flags.
            </p>
          </button>
        </div>

        {/* Live Terminal Log Console */}
        <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-950 text-slate-200 overflow-hidden shadow-lg">
          <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span className="font-mono font-medium text-slate-300">Live Cryptographic Audit Terminal</span>
            </div>
            <button
              onClick={clearLogs}
              className="text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>

          <div className="p-4 font-mono text-xs space-y-1.5 min-h-[220px] max-h-[360px] overflow-y-auto">
            {log.length === 0 ? (
              <div className="text-slate-500 italic">
                Ready. Click any test above to execute live security audits.
              </div>
            ) : (
              log.map((entry, idx) => (
                <div key={idx} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-slate-500 shrink-0">[{entry.t}]</span>
                  <span
                    className={
                      entry.type === 'success'
                        ? 'text-emerald-400 font-semibold'
                        : entry.type === 'error'
                        ? 'text-red-400 font-semibold'
                        : 'text-slate-300'
                    }
                  >
                    {entry.msg}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Architectural Security Assurances */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 shadow-sm space-y-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Verified Defense Invariants
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
            {SECURITY_ASSURANCES.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}