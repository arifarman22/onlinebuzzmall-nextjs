import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { requirePermission } from '@/lib/rbac';

export async function POST(req: NextRequest) {
  const guard = await requirePermission('users.edit');
  if (!guard.authorized) return guard.response;

  const { firstname, lastname, username, email, password, referral } = await req.json();

  if (!firstname || !lastname || !username || !email) {
    return NextResponse.json({ success: false, message: 'First name, last name, username and email are required' }, { status: 400 });
  }

  const existing = await db.user.findFirst({ where: { OR: [{ username }, { email }] } });
  if (existing) {
    return NextResponse.json({ success: false, message: 'Username or email already exists' }, { status: 400 });
  }

  let refBy = 0;
  if (referral) {
    const refId = Number(referral);
    if (!refId || refId <= 0) return NextResponse.json({ success: false, message: 'Invalid referral code' }, { status: 400 });
    const referrer = await db.user.findFirst({ where: { id: refId } });
    if (!referrer) return NextResponse.json({ success: false, message: 'Referral user not found' }, { status: 400 });
    refBy = referrer.id;
  }

  const hashedPassword = await bcrypt.hash(password || 'default123', 12);

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

  return NextResponse.json({ success: true, message: 'User created successfully.' });
}
