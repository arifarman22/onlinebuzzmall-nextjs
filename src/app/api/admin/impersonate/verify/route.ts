import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const rlKey = getRateLimitKey(req, 'impersonate-verify');
  const rl = rateLimit(rlKey, 5, 60 * 1000);
  if (!rl.success) {
    return NextResponse.json({ success: false, message: 'Too many attempts' }, { status: 429 });
  }

  const { token } = await req.json();
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ success: false, message: 'Token required' }, { status: 400 });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ success: false, message: 'Server misconfigured' }, { status: 500 });
  }

  try {
    const decoded = jwt.verify(token, secret, { maxAge: '10m' }) as any;
    if (decoded.type !== 'impersonate') {
      return NextResponse.json({ success: false, message: 'Invalid token type' }, { status: 400 });
    }
    return NextResponse.json({ success: true, userId: decoded.userId, adminId: decoded.adminId });
  } catch {
    return NextResponse.json({ success: false, message: 'Token expired or invalid' }, { status: 401 });
  }
}
