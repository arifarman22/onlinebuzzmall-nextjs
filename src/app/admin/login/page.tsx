'use client';

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', password: '' });

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.role === 'admin') {
      router.replace('/admin/dashboard');
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('admin-login', {
        redirect: false,
        username: form.username,
        password: form.password,
      });

      if (result?.error) {
        setError('Invalid credentials');
        setLoading(false);
      } else if (result?.ok) {
        window.location.href = '/admin/dashboard';
      } else {
        setError('Login failed. Please try again.');
        setLoading(false);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to the admin panel</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="username" label="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
          <Input id="password" label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <Button type="submit" loading={loading} className="w-full">Sign In</Button>
        </form>

        <p className="mt-4 text-center text-sm">
          <a href="/admin/forgot-password" className="text-indigo-600 hover:text-indigo-700 font-medium">Forgot Password?</a>
        </p>
      </div>
    </div>
  );
}
