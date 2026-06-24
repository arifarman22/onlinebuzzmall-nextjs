'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let sid = sessionStorage.getItem('_analytics_sid');
  if (!sid) {
    sid = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    sessionStorage.setItem('_analytics_sid', sid);
  }
  return sid;
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTracked = useRef('');

  useEffect(() => {
    if (pathname === lastTracked.current) return;
    lastTracked.current = pathname;

    const sessionId = getSessionId();
    if (!sessionId) return;

    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        pagePath: pathname,
        referrer: document.referrer || null,
      }),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
