'use client';

import { Suspense, useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';

function ImpersonateContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('Verifying...');

  useEffect(() => {
    if (!token) { setStatus('Invalid link'); return; }

    fetch('/api/admin/impersonate/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then(async (data) => {
        if (data.success) {
          setStatus('Logging in as user...');
          const result = await signIn('impersonate-login', { redirect: false, token });
          if (result?.ok) {
            window.location.href = '/dashboard';
          } else {
            setStatus('Login failed');
          }
        } else {
          setStatus(data.message || 'Invalid or expired token');
        }
      })
      .catch(() => setStatus('Error verifying token'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-600">{status}</p>
      </div>
    </div>
  );
}

export default function ImpersonatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>}>
      <ImpersonateContent />
    </Suspense>
  );
}
