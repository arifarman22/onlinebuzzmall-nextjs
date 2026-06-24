'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

export default function AdminCreateUserPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');

  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    username: '',
    email: '',
    password: '',
    referral: '',
  });

  const [otp, setOtp] = useState('');

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/admin/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.message);
      return;
    }

    setToken(data.token);
    setEmail(data.email);
    setStep('otp');
    setSuccess('OTP sent to ' + data.email);
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await fetch('/api/admin/users/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, otp }),
    });
    const data = await res.json();
    setLoading(false);

    if (!data.success) {
      setError(data.message);
      return;
    }

    setSuccess('User created and verified successfully!');
    setTimeout(() => router.push('/admin/users'), 1500);
  }

  async function handleResendOTP() {
    setError('');
    setLoading(true);
    const res = await fetch('/api/admin/users/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'resend' }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) setSuccess('OTP resent to ' + email);
    else setError(data.message);
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Create User</h2>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>}
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>}

      <Card>
        <CardContent>
          {step === 'form' && (
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" required value={form.firstname} onChange={(e) => setForm({ ...form, firstname: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" required value={form.lastname} onChange={(e) => setForm({ ...form, lastname: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input type="text" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Referral ID (optional)</label>
                <input type="text" value={form.referral} onChange={(e) => setForm({ ...form, referral: e.target.value })} placeholder="User ID of referrer" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {loading ? 'Sending OTP...' : 'Send OTP & Verify'}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <p className="text-sm text-gray-600">Enter the 6-digit OTP sent to <span className="font-medium">{email}</span></p>
              <p className="text-xs text-gray-400">Account will only be created after successful verification.</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OTP Code</label>
                <input type="text" required maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="123456" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-center tracking-widest text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </button>
              <button type="button" onClick={handleResendOTP} disabled={loading} className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Resend OTP
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
