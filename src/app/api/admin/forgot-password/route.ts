import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const rlKey = getRateLimitKey(req, 'admin-forgot-password');
  const rl = rateLimit(rlKey, 3, 15 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json({ success: false, message: 'Too many requests. Try again later.' }, { status: 429 });
  }

  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    const admin = await db.admin.findFirst({ where: { email: email.toLowerCase().trim() } });
    if (!admin) {
      return NextResponse.json({ success: false, message: 'No admin account found with this email.' }, { status: 404 });
    }

    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const code = String(100000 + (array[0] % 900000));

    await db.admin.update({
      where: { id: admin.id },
      data: { reset_code: code, reset_code_at: new Date() },
    });

    try {
      await sendEmail(
        admin.email,
        'Admin Password Reset - OnlineBuzz Mall',
        `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1f2937;">Admin Password Reset</h2>
            <p style="color: #4b5563;">Hi ${admin.name},</p>
            <p style="color: #4b5563;">Your password reset verification code is:</p>
            <div style="background: #eef2ff; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
              <span style="font-size: 28px; font-weight: bold; color: #4338ca; letter-spacing: 4px;">${code}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This code expires in 15 minutes. If you didn't request this, please secure your account immediately.</p>
          </div>
        `
      );
    } catch (err: any) {
      console.error('Admin reset email failed:', err);
      return NextResponse.json({ success: false, message: 'Failed to send verification code.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Verification code sent to your email.' });
  } catch (error) {
    console.error('Admin forgot password error:', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
