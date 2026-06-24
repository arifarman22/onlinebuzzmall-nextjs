import { db } from '@/lib/db';

// ===== USER-AGENT PARSER =====
export function parseUserAgent(ua: string) {
  const browser = detectBrowser(ua);
  const os = detectOS(ua);
  const deviceType = detectDevice(ua);
  return { browser, os, deviceType };
}

function detectBrowser(ua: string): string {
  if (/SamsungBrowser/i.test(ua)) return 'Samsung Browser';
  if (/OPR|Opera/i.test(ua)) return 'Opera';
  if (/Edg/i.test(ua)) return 'Edge';
  if (/Firefox/i.test(ua)) return 'Firefox';
  if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  if (/MSIE|Trident/i.test(ua)) return 'IE';
  return 'Other';
}

function detectOS(ua: string): string {
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Android/i.test(ua)) return 'Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Mac OS X/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  if (/CrOS/i.test(ua)) return 'Chrome OS';
  return 'Other';
}

function detectDevice(ua: string): string {
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android.*mobile|windows phone/i.test(ua)) return 'mobile';
  return 'desktop';
}

// ===== TRAFFIC SOURCE DETECTION =====
export function detectSource(referrer: string | null | undefined): string {
  if (!referrer) return 'direct';
  const r = referrer.toLowerCase();
  if (r.includes('google.')) return 'google';
  if (r.includes('facebook.') || r.includes('fb.')) return 'facebook';
  if (r.includes('youtube.')) return 'youtube';
  if (r.includes('instagram.')) return 'instagram';
  if (r.includes('twitter.') || r.includes('t.co')) return 'twitter';
  if (r.includes('linkedin.')) return 'linkedin';
  if (r.includes('tiktok.')) return 'tiktok';
  return 'referral';
}

// ===== IP GEOLOCATION (free service) =====
export async function getGeoFromIP(ip: string): Promise<{ country: string; countryCode: string; city: string }> {
  const defaultGeo = { country: 'Unknown', countryCode: 'XX', city: 'Unknown' };
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') return defaultGeo;

  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return defaultGeo;
    const data = await res.json();
    return {
      country: data.country_name || 'Unknown',
      countryCode: data.country_code || 'XX',
      city: data.city || 'Unknown',
    };
  } catch {
    return defaultGeo;
  }
}

// ===== SESSION ID GENERATOR =====
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ===== TRACK PAGE VIEW =====
export async function trackPageView(params: {
  sessionId: string;
  userId?: number;
  pagePath: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
}) {
  const { sessionId, userId, pagePath, referrer, userAgent, ip } = params;
  const { browser, os, deviceType } = parseUserAgent(userAgent || '');
  const source = detectSource(referrer);

  // Geo lookup (non-blocking)
  let geo = { country: 'Unknown', countryCode: 'XX', city: 'Unknown' };
  try {
    geo = await getGeoFromIP(ip || '');
  } catch {}

  // Create event
  await db.analyticsEvent.create({
    data: {
      session_id: sessionId,
      user_id: userId || null,
      page_path: pagePath,
      referrer: referrer || null,
      source,
      browser,
      os,
      device_type: deviceType,
      country: geo.country,
      country_code: geo.countryCode,
      city: geo.city,
      ip: ip || null,
      user_agent: userAgent || null,
    },
  });

  // Upsert session
  const existing = await db.analyticsSession.findUnique({ where: { session_id: sessionId } });
  if (existing) {
    await db.analyticsSession.update({
      where: { session_id: sessionId },
      data: {
        page_count: { increment: 1 },
        exit_page: pagePath,
        ended_at: new Date(),
        duration: Math.floor((Date.now() - new Date(existing.started_at).getTime()) / 1000),
      },
    });
  } else {
    await db.analyticsSession.create({
      data: {
        session_id: sessionId,
        user_id: userId || null,
        entry_page: pagePath,
        exit_page: pagePath,
        page_count: 1,
        browser,
        os,
        device_type: deviceType,
        country: geo.country,
        country_code: geo.countryCode,
        source,
        ip: ip || null,
      },
    });
  }

  // Update daily stats (upsert to avoid missing record errors)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    await db.analyticsDaily.upsert({
      where: { date: today },
      update: { page_views: { increment: 1 }, total_visits: { increment: 1 } },
      create: { date: today, page_views: 1, total_visits: 1 },
    });
  } catch {
    // ignore race condition
  }
}

