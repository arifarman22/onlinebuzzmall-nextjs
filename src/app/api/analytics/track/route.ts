import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { trackPageView } from '@/lib/analytics';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, pagePath, referrer } = body;

    if (!sessionId || !pagePath) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : undefined;

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    // Non-blocking track
    trackPageView({ sessionId, userId, pagePath, referrer, userAgent, ip }).catch(console.error);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
