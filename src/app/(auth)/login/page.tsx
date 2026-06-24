'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verified = searchParams.get('verified');
  const errorParam = searchParams.get('error');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(errorParam === 'account_deleted' ? 'This account has been deleted by the administrator. Please contact support.' : '');
  const [form, setForm] = useState({ username: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const checkRes = await fetch('/api/auth/check-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: form.username }),
    });
    const checkData = await checkRes.json();

    if (checkData.deleted) {
      setError('This account has been deleted by the administrator. Please contact support.');
      setLoading(false);
      return;
    }

    if (checkData.unverified) {
      await fetch('/api/user/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: checkData.email, action: 'send' }),
      });
      router.push(`/verify-otp?email=${encodeURIComponent(checkData.email)}`);
      return;
    }

    const result = await signIn('user-login', {
      redirect: false,
      username: form.username,
      password: form.password,
    });

    if (result?.error) {
      setError('Invalid username or password');
      setLoading(false);
    } else {
      window.location.href = '/dashboard';
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
        <p className="mt-2 text-sm text-slate-400">Sign in to your account</p>
      </div>

      {verified && (
        <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400">
          Account created successfully! Please sign in.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="username"
          label="Username or Email"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <Input
          id="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <div className="flex items-center justify-end text-sm">
          <Link href="/password/reset" className="text-emerald-400 hover:text-emerald-300 font-medium text-xs">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-emerald-400 hover:text-emerald-300 font-medium">
          Sign Up
        </Link>
      </p>
    </div>
  );
}
