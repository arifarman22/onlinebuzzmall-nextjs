import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

// POST: Generate impersonation token
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  // Only Super Admin can impersonate
  const roleSlug = (session.user as any).roleSlug || '';
  if (roleSlug !== 'super-admin') {
    return NextResponse.json({ success: false, message: 'Only Super Admin can impersonate users' }, { status: 403 });
  }

  const { user_id } = await req.json();
  if (!user_id) return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });

  const user = await db.user.findUnique({ where: { id: user_id } });
  if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

  // Generate a short-lived impersonation token (5 minutes)
  if (!process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
  }
  const token = jwt.sign(
    { userId: user.id, adminId: Number(session.user.id), type: 'impersonate' },
    process.env.NEXTAUTH_SECRET,
    { expiresIn: '5m' }
  );

  // Log the impersonation
  await db.settingAuditLog.create({
    data: {
      admin_id: Number(session.user.id),
      key: 'admin_impersonate',
      old_value: `Admin logged in as user @${user.username}`,
      new_value: JSON.stringify({ user_id: user.id, username: user.username }),
    },
  });

  return NextResponse.json({ success: true, token });
}
