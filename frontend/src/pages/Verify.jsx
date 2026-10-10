import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PublicLayout } from '../components/Layout.jsx';
import { api } from '../api/client.js';
import { blindMessage, unblindSignature } from '../api/blindSignature.js';
import {
  Phone,
  ShieldCheck,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  Send,
  RotateCcw
} from 'lucide-react';

export default function Verify() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [demoOtpCode, setDemoOtpCode] = useState('');
  const [useBlindSig, setUseBlindSig] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stepStatus, setStepStatus] = useState('');
  const navigate = useNavigate();

  const DEMO_PHONES = [
    { phone: '+1 (555) 019-2834', label: 'Demo Line 1' },
    { phone: '+1 (555) 014-8821', label: 'Demo Line 2' },
    { phone: '+1 (555) 017-9932', label: 'Demo Line 3' },
  ];

  async function handleSendOtp(e) {
    if (e) e.preventDefault();
    setError('');
    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone || cleanPhone.length < 7) {
      setError('Please enter a valid mobile phone number.');
      return;
    }

    setLoading(true);
    setStepStatus('Sending SMS verification code…');
    try {
      const res = await api.sendOtp(cleanPhone);
      setOtpSent(true);
      setDemoOtpCode(res.demo_otp || '123456');
      setStepStatus('');
    } catch (err) {
      setError(err.message || 'Failed to dispatch verification code.');
    } finally {
      setLoading(false);
      setStepStatus('');
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError('');
    const cleanPhone = phoneNumber.trim();
    const cleanOtp = otpCode.trim();

    if (!cleanOtp) {
      setError('Please enter the 6-digit verification code sent to your phone.');
      return;
    }

    setLoading(true);

    try {
      if (useBlindSig) {
        // Chaum RSA Blind Signature Flow with Phone OTP
        setStepStatus('Fetching Ombudsman public cryptographic parameters…');
        const pubParams = await api.getBlindPublicKey();

        setStepStatus('Generating client-side random ticket & blinding…');
        const ticketTag = 'ticket_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        const { blindedMessageHex, rHex } = await blindMessage(ticketTag, pubParams.n, pubParams.e);

        setStepStatus('Requesting blind signature with phone authorization…');
        const blindRes = await api.blindSign({
          phone_number: cleanPhone,
          otp_code: cleanOtp,
          blinded_message: blindedMessageHex,
        });

        setStepStatus('Unblinding cryptographic signature locally…');
        const unblindedSig = unblindSignature(blindRes.blinded_signature, rHex, pubParams.n);

        navigate('/report/new', {
          state: {
            reporter_phone: cleanPhone,
            blind_tag: ticketTag,
            blind_signature: unblindedSig,
            is_blind: true,
            expires_in: 900,
          },
          replace: true,
        });
      } else {
        // Single-use signed token flow
        setStepStatus('Verifying SMS code…');
        const data = await api.verifyOtp({
          phone_number: cleanPhone,
          otp_code: cleanOtp,
        });

        navigate('/report/new', {
          state: {
            reporter_phone: cleanPhone,
            credential: data.credential,
            expires_in: data.expires_in,
            is_blind: false,
          },
          replace: true,
        });
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the OTP code.');
    } finally {
      setLoading(false);
      setStepStatus('');
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-xl mx-auto animate-fadeIn">
        {/* Header */}
        <div className="text-center sm:text-left mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Phone className="w-3.5 h-3.5" />
            Secure Phone Verification
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Verify via Mobile Number
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Enter your mobile number to receive a one-time verification code.
            Your phone number is guarded strictly in escrow—only the assigned Ombudsman Moderator has access to it for follow-ups, while the company and administrative reviewers never see it.
          </p>
        </div>

        {/* Verification Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 sm:p-8 shadow-sm space-y-6">
          {/* Step 1: Phone Input */}
          <div>
            <label
              className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              htmlFor="phone"
            >
              Mobile Phone Number
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="phone"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={otpSent && loading}
                  autoComplete="tel"
                  placeholder="e.g. +1 (555) 019-2834"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={loading || !phoneNumber.trim()}
                className="px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0"
              >
                {loading && !otpSent ? (
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{otpSent ? 'Resend Code' : 'Send Code'}</span>
              </button>
            </div>

            {/* Quick Demo Phone Numbers */}
            <div className="mt-3">
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-emerald-500" />
                Quick demo numbers (click to fill):
              </div>
              <div className="flex flex-wrap gap-2">
                {DEMO_PHONES.map((item) => (
                  <button
                    type="button"
                    key={item.phone}
                    onClick={() => {
                      setPhoneNumber(item.phone);
                      setOtpSent(false);
                      setOtpCode('');
                    }}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-100/70 dark:bg-slate-800/60 hover:border-emerald-500 text-slate-700 dark:text-slate-300 font-mono transition-colors"
                  >
                    {item.phone} <span className="text-[10px] text-slate-500">({item.label})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 2: OTP Input (rendered once OTP is sent) */}
          {otpSent && (
            <form onSubmit={handleVerify} className="space-y-5 animate-slideUp">
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-300 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Verification code generated for <strong>{phoneNumber}</strong>.
                  </span>
                </div>
                {demoOtpCode && (
                  <button
                    type="button"
                    onClick={() => setOtpCode(demoOtpCode)}
                    className="underline font-bold text-emerald-700 dark:text-emerald-300 hover:text-emerald-600 shrink-0 font-mono"
                  >
                    Auto-fill ({demoOtpCode})
                  </button>
                )}
              </div>

              <div>
                <label
                  htmlFor="otp"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                >
                  6-Digit SMS Verification Code
                </label>
                <input
                  id="otp"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="Enter 6-digit code (e.g. 123456)"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all font-mono text-base tracking-widest text-center"
                />
              </div>

              {/* Cryptographic Scheme Selector */}
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/10">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useBlindSig}
                    onChange={(e) => setUseBlindSig(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-xs">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Use Chaum RSA Blind Signature (Mathematical Unlinkability)
                    </span>
                    <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                      Locally blinds your ticket before submitting. The server verifies your phone without ever knowing the ticket tag used to submit the report.
                    </p>
                  </div>
                </label>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !otpCode.trim()}
                className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 disabled:opacity-60 text-white dark:text-slate-950 font-semibold py-3.5 shadow-md transition-all text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    <span>{stepStatus || 'Verifying credentials…'}</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify Code & Proceed to Report</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Privacy Note */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Your phone number is never shown to the employer company.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Only the designated Ombudsman Moderator can access the phone for emergency outreach.</span>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
          Already filed a report?{' '}
          <Link to="/track" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
            Track status with your private secret
          </Link>
        </p>
      </div>
    </PublicLayout>
  );
}