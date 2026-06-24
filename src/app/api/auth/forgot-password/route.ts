import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEmail } from '@/lib/email';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const rlKey = getRateLimitKey(req, 'forgot-password');
  const rl = rateLimit(rlKey, 5, 15 * 60 * 1000);
  if (!rl.success) {
    return NextResponse.json({ success: false, message: 'Too many requests. Try again later.' }, { status: 429 });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    const user = await db.user.findFirst({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return NextResponse.json({ success: false, message: 'This email is not registered. Please check your email or create a new account.' }, { status: 404 });
    }

    // Generate 6-digit OTP
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const otp = String(100000 + (array[0] % 900000));

    // Store OTP with 15 min expiry
    await db.user.update({
      where: { id: user.id },
      data: {
        ver_code: otp,
        ver_code_send_at: new Date(),
      },
    });

    // Send email
    try {
      await sendEmail(
        user.email,
        'Password Reset Code - OnlineBuzz Mall',
        `
          <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1f2937;">Password Reset</h2>
            <p style="color: #4b5563;">Hi ${user.firstname || user.username},</p>
            <p style="color: #4b5563;">Your password reset code is:</p>
            <div style="background: #eef2ff; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0;">
              <span style="font-size: 28px; font-weight: bold; color: #4338ca; letter-spacing: 4px;">${otp}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This code expires in 15 minutes. If you didn't request this, ignore this email.</p>
          </div>
        `
      );
    } catch (emailErr: any) {
      console.error('Email send failed:', emailErr);
      return NextResponse.json({ success: false, message: 'Failed to send reset code. Please try again later.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Reset code sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ success: false, message: 'Something went wrong' }, { status: 500 });
  }
}