// ===== AGGREGATION QUERIES =====
export async function getAnalyticsStats(range: 'today' | '7d' | '30d' | 'all' = '30d') {
  const now = new Date();
  let since: Date;

  switch (range) {
    case 'today': since = new Date(now.setHours(0, 0, 0, 0)); break;
    case '7d': since = new Date(Date.now() - 7 * 86400000); break;
    case '30d': since = new Date(Date.now() - 30 * 86400000); break;
    default: since = new Date(0);
  }

  const where = { created_at: { gte: since } };

  const [
    totalVisits,
    uniqueSessions,
    totalPageViews,
    browsers,
    operatingSystems,
    devices,
    countries,
    sources,
    topPages,
    sessions,
  ] = await Promise.all([
    db.analyticsEvent.count({ where }),
    db.analyticsSession.count({ where }),
    db.analyticsEvent.count({ where }),
    db.analyticsEvent.groupBy({ by: ['browser'], where, _count: true, orderBy: { _count: { browser: 'desc' } }, take: 10 }),
    db.analyticsEvent.groupBy({ by: ['os'], where, _count: true, orderBy: { _count: { os: 'desc' } }, take: 10 }),
    db.analyticsEvent.groupBy({ by: ['device_type'], where, _count: true, orderBy: { _count: { device_type: 'desc' } } }),
    db.analyticsEvent.groupBy({ by: ['country', 'country_code'], where, _count: true, orderBy: { _count: { country: 'desc' } }, take: 10 }),
    db.analyticsEvent.groupBy({ by: ['source'], where, _count: true, orderBy: { _count: { source: 'desc' } }, take: 10 }),
    db.analyticsEvent.groupBy({ by: ['page_path'], where, _count: true, orderBy: { _count: { page_path: 'desc' } }, take: 10 }),
    db.analyticsSession.findMany({ where, select: { duration: true, page_count: true, is_bounce: true } }),
  ]);

  // Calculate session metrics
  const totalSessions = sessions.length;
  const avgDuration = totalSessions > 0 ? sessions.reduce((s, x) => s + x.duration, 0) / totalSessions : 0;
  const avgPagesPerSession = totalSessions > 0 ? sessions.reduce((s, x) => s + x.page_count, 0) / totalSessions : 0;
  const bounceRate = totalSessions > 0 ? (sessions.filter((s) => s.is_bounce === 1).length / totalSessions) * 100 : 0;

  // User activity
  const newUsersInRange = await db.user.count({ where: { created_at: { gte: since } } });
  const uniqueUserSessions = await db.analyticsSession.groupBy({ by: ['user_id'], where: { ...where, user_id: { not: null } } });
  const dau = await db.analyticsSession.groupBy({
    by: ['user_id'],
    where: { created_at: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }, user_id: { not: null } },
  });

  const weekAgo = new Date(Date.now() - 7 * 86400000);
  const wau = await db.analyticsSession.groupBy({ by: ['user_id'], where: { created_at: { gte: weekAgo }, user_id: { not: null } } });

  const monthAgo = new Date(Date.now() - 30 * 86400000);
  const mau = await db.analyticsSession.groupBy({ by: ['user_id'], where: { created_at: { gte: monthAgo }, user_id: { not: null } } });

  return {
    overview: { totalVisits, uniqueSessions, totalPageViews, newUsersInRange },
    activity: { dau: dau.length, wau: wau.length, mau: mau.length, uniqueUsers: uniqueUserSessions.length },
    session: { avgDuration: Math.round(avgDuration), avgPagesPerSession: Math.round(avgPagesPerSession * 10) / 10, bounceRate: Math.round(bounceRate * 10) / 10 },
    browsers: browsers.map((b) => ({ name: b.browser || 'Unknown', count: b._count })),
    operatingSystems: operatingSystems.map((o) => ({ name: o.os || 'Unknown', count: o._count })),
    devices: devices.map((d) => ({ name: d.device_type || 'Unknown', count: d._count })),
    countries: countries.map((c) => ({ name: c.country || 'Unknown', code: c.country_code || 'XX', count: c._count })),
    sources: sources.map((s) => ({ name: s.source || 'direct', count: s._count })),
    topPages: topPages.map((p) => ({ path: p.page_path, count: p._count })),
  };
}

// ===== DAILY TREND DATA =====
export async function getAnalyticsTrend(days: number = 30) {
  const data = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const nextDay = new Date(d);
    nextDay.setDate(nextDay.getDate() + 1);

    const [visits, sessions, users] = await Promise.all([
      db.analyticsEvent.count({ where: { created_at: { gte: d, lt: nextDay } } }),
      db.analyticsSession.count({ where: { created_at: { gte: d, lt: nextDay } } }),
      db.analyticsSession.groupBy({ by: ['user_id'], where: { created_at: { gte: d, lt: nextDay }, user_id: { not: null } } }),
    ]);

    data.push({
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      visits,
      sessions,
      users: users.length,
    });
  }
  return data;
}
