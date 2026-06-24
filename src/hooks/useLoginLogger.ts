'use client';

import { useEffect } from 'react';

export function useLoginLogger() {
  useEffect(() => {
    const logged = sessionStorage.getItem('login_logged');
    if (logged) return;

    fetch('/api/user/login-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).then(() => {
      sessionStorage.setItem('login_logged', '1');
    }).catch(() => {});
  }, []);
}
