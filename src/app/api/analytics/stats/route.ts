import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAnalyticsStats, getAnalyticsTrend } from '@/lib/analytics';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const range = (req.nextUrl.searchParams.get('range') || '30d') as 'today' | '7d' | '30d' | 'all';
  const days = range === 'today' ? 1 : range === '7d' ? 7 : 30;

  const [stats, trend] = await Promise.all([
    getAnalyticsStats(range),
    getAnalyticsTrend(days),
  ]);

  return NextResponse.json({ success: true, data: { ...stats, trend } });
}
