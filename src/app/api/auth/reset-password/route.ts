import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const rlKey = getRateLimitKey(req, 'reset-password');
  const rl = rateLimit(rlKey, 10, 15 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json({ success: false, message: 'Too many requests. Try again later.' }, { status: 429 });
  }

  try {
    const { email, otp, password } = await req.json();

    if (!email || !otp || !password) {
      return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const user = await db.user.findFirst({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid reset code' }, { status: 400 });
    }

    // Verify OTP
    if (!user.ver_code || user.ver_code !== otp.trim()) {
      return NextResponse.json({ success: false, message: 'Invalid reset code' }, { status: 400 });
    }

    // Check expiry (15 minutes)
    if (user.ver_code_send_at) {
      const sentAt = new Date(user.ver_code_send_at).getTime();
      const now = Date.now();
      if (now - sentAt > 15 * 60 * 1000) {
        return NextResponse.json({ success: false, message: 'Reset code has expired. Please request a new one.' }, { status: 400 });
      }
    }

    // Update password and clear OTP
    const hashedPassword = await bcrypt.hash(password, 12);
    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        ver_code: null,
        ver_code_send_at: null,
      },
    });

    return NextResponse.json({ success: true, message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
