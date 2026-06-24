'use client';

import { useState } from 'react';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function AdminForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ email: '', code: '', password: '', password_confirmation: '' });

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
      } else {
        setSuccess(data.message);
        setStep('code');
      }
    } catch {
      setError('Something went wrong');
    }
    setLoading(false);
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
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code: form.code, password: form.password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.message);
      } else {
        setStep('done');
      }
    } catch {
      setError('Something went wrong');
    }
    setLoading(false);
  };

  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Password Reset Successful</h1>
          <p className="text-sm text-gray-600 mb-6">You can now sign in with your new password.</p>
          <Link href="/admin/login" className="inline-flex items-center justify-center px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Password Reset</h1>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'email' ? 'Enter your admin email to receive a reset code' : 'Enter the verification code sent to your email'}
          </p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>}
        {success && step === 'code' && <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-600">{success}</div>}

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-4">
            <Input
              id="email"
              label="Admin Email"
              type="email"
              placeholder="Enter your registered admin email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <Button type="submit" loading={loading} className="w-full">Send Verification Code</Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              id="code"
              label="Verification Code"
              placeholder="Enter 6-digit code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />
            <Input
              id="password"
              label="New Password"
              type="password"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
            <Input
              id="password_confirmation"
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter new password"
              value={form.password_confirmation}
              onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
              required
            />
            <Button type="submit" loading={loading} className="w-full">Reset Password</Button>
            <button
              type="button"
              onClick={() => { setStep('email'); setError(''); setSuccess(''); }}
              className="w-full text-sm text-gray-500 hover:text-indigo-600 transition-colors"
            >
              Didn&apos;t receive code? Try again
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          <Link href="/admin/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            ← Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
