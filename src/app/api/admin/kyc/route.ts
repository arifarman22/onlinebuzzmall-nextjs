import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get('status');
  const search = req.nextUrl.searchParams.get('search') || '';
  const page = Number(req.nextUrl.searchParams.get('page')) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status) where.kv = Number(status);
  else where.kv = { in: [1, 2, 3] }; // exclude kv=0 (not submitted)

  if (search) {
    where.OR = [
      { username: { contains: search } },
      { email: { contains: search } },
      { firstname: { contains: search } },
      { lastname: { contains: search } },
    ];
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: { id: true, username: true, email: true, firstname: true, lastname: true, kv: true, kyc_data: true, created_at: true },
      orderBy: { updated_at: 'desc' },
      skip,
      take: limit,
    }),
    db.user.count({ where }),
  ]);

  // Stats
  const [pending, approved, rejected] = await Promise.all([
    db.user.count({ where: { kv: 2 } }),
    db.user.count({ where: { kv: 1 } }),
    db.user.count({ where: { kv: 3 } }),
  ]);

  return NextResponse.json({
    success: true,
    data: users,
    stats: { pending, approved, rejected },
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { user_id, action, reason } = await req.json();

  if (!user_id || !action) {
    return NextResponse.json({ success: false, message: 'User ID and action required' }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: user_id } });
  if (!user) return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });

  if (action === 'approve') {
    await db.user.update({ where: { id: user_id }, data: { kv: 1 } });
    return NextResponse.json({ success: true, message: `KYC approved for ${user.username}` });
  }

  if (action === 'reject') {
    const kycData = (user.kyc_data as any) || {};
    kycData.rejection_reason = reason || 'Documents not acceptable';
    kycData.rejected_at = new Date().toISOString();
    await db.user.update({ where: { id: user_id }, data: { kv: 3, kyc_data: kycData } });
    return NextResponse.json({ success: true, message: `KYC rejected for ${user.username}` });
  }

  return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
}
