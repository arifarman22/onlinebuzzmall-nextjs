import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  const search = req.nextUrl.searchParams.get('search') || '';
  const vip = req.nextUrl.searchParams.get('vip');
  const status = req.nextUrl.searchParams.get('status');

  const where: any = {};
  if (search) where.name = { contains: search };
  if (vip) where.vip_level = Number(vip);
  if (status) where.status = Number(status);

  const platforms = await db.platform.findMany({
    where,
    orderBy: { id: 'desc' },
    include: { _count: { select: { products: true } } },
  });

  return NextResponse.json({ success: true, data: platforms });
}
