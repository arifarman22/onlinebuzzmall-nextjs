import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import * as OTPAuth from 'otpauth';
import { twofactorSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

function createTOTP(secret: string, username: string) {
  return new OTPAuth.TOTP({
    issuer: 'OnlineBuzzMall',
    label: username,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const userId = Number(session.user.id);
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

  const secret = new OTPAuth.Secret({ size: 20 });
  const totp = new OTPAuth.TOTP({
    issuer: 'OnlineBuzzMall',
    label: user.username,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret,
  });

  return NextResponse.json({
    success: true,
    data: {
      secret: secret.base32,
      uri: totp.toString(),
      enabled: user.ts === 1,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });

  const rlKey = getRateLimitKey(req, `2fa:${session.user.id}`);
  const rl = rateLimit(rlKey, 10, 5 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json({ success: false, message: 'Too many attempts' }, { status: 429 });
  }

  const userId = Number(session.user.id);
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

  const body = await req.json();
  const parsed = twofactorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
  }

  const { action, secret, code } = parsed.data;

  if (action === 'enable') {
    if (!secret || !code) return NextResponse.json({ success: false, message: 'Secret and code required' }, { status: 400 });

    const totp = createTOTP(secret, user.username);
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) return NextResponse.json({ success: false, message: 'Invalid verification code' }, { status: 400 });

    await db.user.update({ where: { id: userId }, data: { ts: 1, tsc: secret } });
    return NextResponse.json({ success: true, message: '2FA enabled successfully' });
  }

  if (action === 'disable') {
    if (!code) return NextResponse.json({ success: false, message: 'Code required' }, { status: 400 });
    if (!user.tsc) return NextResponse.json({ success: false, message: '2FA not enabled' }, { status: 400 });

    const totp = createTOTP(user.tsc, user.username);
    const delta = totp.validate({ token: code, window: 1 });
    if (delta === null) return NextResponse.json({ success: false, message: 'Invalid verification code' }, { status: 400 });

    await db.user.update({ where: { id: userId }, data: { ts: 0, tsc: null } });
    return NextResponse.json({ success: true, message: '2FA disabled successfully' });
  }

  return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
}
