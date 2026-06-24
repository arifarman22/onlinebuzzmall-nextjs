'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const password = searchParams.get('p') || '';

  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/user/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, action: 'verify' }),
    });
    const data = await res.json();

    if (data.success) {
      // Auto-login if password is available
      if (password) {
        const result = await signIn('user-login', {
          redirect: false,
          username: email,
          password,
        });
        if (result?.ok) {
          window.location.href = '/dashboard';
          return;
        }
      }
      // Fallback to login page
      router.push('/login?verified=1');
    } else {
      setError(data.message);
    }
    setLoading(false);
  };

  const handleResend = async () => {
    await fetch('/api/user/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, action: 'resend' }),
    });
    setError('');
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white">Verify Email</h1>
        <p className="mt-2 text-sm text-slate-400">Enter the OTP sent to {email}</p>
      </div>

      {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{error}</div>}

      <form onSubmit={handleVerify} className="space-y-4">
        <Input
          id="otp"
          label="Verification Code"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        <Button type="submit" loading={loading} className="w-full">Verify</Button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        Didn&apos;t receive the code?{' '}
        <button onClick={handleResend} className="text-emerald-400 hover:text-emerald-300 font-medium">Resend</button>
      </p>
    </div>
  );
}
