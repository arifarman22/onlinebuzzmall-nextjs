'use client';

import { useState } from 'react';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function PasswordResetPage() {
  const [step, setStep] = useState<'email' | 'otp' | 'done'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ email: '', otp: '', password: '', password_confirmation: '' });

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message || 'Failed to send reset code');
      } else {
        setSuccess(data.message || 'Reset code sent to your email');
        setStep('otp');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, otp: form.otp, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to reset password');
      } else {
        setStep('done');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Password Reset Successful</h1>
        <p className="text-sm text-slate-400 mb-6">You can now sign in with your new password.</p>
        <Link href="/login" className="inline-flex items-center justify-center px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white">Reset Password</h1>
        <p className="mt-2 text-sm text-slate-400">
          {step === 'email' ? 'Enter your email to receive a reset code' : 'Enter the code sent to your email'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}
      {success && step === 'otp' && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400">
          {success}
        </div>
      )}

      {step === 'email' ? (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <Input
            id="email"
            label="Email Address"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Button type="submit" loading={loading} className="w-full">
            Send Reset Code
          </Button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Input
            id="otp"
            label="Reset Code"
            value={form.otp}
            onChange={(e) => setForm({ ...form, otp: e.target.value })}
            required
          />
          <Input
            id="password"
            label="New Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <Input
            id="password_confirmation"
            label="Confirm New Password"
            type="password"
            value={form.password_confirmation}
            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
            required
          />
          <Button type="submit" loading={loading} className="w-full">
            Reset Password
          </Button>
          <button
            type="button"
            onClick={() => { setStep('email'); setError(''); setSuccess(''); }}
            className="w-full text-sm text-slate-500 hover:text-emerald-400 transition-colors"
          >
            Didn&apos;t receive code? Try again
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        Remember your password?{' '}
        <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
          Sign In
        </Link>
      </p>
    </div>
  );
}
