import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/rbac';
import { sendOTPEmail } from '@/lib/email';
import { pendingUsers } from '../create/route';

export async function POST(req: NextRequest) {
  const guard = await requirePermission('users.edit');
  if (!guard.authorized) return guard.response;

  const { token, otp, action } = await req.json();

  if (!token) {
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  }

  const pending = pendingUsers.get(token);
  if (!pending) {
    return NextResponse.json({ success: false, message: 'Session expired. Please start again.' }, { status: 400 });
  }

  // Check expiry (10 min)
  if (Date.now() - pending.createdAt > 10 * 60 * 1000) {
    pendingUsers.delete(token);
    return NextResponse.json({ success: false, message: 'OTP expired. Please start again.' }, { status: 400 });
  }

  // Resend OTP
  if (action === 'resend') {
    const newOtp = String(Math.floor(100000 + Math.random() * 900000));
    pending.otp = newOtp;
    pending.createdAt = Date.now();
    try {
      await sendOTPEmail(pending.data.email, newOtp);
    } catch {
      return NextResponse.json({ success: false, message: 'Failed to resend OTP' }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'OTP resent successfully' });
  }

  // Verify OTP
  if (!otp) {
    return NextResponse.json({ success: false, message: 'OTP is required' }, { status: 400 });
  }

  if (pending.otp !== otp) {
    return NextResponse.json({ success: false, message: 'Invalid OTP' }, { status: 400 });
  }

  // OTP verified — now create the user
  const { firstname, lastname, username, email, password, referral } = pending.data;

  // Double-check uniqueness
  const existing = await db.user.findFirst({ where: { OR: [{ username }, { email }] } });
  if (existing) {
    pendingUsers.delete(token);
    return NextResponse.json({ success: false, message: 'Username or email already taken' }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const refBy = referral ? Number(referral) : 0;

  const user = await db.user.create({
    data: {
      firstname,
      lastname,
      username,
      email,
      password: hashedPassword,
      ref_by: refBy,
      status: 1,
      ev: 1,
      sv: 1,
      profile_complete: 1,
    },
  });

  await db.userExtra.create({ data: { user_id: user.id } });

  pendingUsers.delete(token);

  return NextResponse.json({ success: true, message: 'User created successfully.' });
}
