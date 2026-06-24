import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { updateFreeCount, getPositioner } from '@/lib/mlm';
import { registerSchema } from '@/lib/validations';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { sendAdminNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const rlKey = getRateLimitKey(req, 'register');
    const rl = rateLimit(rlKey, 15, 60 * 60 * 1000); // 5 attempts per hour
    if (!rl.success) {
      return NextResponse.json({ message: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: parsed.error.issues[0].message }, { status: 400 });
    }

    const { firstname, lastname, username, email, password, referral } = parsed.data;

    // Referral code is MANDATORY
    if (!referral || !referral.trim()) {
      return NextResponse.json({ message: 'Referral code is required' }, { status: 400 });
    }

    // Validate referral code exists
    const refId = Number(referral.trim());
    if (!refId || refId <= 0) {
      return NextResponse.json({ message: 'Invalid referral code' }, { status: 400 });
    }
    const referrer = await db.user.findFirst({ where: { id: refId } });
    if (!referrer) {
      return NextResponse.json({ message: 'Invalid referral code' }, { status: 400 });
    }

    const existingUser = await db.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Username or email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    let refBy: number = referrer.id;
    let posId: number | null = null;
    let position: number | null = null;

    const leftChild = await db.user.findFirst({ where: { pos_id: referrer.id, position: 1 } });
    if (!leftChild) {
      posId = referrer.id;
      position = 1;
    } else {
      const rightChild = await db.user.findFirst({ where: { pos_id: referrer.id, position: 2 } });
      if (!rightChild) {
        posId = referrer.id;
        position = 2;
      } else {
        const positioner = await getPositioner(referrer.id, 1);
        posId = positioner;
        position = 1;
      }
    }

    const user = await db.user.create({
      data: {
        firstname,
        lastname,
        username,
        email,
        password: hashedPassword,
        ref_by: refBy,
        pos_id: posId,
        position,
        status: 1,
        ev: 0,
        sv: 1,
        profile_complete: 1,
      },
    });

    await db.userExtra.create({
      data: { user_id: user.id },
    });

    if (posId) {
      await updateFreeCount(user.id);
    }

    // Send OTP email for verification
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await db.user.update({
      where: { id: user.id },
      data: { ver_code: otp, ver_code_send_at: new Date() },
    });

    try {
      const { sendOTPEmail } = await import('@/lib/email');
      await sendOTPEmail(email, otp);
    } catch (err) {
      console.error('OTP email send error:', err);
    }

    sendAdminNotification({
      title: 'New User Registration',
      message: `New user registered: ${username} (${email})`,
      type: 'registration',
    });

    return NextResponse.json({ message: 'Registration successful. Please verify your email.', email }, { status: 201 });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
