import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/rbac';
import { sendOTPEmail } from '@/lib/email';

// In-memory store for pending user creation (expires in 10 min)
const pendingUsers = new Map<string, { data: any; otp: string; createdAt: number }>();

// Cleanup expired entries
function cleanup() {
  const now = Date.now();
  for (const [key, val] of pendingUsers) {
    if (now - val.createdAt > 10 * 60 * 1000) pendingUsers.delete(key);
  }
}

export { pendingUsers };

export async function POST(req: NextRequest) {
  const guard = await requirePermission('users.edit');
  if (!guard.authorized) return guard.response;

  cleanup();

  const body = await req.json();
  const { firstname, lastname, username, email, password, referral } = body;

  if (!firstname || !lastname || !username || !email || !password) {
    return NextResponse.json({ success: false, message: 'All fields are required' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const existing = await db.user.findFirst({ where: { OR: [{ username }, { email }] } });
  if (existing) {
    return NextResponse.json({ success: false, message: 'Username or email already exists' }, { status: 400 });
  }

  // Validate referral if provided
  if (referral) {
    const refId = Number(referral);
    if (!refId || refId <= 0) {
      return NextResponse.json({ success: false, message: 'Invalid referral code' }, { status: 400 });
    }
    const referrer = await db.user.findFirst({ where: { id: refId } });
    if (!referrer) {
      return NextResponse.json({ success: false, message: 'Referral user not found' }, { status: 400 });
    }
  }

  // Generate OTP and store pending data
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const token = crypto.randomUUID();

  pendingUsers.set(token, {
    data: { firstname, lastname, username, email, password, referral },
    otp,
    createdAt: Date.now(),
  });

  try {
    await sendOTPEmail(email, otp);
  } catch (err) {
    console.error('OTP email send error:', err);
    pendingUsers.delete(token);
    return NextResponse.json({ success: false, message: 'Failed to send OTP email' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'OTP sent to email.', token, email });
}
