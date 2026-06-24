import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendOTPEmail } from '@/lib/email';
import { otpSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

function generateOTP(): string {
  // Use crypto-safe random for OTP generation
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return String(100000 + (array[0] % 900000));
}

export async function POST(req: NextRequest) {
  const rlKey = getRateLimitKey(req, 'otp');
  const rl = rateLimit(rlKey, 3, 5 * 60 * 1000); // 3 per 5 minutes (stricter)
  if (!rl.success) {
    return NextResponse.json({ success: false, message: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const body = await req.json();
  const parsed = otpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: parsed.error.issues[0].message }, { status: 400 });
  }

  const { email, otp, action } = parsed.data;

  const user = await db.user.findFirst({ where: { email } });
  if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

  if (action === 'send' || action === 'resend') {
    const code = generateOTP();
    await db.user.update({
      where: { id: user.id },
      data: { ver_code: code, ver_code_send_at: new Date() },
    });

    try {
      await sendOTPEmail(email, code);
    } catch (err: any) {
      console.error('Email send error:', err?.message || err);
      return NextResponse.json({ success: false, message: 'Failed to send OTP email. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent to your email' });
  }

  if (action === 'verify') {
    if (!otp) return NextResponse.json({ success: false, message: 'OTP required' }, { status: 400 });

    if (user.ver_code !== otp) {
      return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
    }

    if (user.ver_code_send_at) {
      const diff = Date.now() - new Date(user.ver_code_send_at).getTime();
      if (diff > 10 * 60 * 1000) {
        return NextResponse.json({ success: false, message: 'OTP expired' }, { status: 400 });
      }
    }

    await db.user.update({
      where: { id: user.id },
      data: { ev: 1, ver_code: null, ver_code_send_at: null },
    });

    return NextResponse.json({ success: true, message: 'Email verified successfully' });
  }

  return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
}
