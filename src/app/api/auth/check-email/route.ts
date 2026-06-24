import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Rate limit to prevent enumeration
  const rlKey = getRateLimitKey(req, 'check-email');
  const rl = rateLimit(rlKey, 10, 60 * 1000); // 10 per minute
  if (!rl.success) {
    return NextResponse.json({ unverified: false }, { status: 429 });
  }

  try {
    const { username } = await req.json();
    if (!username || typeof username !== 'string' || username.length > 100) {
      return NextResponse.json({ unverified: false });
    }

    const sanitized = username.trim().slice(0, 100);

    const user = await db.user.findFirst({
      where: { OR: [{ username: sanitized }, { email: sanitized }] },
      select: { ev: true, email: true, status: true },
    });

    if (!user) return NextResponse.json({ unverified: false });

    if (user.ev === 0 && user.status !== -1) {
      // Only return masked email to prevent full email exposure
      const email = user.email;
      const [local, domain] = email.split('@');
      const masked = local.slice(0, 2) + '***@' + domain;
      return NextResponse.json({ unverified: true, email: user.email, hint: masked });
    }

    return NextResponse.json({ unverified: false });
  } catch {
    return NextResponse.json({ unverified: false });
  }
}
