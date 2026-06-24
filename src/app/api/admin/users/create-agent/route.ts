import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/rbac';
import { sendOTPEmail } from '@/lib/email';

// In-memory store for pending agent creation
const pendingAgents = new Map<string, { data: any; otp: string; createdAt: number }>();

function cleanup() {
  const now = Date.now();
  for (const [key, val] of pendingAgents) {
    if (now - val.createdAt > 10 * 60 * 1000) pendingAgents.delete(key);
  }
}

export { pendingAgents };

export async function POST(req: NextRequest) {
  const guard = await requirePermission('users.edit');
  if (!guard.authorized) return guard.response;

  cleanup();

  const body = await req.json();
  const { firstname, lastname, username, email, password, referral, plan_id } = body;

  if (!firstname || !lastname || !username || !email || !password || !plan_id) {
    return NextResponse.json({ success: false, message: 'All fields including plan are required' }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ success: false, message: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const existing = await db.user.findFirst({ where: { OR: [{ username }, { email }] } });
  if (existing) {
    return NextResponse.json({ success: false, message: 'Username or email already exists' }, { status: 400 });
  }

  // Validate plan
  const plan = await db.plan.findUnique({ where: { id: Number(plan_id) } });
  if (!plan) {
    return NextResponse.json({ success: false, message: 'Invalid plan selected' }, { status: 400 });
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

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const token = crypto.randomUUID();

  pendingAgents.set(token, {
    data: { firstname, lastname, username, email, password, referral, plan_id: Number(plan_id) },
    otp,
    createdAt: Date.now(),
  });

  try {
    await sendOTPEmail(email, otp);
  } catch (err) {
    console.error('OTP email send error:', err);
    pendingAgents.delete(token);
    return NextResponse.json({ success: false, message: 'Failed to send OTP email' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'OTP sent to email.', token, email });
}
