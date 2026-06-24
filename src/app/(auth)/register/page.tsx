'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const referral = searchParams.get('ref') || '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    username: '',
    email: '',
    password: '',
    password_confirmation: '',
    referral,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Registration failed');
        setLoading(false);
        return;
      }

      router.push(`/verify-otp?email=${encodeURIComponent(form.email)}&p=${encodeURIComponent(form.password)}`);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white">Create Account</h1>
        <p className="mt-2 text-sm text-slate-400">Start earning with OnlineBuzz Mall</p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            id="firstname"
            label="First Name"
            value={form.firstname}
            onChange={(e) => updateForm('firstname', e.target.value)}
            required
            showRequired
          />
          <Input
            id="lastname"
            label="Last Name"
            value={form.lastname}
            onChange={(e) => updateForm('lastname', e.target.value)}
            required
            showRequired
          />
        </div>

        <Input
          id="username"
          label="Username"
          value={form.username}
          onChange={(e) => updateForm('username', e.target.value)}
          required
          showRequired
        />
        <Input
          id="email"
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => updateForm('email', e.target.value)}
          required
          showRequired
        />
        <Input
          id="password"
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => updateForm('password', e.target.value)}
          required
        />
        <Input
          id="password_confirmation"
          label="Confirm Password"
          type="password"
          value={form.password_confirmation}
          onChange={(e) => updateForm('password_confirmation', e.target.value)}
          required
        />
        <Input
          id="referral"
          label="Referral Code"
          value={form.referral}
          onChange={(e) => updateForm('referral', e.target.value)}
          required
        />

        <Button type="submit" loading={loading} className="w-full">
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
          Sign In
        </Link>
      </p>
    </div>
  );
}
